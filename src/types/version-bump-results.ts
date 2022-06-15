import type { ReleaseType } from '../release-type'

/**
 * Information about the work that was performed by the `versionBump()` function.
 */
export interface VersionBumpResults {
  /**
   * The release type that was used, or `undefined` if an explicit version number was used.
   */
  release?: ReleaseType

  /**
   * The previous version number in package.json.
   */
  oldVersion: string

  /**
   * The new version number.
   */
  newVersion: string

  /**
   * The commit message that was used for the git commit, or `false` if no git commit was created.
   *
   * NOTE: This will never be an empty string.  It will always contain at least the new version number.
   */
  commit: string | false

  /**
   * The tag name that was used for the git tag, or `false` if no git tag was created.
   *
   * NOTE: This will never be an empty string.  It will always contain at least the new version number.
   */
  tag: string | false

  /**
   * The files that were actually modified.
   */
  updatedFiles: string[]

  /**
   * The files that were not updated because they did not contain the old version number.
   */
  skippedFiles: string[]
}
