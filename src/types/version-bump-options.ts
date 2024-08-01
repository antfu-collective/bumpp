import type _semver from 'semver'
import type { VersionBumpProgress } from './version-bump-progress'

/**
 * Options for the `versionBump()` function.
 */
export interface VersionBumpOptions {
  /**
   * The release version or type. Can be one of the following:
   *
   * - The new version number (e.g. "1.23.456")
   * - A release type (e.g. "major", "minor", "patch", "prerelease", etc.)
   * - "prompt" to prompt the user for the version number
   *
   * Defaults to "prompt".
   */
  release?: string

  /**
   * The current version number to be bumpped.
   * If not provide, it will be read from the first file in the `files` array.
   */
  currentVersion?: string

  /**
   * The prerelease type (e.g. "alpha", "beta", "next").
   *
   * Defaults to "beta".
   */
  preid?: string

  /**
   * Indicates whether to create a git commit. Can be set to a custom commit message string
   * or `true` to use "release v".  Any `%s` placeholders in the message string will be replaced
   * with the new version number.  If the message string does _not_ contain any `%s` placeholders,
   * then the new version number will be appended to the message.
   *
   * Defaults to `true`.
   */
  commit?: boolean | string

  /**
   * Indicates whether to tag the git commit. Can be set to a custom tag string
   * or `true` to use "v".  Any `%s` placeholders in the tag string will be replaced
   * with the new version number.  If the tag string does _not_ contain any `%s` placeholders,
   * then the new version number will be appended to the tag.
   *
   * Defaults to `true`.
   */
  tag?: boolean | string

  /**
   * Indicates whether to push the git commit and tag.
   *
   * Defaults to `true`.
   */
  push?: boolean

  /**
   * Indicates whether the git commit should include ALL files (`git commit --all`)
   * rather than just the files that were modified by `versionBump()`.
   *
   * Defaults to `false`.
   */
  all?: boolean

  /**
   * Prompt for confirmation
   *
   * @default true
   */
  confirm?: boolean

  /**
   * Indicates whether to bypass git commit hooks (`git commit --no-verify`).
   *
   * Defaults to `false`.
   */
  noVerify?: boolean

  /**
   * The files to be updated. For certain known files ("package.json", "bower.json", etc.)
   * `versionBump()` will explicitly update the file's version number.  For other files
   * (ReadMe files, config files, source code, etc.) it will simply do a global replacement
   * of the old version number with the new version number.
   *
   * Defaults to ["package.json", "package-lock.json", "jsr.json", "jsr.jsonc", "deno.json", "deno.jsonc"].
   */
  files?: string[]

  /**
   * The working directory, which is used as the basis for locating all files.
   *
   * Defaults to `process.cwd()`
   */
  cwd?: string

  /**
   * Options for the command-line interface. Can be one of the following:
   *
   * - `true` - To default to `process.stdin` and `process.stdout`.
   * - `false` - To disable all CLI output. Cannot be used when `release` is "prompt".
   * - An object that will be passed to `readline.createInterface()`.
   *
   * Defaults to `true`.
   */
  interface?: boolean | InterfaceOptions

  /**
   * Indicates whether to ignore version scripts.
   *
   * Defaults to `false`.
   */
  ignoreScripts?: boolean

  /**
   * A callback that is provides information about the progress of the `versionBump()` function.
   */
  progress?: (progress: VersionBumpProgress) => void

  /**
   * Excute additional command after bumping and before commiting
   */
  execute?: string

  /**
   * Bump the files recursively for monorepo. Only works without `files` option.
   *
   * @default false
   */
  recursive?: boolean

  /**
   * Custom function to provide the version number
   */
  customVersion?: (currentVersion: string, semver: typeof _semver) => Promise<string | void> | string | void
}

/**
 * Options for the command-line interface.
 */
export interface InterfaceOptions {
  /**
   * The stream that will be used to read user input.  Can be one of the following:
   *
   * - `true` - To default to `process.stdin`
   * - `false` - To disable all CLI input
   * - Any readable stream
   *
   * Defaults to `true`.
   */
  input?: NodeJS.ReadableStream | NodeJS.ReadStream | boolean

  /**
   * The stream that will be used to write output, such as prompts and progress.
   * Can be one of the following:
   *
   * - `true` - To default to `process.stdout`
   * - `false` - To disable all CLI output
   * - Any writable stream
   *
   * Defaults to `true`.
   */
  output?: NodeJS.WritableStream | NodeJS.WriteStream | boolean

  /**
   * Any other properties will be passed directly to `readline.createInterface()`.
   * See the `ReadLineOptions` interface for possible options.
   */
  [key: string]: unknown
}
