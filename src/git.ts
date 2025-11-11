import type { Operation } from './operation'
import { x } from 'tinyexec'
import { ProgressEvent } from './types/version-bump-progress'
import { getRecentCommits, GitCommit } from 'tiny-conventional-commits-parser'

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
  if (!operation.options.tag || operation.options.tag?.commit === false)
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

/**
 * Gets the recent commits from the Git repository.
 * Will try to find the last matching tag and then get the recent commits since then.
 * (tiny-conventional-commits-parser will fall back to commits since the last tag of any kind,
 * so narrowing it down based on the info we get from the user.)
 */
export async function getLatestCommits(operation: Operation): Promise<GitCommit[]> {
  const tagTemplate = operation.options.tag?.name ? formatVersionString(operation.options.tag.name, '*') : 'v*'
  // This is what tiny-conventional-commits-parser would run anyway if we didn't provide a tag (minus the tag filter)
  const tag = (await x('git', ['describe', '--tags', '--abbrev=0', '--match', tagTemplate], { throwOnError: false }))
    .stdout.split('\n').at(0)
  if (tag) {
    return getRecentCommits(tag, undefined, operation.options.commitsPathFilter)
  }
  const root = (await x('git', ['rev-list', '--max-parents=0', 'HEAD'], { throwOnError: false }))
    .stdout.trim()
  return getRecentCommits(root, undefined, operation.options.commitsPathFilter)
}
