import type * as _verkit from 'verkit'
import type { Operation } from '../operation'
import type { ReleaseType } from '../release-type'
import type { VersionBumpProgress } from './version-bump-progress'

export type VersionNumber = `${number}` | `${number}${string}`
export type VersionBumpRelease = ReleaseType | 'prompt' | VersionNumber | `v${VersionNumber}`

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
  release?: VersionBumpRelease

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
   * Sign the git commit and tag with a configured key (GPG/SSH).
   *
   * Defaults to `false`.
   */
  sign?: boolean

  /**
   * Indicates whether to push the git commit and tag.
   *
   * Defaults to `true`.
   */
  push?: boolean

  /**
   * Run `npm install` after bumping the version number.
   *
   * Defaults to `false`.
   */
  install?: boolean

  /**
   * Indicates whether the git commit should include ALL files (`git commit --all`)
   * rather than just the files that were modified by `versionBump()`.
   *
   * Defaults to `false`.
   */
  all?: boolean

  /**
   * Indicates whether the git working tree needs to be cleared before bumping.
   *
   * Defaults to `true`.
   */
  noGitCheck?: boolean

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
   * Execute additional command after bumping and before committing
   */
  execute?: string | ((config: Operation) => void | PromiseLike<void>)

  /**
   * Bump the files recursively for monorepo. Only works without `files` option.
   *
   * @default false
   */
  recursive?: boolean

  /**
   * Print recent commits
   */
  printCommits?: boolean

  /**
   * The path to the config file
   * If not provided, it will be inferred from the current working directory.
   * @default undefined
   */
  configFilePath?: string

  /**
   * Custom function to provide the version number
   */
  customVersion?: (currentVersion: string, verkit: typeof _verkit) => Promise<string | void> | string | void

  /**
   * Perform the release through a pull request instead of committing and
   * tagging directly on the base branch.
   *
   * When enabled, bumpp creates a new branch, bumps the version (and runs the
   * `execute` script, if any), commits, pushes the branch, and offers to open a
   * pull request via the local `gh` CLI. No git tag is created locally — the tag
   * is expected to be created by CI once the release pull request is merged
   * (see the "Releasing via a Pull Request" section of the docs).
   *
   * Can be set to `true` to use the defaults, or an object to customize the
   * branch name, base branch, pull request title/body, and draft flag.
   *
   * Requires `push` to be enabled. Implies that no tag is created locally.
   *
   * Defaults to `false`.
   */
  pr?: boolean | PullRequestOptions
}

/**
 * Options for the pull-request release flow (`pr`).
 *
 * Template fields (`branch`, `title`, `body`) support named tokens such as
 * `{version}`, `{oldVersion}`, `{tag}`, `{releaseType}`, `{major}`, `{minor}`,
 * `{patch}`, and `{date}`.
 */
export interface PullRequestOptions {
  /**
   * The name of the release branch to create.
   *
   * The `release/` prefix is the marker CI uses to detect a release pull
   * request, so keep it unless you also update your workflow.
   *
   * @default "release/v{version}"
   */
  branch?: string

  /**
   * The base branch the pull request targets.
   *
   * Defaults to the remote's default branch (detected via `origin/HEAD`,
   * falling back to `main`).
   */
  base?: string

  /**
   * The pull request title.
   *
   * Defaults to the release commit message.
   */
  title?: string

  /**
   * The pull request body. Can be a template string or a function that receives
   * the resolved token values and returns the body.
   *
   * Defaults to a generated summary of the version change and recent commits.
   */
  body?: string | ((tokens: PullRequestBodyTokens) => string)

  /**
   * Create the pull request as a draft.
   *
   * @default false
   */
  draft?: boolean
}

/**
 * The token values passed to a `pr.body` function.
 */
export interface PullRequestBodyTokens {
  version: string
  oldVersion: string
  tag: string
  releaseType: string
  major: string
  minor: string
  patch: string
  date: string
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
