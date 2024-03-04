import process from 'node:process'
import fg from 'fast-glob'
import type { ReleaseType } from './release-type'
import { isReleaseType } from './release-type'
import type { VersionBumpOptions } from './types/version-bump-options'

interface Interface {
  input?: NodeJS.ReadableStream | NodeJS.ReadStream | false
  output?: NodeJS.WritableStream | NodeJS.WriteStream | false
  [key: string]: unknown
}

/**
 * A specific version release.
 */
export interface VersionRelease {
  type: 'version'
  version: string
}

/**
 * Prompt the user for the release number.
 */
export interface PromptRelease {
  type: 'prompt'
  preid: string
}

/**
 * A bump release, relative to the current version number.
 */
export interface BumpRelease {
  type: ReleaseType
  preid: string
}

/**
 * One of the possible Release types.
 */
export type Release = VersionRelease | PromptRelease | BumpRelease

/**
 * Normalized and sanitized options
 */
export interface NormalizedOptions {
  release: Release
  commit?: {
    message: string
    noVerify: boolean
    all: boolean
  }
  tag?: {
    name: string
  }
  push: boolean
  files: string[]
  cwd: string
  interface: Interface
  ignoreScripts: boolean
  execute?: string
  customVersion?: VersionBumpOptions['customVersion']
  currentVersion?: string
}

/**
 * Converts raw VersionBumpOptions to a normalized and sanitized Options object.
 */
export async function normalizeOptions(raw: VersionBumpOptions): Promise<NormalizedOptions> {
  // Set the simple properties first
  const preid = typeof raw.preid === 'string' ? raw.preid : 'beta'
  const push = Boolean(raw.push)
  const all = Boolean(raw.all)
  const noVerify = Boolean(raw.noVerify)
  const cwd = raw.cwd || process.cwd()
  const ignoreScripts = Boolean(raw.ignoreScripts)
  const execute = raw.execute

  let release: Release
  if (!raw.release || raw.release === 'prompt')
    release = { type: 'prompt', preid }

  else if (isReleaseType(raw.release) || raw.release === 'next')
    release = { type: raw.release, preid }

  else
    release = { type: 'version', version: raw.release }

  let tag
  if (typeof raw.tag === 'string')
    tag = { name: raw.tag }

  else if (raw.tag)
    tag = { name: 'v' }

  // NOTE: This must come AFTER `tag` and `push`, because it relies on them
  let commit
  if (typeof raw.commit === 'string')
    commit = { all, noVerify, message: raw.commit }

  else if (raw.commit || tag || push)
    commit = { all, noVerify, message: 'chore: release v' }

  const files = await fg(
    raw.files?.length
      ? raw.files
      : ['package.json', 'package-lock.json', 'jsr.json', 'jsr.jsonc'],
    {
      cwd,
      onlyFiles: true,
      ignore: [
        '**/{.git,node_modules,bower_components,__tests__,fixtures,fixture}/**',
      ],
    },
  )

  let ui: Interface
  if (raw.interface === false) {
    ui = { input: false, output: false }
  }
  else if (raw.interface === true || !raw.interface) {
    ui = { input: process.stdin, output: process.stdout }
  }
  else {
    let { input, output, ...other } = raw.interface

    if (input === true || (input !== false && !input))
      input = process.stdin

    if (output === true || (output !== false && !output))
      output = process.stdout

    ui = { input, output, ...other }
  }

  if (release.type === 'prompt' && !(ui.input && ui.output))
    throw new Error('Cannot prompt for the version number because input or output has been disabled.')

  return {
    release,
    commit,
    tag,
    push,
    files,
    cwd,
    interface: ui,
    ignoreScripts,
    execute,
    customVersion: raw.customVersion,
    currentVersion: raw.currentVersion,
  }
}
