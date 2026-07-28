import type { GitCommit } from 'tiny-conventional-commits-parser'
import type { NormalizedPullRequestOptions } from './normalize-options'
import type { Operation } from './operation'
import type { TemplateTokens } from './tokens'
import { styleText } from 'node:util'
import prompts from 'prompts'
import { x } from 'tinyexec'
import { symbols } from './cli/symbols'
import {
  checkoutBranch,
  checkoutNewBranch,
  deleteLocalBranch,
  getCurrentBranch,
  getDefaultBranch,
  getGithubRepo,
  gitFetch,
  isBehindRemote,
  isWorkingTreeClean,
  localBranchExists,
  pushBranch,
  remoteBranchExists,
} from './git'
import { buildTokens, renderTemplate } from './tokens'

/**
 * Mutable state carried through the pull-request release flow.
 */
export interface PrContext {
  /** The branch the user was on when the release started. */
  originalBranch: string
  /** The branch the pull request targets. */
  baseBranch: string
  /** The release branch that is created (resolved once the version is known). */
  branchName: string
  /** Whether the release branch already existed and must be force-pushed. */
  forcePush: boolean
}

async function confirm(message: string, initial = true): Promise<boolean> {
  const { yes } = await prompts({ name: 'yes', type: 'confirm', message, initial })
  return Boolean(yes)
}

/**
 * Verifies the repository is in a good state to start a pull-request release:
 * clean working tree, on the base branch, and not behind the remote.
 *
 * When `interactive` is `true`, unmet non-fatal conditions prompt the user;
 * otherwise they throw.
 */
export async function checkPrPreconditions(operation: Operation, interactive: boolean): Promise<PrContext> {
  const pr = operation.options.pr!

  if (!(await isWorkingTreeClean()))
    throw new Error('Git working tree is not clean. Commit or stash your changes before releasing.')

  const originalBranch = await getCurrentBranch()
  const baseBranch = pr.base || (await getDefaultBranch())

  if (originalBranch !== baseBranch) {
    const message = `You are on branch "${originalBranch}", but the expected base branch is "${baseBranch}".`
    if (!interactive)
      throw new Error(`${message} Switch to "${baseBranch}" or set \`pr.base\`.`)
    console.log(symbols.info, message)
    if (!(await confirm('Continue anyway?', false)))
      throw new Error('Aborted.')
  }

  // Make sure the base branch isn't behind its remote, so the release isn't
  // based on a stale base.
  await gitFetch(baseBranch)
  if (await isBehindRemote(baseBranch)) {
    const message = `Local "${baseBranch}" is behind "origin/${baseBranch}".`
    if (!interactive)
      throw new Error(`${message} Pull the latest changes before releasing.`)
    console.log(symbols.info, message)
    if (!(await confirm('Continue anyway?', false)))
      throw new Error('Aborted.')
  }

  return { originalBranch, baseBranch, branchName: '', forcePush: false }
}

/**
 * Creates and checks out the release branch. Handles the case where the branch
 * already exists (locally or on the remote).
 */
export async function startPrBranch(operation: Operation, ctx: PrContext, interactive: boolean): Promise<void> {
  const pr = operation.options.pr!
  const tokens = buildTokens(operation)
  ctx.branchName = renderTemplate(pr.branch, tokens)

  const [existsLocal, existsRemote] = await Promise.all([
    localBranchExists(ctx.branchName),
    remoteBranchExists(ctx.branchName),
  ])

  if (existsLocal || existsRemote) {
    const where = [existsLocal && 'locally', existsRemote && 'on origin'].filter(Boolean).join(' and ')
    const message = `Release branch "${ctx.branchName}" already exists ${where}.`
    if (!interactive)
      throw new Error(`${message} Delete it or re-run without --yes to recreate it.`)
    console.log(symbols.info, message)
    if (!(await confirm('Recreate it and force-push?', false)))
      throw new Error('Aborted.')
    ctx.forcePush = true
  }

  await checkoutNewBranch(ctx.branchName, ctx.forcePush)
  console.log(symbols.success, `Created release branch ${styleText('bold', ctx.branchName)}`)
}

/**
 * Pushes the release branch, returns to the original branch, and offers to open
 * a pull request (or prints instructions when `gh` is unavailable).
 */
export async function finishPrRelease(
  operation: Operation,
  ctx: PrContext,
  commits: GitCommit[],
  interactive: boolean,
): Promise<void> {
  const pr = operation.options.pr!
  const tokens = buildTokens(operation)

  // Push the release branch to origin.
  await pushBranch(ctx.branchName, ctx.forcePush)
  console.log(symbols.success, `Pushed ${styleText('bold', ctx.branchName)} to origin`)

  // Return to the original branch, leaving local state untouched.
  await checkoutBranch(ctx.originalBranch)

  const title = renderTemplate(pr.title ?? operation.options.commit!.message, tokens)
  const body = resolveBody(pr, tokens, commits)

  const repo = await getGithubRepo()
  const ghReady = await isGhAvailable()

  if (!ghReady || !repo) {
    printManualInstructions(repo, ctx, title, body, pr.draft)
    return
  }

  const shouldCreate = interactive ? await confirm(`Create pull request from "${ctx.branchName}" into "${ctx.baseBranch}"?`) : true
  if (!shouldCreate) {
    printManualInstructions(repo, ctx, title, body, pr.draft)
    return
  }

  const args = [
    'pr',
    'create',
    '--base',
    ctx.baseBranch,
    '--head',
    ctx.branchName,
    '--title',
    title,
    '--body',
    body,
  ]
  if (pr.draft)
    args.push('--draft')

  const result = await x('gh', args, { throwOnError: false })
  if (result.exitCode === 0) {
    const url = result.stdout.trim()
    console.log(symbols.success, `Pull request created${url ? `: ${styleText(['cyan', 'bold'], url)}` : ''}`)
  }
  else {
    console.log(styleText('yellow', 'Failed to create the pull request via `gh`.'))
    if (result.stderr.trim())
      console.log(styleText('gray', result.stderr.trim()))
    printManualInstructions(repo, ctx, title, body, pr.draft)
  }
}

/**
 * Best-effort restore of the repository after a failed PR release: return to the
 * original branch and delete the local release branch.
 */
export async function cleanupPrBranch(ctx: PrContext): Promise<void> {
  try {
    const current = await getCurrentBranch()
    if (current !== ctx.originalBranch)
      await checkoutBranch(ctx.originalBranch)
    if (ctx.branchName)
      await deleteLocalBranch(ctx.branchName)
  }
  catch {
    // Best effort — don't mask the original error.
  }
}

function resolveBody(
  pr: NormalizedPullRequestOptions,
  tokens: TemplateTokens,
  commits: GitCommit[],
): string {
  if (typeof pr.body === 'function')
    return pr.body(tokens)
  if (typeof pr.body === 'string')
    return renderTemplate(pr.body, tokens)
  return defaultPrBody(tokens, commits)
}

function defaultPrBody(tokens: TemplateTokens, commits: GitCommit[]): string {
  const lines: string[] = [
    `Release \`${tokens.tag}\` (\`${tokens.oldVersion}\` → \`${tokens.version}\`).`,
  ]

  if (commits.length) {
    lines.push('', '### Commits', '')
    for (const commit of commits) {
      const scope = commit.scope ? `(${commit.scope})` : ''
      const type = commit.type ? `${commit.type}${scope}: ` : ''
      lines.push(`- ${type}${commit.description} (${commit.shortHash})`)
    }
  }

  return lines.join('\n')
}

async function isGhAvailable(): Promise<boolean> {
  const version = await x('gh', ['--version'], { throwOnError: false })
  if (version.exitCode !== 0)
    return false
  const auth = await x('gh', ['auth', 'status'], { throwOnError: false })
  return auth.exitCode === 0
}

function printManualInstructions(
  repo: { owner: string, repo: string } | undefined,
  ctx: PrContext,
  title: string,
  body: string,
  draft: boolean,
): void {
  console.log()
  console.log(symbols.info, 'Skipped automatic pull request creation.')
  if (repo) {
    const url = `https://github.com/${repo.owner}/${repo.repo}/compare/${encodeURIComponent(ctx.baseBranch)}...${encodeURIComponent(ctx.branchName)}?expand=1`
    console.log(`  Open a pull request here: ${styleText(['cyan', 'bold'], url)}`)
  }
  else {
    console.log('  Open a pull request from your release branch on your Git host.')
  }
  console.log(`  ${styleText('gray', 'branch')} ${ctx.branchName} ${styleText('gray', '→')} ${ctx.baseBranch}`)
  console.log(`  ${styleText('gray', 'title ')} ${title}`)
  if (draft)
    console.log(`  ${styleText('gray', 'draft ')} yes`)
  console.log()
  console.log(styleText('gray', body.split('\n').map(l => `  ${l}`).join('\n')))
  console.log()
}
