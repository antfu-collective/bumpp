import type { VersionBumpResults } from './version-bump-results'

/**
 * Progress events that indicate the progress of the `versionBump()` function.
 */
export const enum ProgressEvent {
  FileUpdated = 'file updated',
  FileSkipped = 'file skipped',
  GitCommit = 'git commit',
  GitTag = 'git tag',
  GitPush = 'git push',
  NpmScript = 'npm script',
}

/**
 * The NPM version scripts
 *
 * @see https://docs.npmjs.com/cli/version.html
 */
export const enum NpmScript {
  PreVersion = 'preversion',
  Version = 'version',
  PostVersion = 'postversion',
}

/**
 * Information about the progress of the `versionBump()` function.
 */
export interface VersionBumpProgress extends VersionBumpResults {
  event: ProgressEvent
  script?: NpmScript
}
