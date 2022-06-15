import { bold, green } from 'kleur'
import prompts from 'prompts'
import semver, { SemVer, clean as cleanVersion, valid as isValidVersion } from 'semver'
import type { BumpRelease, PromptRelease } from './normalize-options'
import type { Operation } from './operation'
import type { ReleaseType } from './release-type'
import { isPrerelease, releaseTypes } from './release-type'

/**
 * Determines the new version number, possibly by prompting the user for it.
 */
export async function getNewVersion(operation: Operation): Promise<Operation> {
  const { release } = operation.options
  const { oldVersion } = operation.state

  switch (release.type) {
    case 'prompt':
      return promptForNewVersion(operation)

    case 'version':
      return operation.update({
        newVersion: new SemVer(release.version, true).version,
      })

    default:
      return operation.update({
        release: release.type,
        newVersion: getNextVersion(oldVersion, release),
      })
  }
}

/**
 * Returns the next version number of the specified type.
 */
function getNextVersion(oldVersion: string, bump: BumpRelease): string {
  const oldSemVer = new SemVer(oldVersion)
  const newSemVer = oldSemVer.inc(bump.type as any, bump.preid)

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

/**
 * Returns the next version number for all release types.
 */
function getNextVersions(oldVersion: string, preid: string): Record<ReleaseType | 'next', string> {
  const next: Record<string, string> = {}

  const parse = semver.parse(oldVersion)
  if (typeof parse?.prerelease[0] === 'string')
    preid = parse?.prerelease[0] || 'preid'

  for (const type of releaseTypes)
    next[type] = semver.inc(oldVersion, type, preid)!

  next.next = parse?.prerelease?.length
    ? semver.inc(oldVersion, 'prerelease', preid)!
    : semver.inc(oldVersion, 'patch')!

  return next
}

/**
 * Prompts the user for the new version number.
 *
 * @returns - A tuple containing the new version number and the release type (if any)
 */
async function promptForNewVersion(operation: Operation): Promise<Operation> {
  const { oldVersion } = operation.state
  const release = operation.options.release as PromptRelease

  const next = getNextVersions(oldVersion, release.preid)

  const PADDING = 13
  const answers = await prompts([
    {
      type: 'autocomplete',
      name: 'release',
      message: `Current version ${green(oldVersion)}`,
      initial: 'next',
      choices: [
        { value: 'major', title: `${'major'.padStart(PADDING, ' ')} ${bold(next.major)}` },
        { value: 'minor', title: `${'minor'.padStart(PADDING, ' ')} ${bold(next.minor)}` },
        { value: 'patch', title: `${'patch'.padStart(PADDING, ' ')} ${bold(next.patch)}` },
        { value: 'next', title: `${'next'.padStart(PADDING, ' ')} ${bold(next.next)}` },
        { value: 'prerelease', title: `${'pre-release'.padStart(PADDING, ' ')} ${bold(next.prerelease)}` },
        { value: 'none', title: `${'as-is'.padStart(PADDING, ' ')} ${bold(oldVersion)}` },
        { value: 'custom', title: 'custom ...'.padStart(PADDING + 4, ' ') },
      ],
    },
    {
      type: prev => prev === 'custom' ? 'text' : null,
      name: 'custom',
      message: 'Enter the new version number:',
      initial: oldVersion,
      validate: (custom: string) => {
        return isValidVersion(custom) ? true : 'That\'s not a valid version number'
      },
    },
  ]) as {
    release: ReleaseType | 'next' | 'none' | 'custom'
    custom?: string
  }

  const newVersion = answers.release === 'none'
    ? oldVersion
    : answers.release === 'custom'
      ? cleanVersion(answers.custom!)!
      : next[answers.release]

  if (!newVersion)
    process.exit(1)

  switch (answers.release) {
    case 'custom':
    case 'next':
    case 'none':
      return operation.update({ newVersion })

    default:
      return operation.update({ release: answers.release, newVersion })
  }
}
