import type { GitCommit } from 'tiny-conventional-commits-parser'
import type { TruncationType } from 'verkit'
import type { BumpRelease, PromptRelease } from './normalize-options'
import type { Operation } from './operation'
import type { ReleaseType } from './release-type'
import process from 'node:process'
import { styleText } from 'node:util'
import prompts from 'prompts'
import * as verkit from 'verkit'
import { clean as cleanVersion, increment as incrementVersion, isValid as isValidVersion, normalize as normalizeVersion, parse as parseVersion } from 'verkit'
import { isPrerelease, releaseTypes } from './release-type'

/**
 * Determines the new version number, possibly by prompting the user for it.
 */
export async function getNewVersion(operation: Operation, commits: GitCommit[]): Promise<Operation> {
  const { release } = operation.options
  const { currentVersion } = operation.state

  switch (release.type) {
    case 'prompt':
      return promptForNewVersion(operation, commits)

    case 'version':
      return operation.update({
        newVersion: normalizeVersion(parseVersion(release.version, { loose: true }))!,
      })

    default:
      return operation.update({
        release: release.type,
        newVersion: getNextVersion(currentVersion, release, commits),
      })
  }
}

/**
 * Returns the next version number of the specified type.
 */
function getNextVersion(currentVersion: string, bump: BumpRelease, commits: GitCommit[]): string {
  const oldSemVer = parseVersion(currentVersion)

  let type: TruncationType
  if (bump.type === 'next') {
    type = oldSemVer.prerelease.length ? 'prerelease' : 'patch'
  }
  else if (bump.type === 'conventional') {
    type = oldSemVer.prerelease.length ? 'prerelease' : determineSemverChange(commits)
  }
  else {
    type = bump.type
  }

  return incrementVersion(oldSemVer, type, {
    identifier: bump.preid,
    identifierBase: isPrerelease(bump.type) ? 1 : undefined,
  })!
}

function determineSemverChange(commits: GitCommit[]) {
  let [hasMajor, hasMinor] = [false, false]
  for (const commit of commits) {
    if (commit.isBreaking) {
      hasMajor = true
    }
    else if (commit.type === 'feat') {
      hasMinor = true
    }
  }

  return hasMajor ? 'major' : hasMinor ? 'minor' : 'patch'
}

/**
 * Returns the next version number for all release types.
 */
function getNextVersions(currentVersion: string, preid: string, commits: GitCommit[]): Record<ReleaseType, string> {
  const next: Record<string, string> = {}

  const parsed = parseVersion(currentVersion)
  if (typeof parsed.prerelease[0] === 'string')
    preid = parsed.prerelease[0] || 'preid'

  for (const type of releaseTypes)
    next[type] = getNextVersion(currentVersion, { type, preid }, commits)

  return next
}

/**
 * Prompts the user for the new version number.
 *
 * @returns - A tuple containing the new version number and the release type (if any)
 */
async function promptForNewVersion(operation: Operation, commits: GitCommit[]): Promise<Operation> {
  const { currentVersion } = operation.state
  const release = operation.options.release as PromptRelease

  const next = getNextVersions(currentVersion, release.preid, commits)
  const configCustomVersion = await operation.options.customVersion?.(currentVersion, verkit)

  const PADDING = 13
  const answers = await prompts([
    {
      type: 'autocomplete',
      name: 'release',
      message: `Current version ${styleText('green', currentVersion)}`,
      initial: configCustomVersion ? 'config' : 'next',
      choices: [
        { value: 'major', title: `${'major'.padStart(PADDING, ' ')} ${styleText('bold', next.major)}` },
        { value: 'minor', title: `${'minor'.padStart(PADDING, ' ')} ${styleText('bold', next.minor)}` },
        { value: 'patch', title: `${'patch'.padStart(PADDING, ' ')} ${styleText('bold', next.patch)}` },
        { value: 'next', title: `${'next'.padStart(PADDING, ' ')} ${styleText('bold', next.next)}` },
        { value: 'conventional', title: `${'conventional'.padStart(PADDING, ' ')} ${styleText('bold', next.conventional)}` },
        ...configCustomVersion
          ? [
              { value: 'config', title: `${'from config'.padStart(PADDING, ' ')} ${styleText('bold', configCustomVersion)}` },
            ]
          : [],
        { value: 'prepatch', title: `${'pre-patch'.padStart(PADDING, ' ')} ${styleText('bold', next.prepatch)}` },
        { value: 'preminor', title: `${'pre-minor'.padStart(PADDING, ' ')} ${styleText('bold', next.preminor)}` },
        { value: 'premajor', title: `${'pre-major'.padStart(PADDING, ' ')} ${styleText('bold', next.premajor)}` },
        { value: 'none', title: `${'as-is'.padStart(PADDING, ' ')} ${styleText('bold', currentVersion)}` },
        { value: 'custom', title: 'custom ...'.padStart(PADDING + 4, ' ') },
      ],
    },
    {
      type: prev => prev === 'custom' ? 'text' : null,
      name: 'custom',
      message: 'Enter the new version number:',
      initial: currentVersion,
      validate: (custom: string) => {
        return isValidVersion(custom) ? true : 'That\'s not a valid version number'
      },
    },
  ]) as {
    release: ReleaseType | 'none' | 'custom' | 'config'
    custom?: string
  }

  const newVersion = answers.release === 'none'
    ? currentVersion
    : answers.release === 'custom'
      ? cleanVersion(answers.custom!)!
      : answers.release === 'config'
        ? cleanVersion(configCustomVersion!)
        : next[answers.release]

  if (!newVersion)
    process.exit(1)

  switch (answers.release) {
    case 'custom':
    case 'config':
    case 'next':
    case 'conventional':
    case 'none':
      return operation.update({ newVersion })

    default:
      return operation.update({ release: answers.release, newVersion })
  }
}
