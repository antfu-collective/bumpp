import type { Operation } from './operation'
import { x } from 'tinyexec'
import { buildTokens, renderTemplate } from './tokens'
import { ProgressEvent } from './types/version-bump-progress'

/**
 * Commits the modififed files to Git, if the `commit` option is enabled.
 */
export async function gitCommit(operation: Operation): Promise<Operation> {
  if (!operation.options.commit)
    return operation

  const { all, noVerify, message } = operation.options.commit
  const { updatedFiles } = operation.state
  let args = ['--allow-empty']

  if (all) {
    // Commit ALL files, not just the ones that were bumped
    args.push('--all')
  }

  if (noVerify) {
    // Bypass git commit hooks
    args.push('--no-verify')
  }
  // Sign the commit with a GPG/SSH key
  if (operation.options.sign) {
    args.push('--gpg-sign')
  }

  // Create the commit message
  const commitMessage = renderTemplate(message, buildTokens(operation))
  args.push('--message', commitMessage)

  // Append the file names last, as variadic arguments
  if (!all)
    args = [...args, ...updatedFiles]

  await x('git', ['commit', ...args], { throwOnError: true, nodeOptions: { stdio: 'inherit' } })

  return operation.update({ event: ProgressEvent.GitCommit, commitMessage })
}

/**
 * Tags the Git commit, if the `tag` option is enabled.
 */
export async function gitTag(operation: Operation): Promise<Operation> {
  if (!operation.options.tag)
    return operation

  const { commit, tag } = operation.options
  const tokens = buildTokens(operation)

  const args = [
    // Create an annotated tag, which is recommended for releases.
    // See https://git-scm.com/docs/git-tag
    '--annotate',

    // Use the same commit message for the tag
    '--message',
    renderTemplate(commit!.message, tokens),
  ]

  // Create the Tag name
  const tagName = renderTemplate(tag.name, tokens)
  args.push(tagName)

  // Sign the tag with a GPG/SSH key
  if (operation.options.sign) {
    args.push('--sign')
  }

  await x('git', ['tag', ...args], { throwOnError: true, nodeOptions: { stdio: 'inherit' } })

  return operation.update({ event: ProgressEvent.GitTag, tagName })
}

/**
 * Pushes the Git commit and tag, if the `push` option is enabled.
 */
export async function gitPush(operation: Operation): Promise<Operation> {
  if (!operation.options.push)
    return operation

  // Push the commit
  await x('git', ['push'], { throwOnError: true, nodeOptions: { stdio: 'inherit' } })

  if (operation.options.tag) {
    // Push the tag
    await x('git', ['push', '--tags'], { throwOnError: true, nodeOptions: { stdio: 'inherit' } })
  }

  return operation.update({ event: ProgressEvent.GitPush })
}

/**
 * Accepts a version string template (e.g. "release v" or "This is the %s release").
 * If the template contains any "%s" placeholders, then they are replaced with the version number;
 * otherwise, the version number is appended to the string.
 *
 * @deprecated Use {@link renderTemplate} with named tokens (e.g. `{version}`) instead.
 */
export function formatVersionString(template: string, newVersion: string): string {
  if (template.includes('%s'))
    return template.replaceAll('%s', newVersion)

  else
    return template + newVersion
}

// ---------------------------------------------------------------------------
// Low-level git helpers (used by the pull-request release flow)
// ---------------------------------------------------------------------------

async function git(args: string[]): Promise<{ exitCode: number | undefined, stdout: string, stderr: string }> {
  const result = await x('git', args, { throwOnError: false })
  return { exitCode: result.exitCode, stdout: result.stdout.trim(), stderr: result.stderr.trim() }
}

/**
 * Returns `true` if the git working tree has no uncommitted changes.
 */
export async function isWorkingTreeClean(): Promise<boolean> {
  const { stdout } = await git(['status', '--porcelain'])
  return stdout === ''
}

/**
 * Returns the name of the currently checked-out branch.
 */
export async function getCurrentBranch(): Promise<string> {
  const { stdout } = await git(['rev-parse', '--abbrev-ref', 'HEAD'])
  return stdout
}

/**
 * Detects the remote's default branch (e.g. `main`) via `origin/HEAD`.
 * Falls back to `main` if it cannot be determined.
 */
export async function getDefaultBranch(): Promise<string> {
  const symbolic = await git(['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD'])
  if (symbolic.exitCode === 0 && symbolic.stdout)
    return symbolic.stdout.replace(/^refs\/remotes\/origin\//, '')

  const abbrev = await git(['rev-parse', '--abbrev-ref', 'origin/HEAD'])
  if (abbrev.exitCode === 0 && abbrev.stdout)
    return abbrev.stdout.replace(/^origin\//, '')

  return 'main'
}

/**
 * Fetches the given branch from `origin` (best effort).
 */
export async function gitFetch(branch: string): Promise<void> {
  await git(['fetch', 'origin', branch])
}

/**
 * Returns `true` if the local `branch` is behind `origin/<branch>`.
 */
export async function isBehindRemote(branch: string): Promise<boolean> {
  const { exitCode, stdout } = await git(['rev-list', '--count', `${branch}..origin/${branch}`])
  if (exitCode !== 0)
    return false
  return Number(stdout) > 0
}

/**
 * Returns `true` if a local branch with the given name exists.
 */
export async function localBranchExists(name: string): Promise<boolean> {
  const { exitCode } = await git(['show-ref', '--verify', '--quiet', `refs/heads/${name}`])
  return exitCode === 0
}

/**
 * Returns `true` if a branch with the given name exists on `origin`.
 */
export async function remoteBranchExists(name: string): Promise<boolean> {
  const { stdout } = await git(['ls-remote', '--heads', 'origin', name])
  return stdout !== ''
}

/**
 * Creates and checks out a new branch from the current HEAD.
 * If `force` is set, resets an existing branch of the same name.
 */
export async function checkoutNewBranch(name: string, force = false): Promise<void> {
  await x('git', ['checkout', force ? '-B' : '-b', name], { throwOnError: true, nodeOptions: { stdio: 'inherit' } })
}

/**
 * Checks out an existing branch.
 */
export async function checkoutBranch(name: string): Promise<void> {
  await x('git', ['checkout', name], { throwOnError: true, nodeOptions: { stdio: 'inherit' } })
}

/**
 * Deletes a local branch (best effort, force).
 */
export async function deleteLocalBranch(name: string): Promise<void> {
  await git(['branch', '-D', name])
}

/**
 * Pushes the given branch to `origin`, setting it as upstream.
 */
export async function pushBranch(name: string, force = false): Promise<void> {
  const args = ['push', '--set-upstream', 'origin', name]
  if (force)
    args.push('--force-with-lease')
  await x('git', args, { throwOnError: true, nodeOptions: { stdio: 'inherit' } })
}

export interface GithubRepo {
  owner: string
  repo: string
}

/**
 * Parses the `origin` remote URL into a GitHub `{ owner, repo }`, or returns
 * `undefined` if the remote is missing or not a GitHub URL.
 */
export async function getGithubRepo(): Promise<GithubRepo | undefined> {
  const { exitCode, stdout } = await git(['remote', 'get-url', 'origin'])
  if (exitCode !== 0 || !stdout)
    return undefined

  // git@github.com:owner/repo.git  |  https://github.com/owner/repo.git
  const match = stdout.match(/github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/)
  if (!match)
    return undefined

  return { owner: match[1], repo: match[2] }
}
