import type { GitCommit } from 'tiny-conventional-commits-parser'
import type { BumpRelease, PromptRelease } from './normalize-options'
import type { Operation } from './operation'
import type { ReleaseType } from './release-type'
import process from 'node:process'
import c from 'ansis'
import prompts from 'prompts'
import semver, { clean as cleanVersion, valid as isValidVersion, SemVer } from 'semver'
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
        newVersion: new SemVer(release.version, true).version,
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
  const oldSemVer = new SemVer(currentVersion)

  let type: ReleaseType
  if (bump.type === 'next') {
    type = oldSemVer.prerelease.length ? 'prerelease' : 'patch'
  }
  else if (bump.type === 'conventional') {
    type = oldSemVer.prerelease.length ? 'prerelease' : determineSemverChange(commits)
  }
  else {
    type = bump.type
  }

  const newSemVer = oldSemVer.inc(type, bump.preid)

  if (
    isPrerelease(bump.type)
    && newSemVer.prerelease.length === 2
    && newSemVer.prerelease[0] === bump.preid
    && String(newSemVer.prerelease[1]) === '0'
  ) {
    // This is a special case when going from a non-prerelease version to a prerelease version.
    // SemVer sets the prerelease version to zero (e.g. "1.23.456" => "1.23.456-beta.0").
    // But the user probably expected it to be "1.23.456-beta.1" instead.
    // @ts-expect-error - TypeScript thinks this array is read-only
    newSemVer.prerelease[1] = '1'
    newSemVer.format()
  }

  return newSemVer.version
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

  const parse = semver.parse(currentVersion)
  if (typeof parse?.prerelease[0] === 'string')
    preid = parse?.prerelease[0] || 'preid'

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
  const configCustomVersion = await operation.options.customVersion?.(currentVersion, semver)

  const PADDING = 13
  const answers = await prompts([
    {
      type: 'autocomplete',
      name: 'release',
      message: `Current version ${c.green(currentVersion)}`,
      initial: configCustomVersion ? 'config' : 'next',
      choices: [
        { value: 'major', title: `${'major'.padStart(PADDING, ' ')} ${c.bold(next.major)}` },
        { value: 'minor', title: `${'minor'.padStart(PADDING, ' ')} ${c.bold(next.minor)}` },
        { value: 'patch', title: `${'patch'.padStart(PADDING, ' ')} ${c.bold(next.patch)}` },
        { value: 'next', title: `${'next'.padStart(PADDING, ' ')} ${c.bold(next.next)}` },
        { value: 'conventional', title: `${'conventional'.padStart(PADDING, ' ')} ${c.bold(next.conventional)}` },
        ...configCustomVersion
          ? [
              { value: 'config', title: `${'from config'.padStart(PADDING, ' ')} ${c.bold(configCustomVersion)}` },
            ]
          : [],
        { value: 'prepatch', title: `${'pre-patch'.padStart(PADDING, ' ')} ${c.bold(next.prepatch)}` },
        { value: 'preminor', title: `${'pre-minor'.padStart(PADDING, ' ')} ${c.bold(next.preminor)}` },
        { value: 'premajor', title: `${'pre-major'.padStart(PADDING, ' ')} ${c.bold(next.premajor)}` },
        { value: 'none', title: `${'as-is'.padStart(PADDING, ' ')} ${c.bold(currentVersion)}` },
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
