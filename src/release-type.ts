import { ReleaseType } from 'semver'

export { ReleaseType }

/**
 * The different types of pre-releases.
 */
export const prereleaseTypes: ReleaseType[] = ['premajor', 'preminor', 'prepatch', 'prerelease']

/**
 * Simply jump to the next version number
 */
export const nextType = 'next'

/**
 * All possible release types.
 */
export const releaseTypes: ReleaseType[] = prereleaseTypes.concat(['major', 'minor', 'patch'])

/**
 * Determines whether the specified value is a pre-release.
 */
export function isPrerelease(value: any): boolean {
  return prereleaseTypes.includes(value)
}

/**
 * Determines whether the specified value is a valid ReleaseType string.
 */
export function isReleaseType(value: any): value is ReleaseType {
  return releaseTypes.includes(value)
}

/**
 * Determines whether the next value is a valid ReleaseType string.
 */
export function isNextReleaseType(value: string): value is ReleaseType {
  return nextType === value
}
