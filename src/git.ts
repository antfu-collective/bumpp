import type { Operation } from './operation'
import { x } from 'tinyexec'
import { ProgressEvent } from './types/version-bump-progress'

/**
 * Commits the modififed files to Git, if the `commit` option is enabled.
 */
export async function gitCommit(operation: Operation): Promise<Operation> {
  if (!operation.options.commit)
    return operation

  const { all, noVerify, message } = operation.options.commit
  const { updatedFiles, newVersion } = operation.state
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
  const commitMessage = formatVersionString(message, newVersion)
  args.push('--message', commitMessage)

  // Append the file names last, as variadic arguments
  if (!all)
    args = args.concat(updatedFiles)

  await x('git', ['commit', ...args], { throwOnError: true })

  return operation.update({ event: ProgressEvent.GitCommit, commitMessage })
}

/**
 * Tags the Git commit, if the `tag` option is enabled.
 */
export async function gitTag(operation: Operation): Promise<Operation> {
  if (!operation.options.tag)
    return operation

  const { commit, tag } = operation.options
  const { newVersion } = operation.state

  const args = [
    // Create an annotated tag, which is recommended for releases.
    // See https://git-scm.com/docs/git-tag
    '--annotate',

    // Use the same commit message for the tag
    '--message',
    formatVersionString(commit!.message, newVersion),
  ]

  // Create the Tag name
  const tagName = formatVersionString(tag.name, newVersion)
  args.push(tagName)

  // Sign the tag with a GPG/SSH key
  if (operation.options.sign) {
    args.push('--sign')
  }

  await x('git', ['tag', ...args], { throwOnError: true })

  return operation.update({ event: ProgressEvent.GitTag, tagName })
}

/**
 * Pushes the Git commit and tag, if the `push` option is enabled.
 */
export async function gitPush(operation: Operation): Promise<Operation> {
  if (!operation.options.push)
    return operation

  // Push the commit
  await x('git', ['push'], { throwOnError: true })

  if (operation.options.tag) {
    // Push the tag
    await x('git', ['push', '--tags'], { throwOnError: true })
  }

  return operation.update({ event: ProgressEvent.GitPush })
}

/**
 * Accepts a version string template (e.g. "release v" or "This is the %s release").
 * If the template contains any "%s" placeholders, then they are replaced with the version number;
 * otherwise, the version number is appended to the string.
 */
export function formatVersionString(template: string, newVersion: string): string {
  if (template.includes('%s'))
    return template.replace(/%s/g, newVersion)

  else
    return template + newVersion
}

export async function getLastGitTag() {
  return (await x(
    'git',
    ['describe', '--tags', '--abbrev=0'],
    { nodeOptions: { stdio: 'pipe' }, throwOnError: false },
  )).stdout.split('\n').at(0) || undefined
}

export interface GitCommitAuthor {
  name: string
  email: string
}

export interface RawGitCommit {
  message: string
  body: string
  shortHash: string
  author: GitCommitAuthor
}

export interface Reference {
  type: 'hash' | 'issue' | 'pull-request'
  value: string
}

export interface GitCommit extends Omit<RawGitCommit, 'author'> {
  description: string
  type: string
  scope: string
  references: Reference[]
  authors: GitCommitAuthor[]
  isBreaking: boolean
}

export async function getGitDiff(
  from: string | undefined,
  to = 'HEAD',
): Promise<string> {
  // https://git-scm.com/docs/pretty-formats
  const r = await x(
    'git',
    ['--no-pager', 'log', from ? `${from}...${to}` : to, '--pretty="----%n%s|%h|%an|%ae%n%b"'],
  )
  return r.stdout
}

// https://www.conventionalcommits.org/en/v1.0.0/
// https://regex101.com/r/FSfNvA/1
const ConventionalCommitRegex
  = /(?<emoji>:.+:|(\uD83C[\uDF00-\uDFFF])|(\uD83D[\uDC00-\uDE4F\uDE80-\uDEFF])|[\u2600-\u2B55])?( *)(?<type>[a-z]+)(\((?<scope>.+)\))?(?<breaking>!)?: (?<description>.+)/i
// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-misleading-capturing-group
const CoAuthoredByRegex = /co-authored-by:\s*(?<name>.+)(<(?<email>.+)>)/gi
const PullRequestRE = /\([ a-z]*(#\d+)\s*\)/g
const IssueRE = /(#\d+)/g

export function parseCommits(commits: string): GitCommit[] {
  return commits.split('----\n')
    .splice(1)
    .map((commit) => {
      const [firstLine, ..._body] = commit.split('\n')
      const [message, shortHash, authorName, authorEmail] = firstLine.split('|')
      const body = _body.filter(Boolean).join('\n')

      const match = message.match(ConventionalCommitRegex)

      const type = match?.groups?.type || ''
      const hasBreakingBody = /breaking change:/i.test(body)
      const scope = match?.groups?.scope || ''

      const isBreaking = Boolean(match?.groups?.breaking || hasBreakingBody)
      let description = match?.groups?.description || message

      // Extract references from message
      const references: Reference[] = []
      for (const m of description.matchAll(PullRequestRE)) {
        references.push({ type: 'pull-request', value: m[1] })
      }
      for (const m of description.matchAll(IssueRE)) {
        if (!references.some(i => i.value === m[1])) {
          references.push({ type: 'issue', value: m[1] })
        }
      }
      references.push({ value: shortHash, type: 'hash' })

      // Remove references and normalize
      description = description.replace(PullRequestRE, '').trim()

      // Find all authors
      const authors: GitCommitAuthor[] = [{ name: authorName, email: authorEmail }]
      for (const match of body.matchAll(CoAuthoredByRegex)) {
        authors.push({
          name: (match.groups?.name || '').trim(),
          email: (match.groups?.email || '').trim(),
        })
      }

      return {
        shortHash,
        type,
        scope,
        message,
        description,
        body,
        authors,
        references,
        isBreaking,
      }
    })
}

export async function getRenentCommits() {
  const lastTag = await getLastGitTag()
  return await getGitDiff(lastTag, 'HEAD').then(parseCommits)
}
