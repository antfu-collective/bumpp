import type { Operation } from './operation'
import type { ReleaseType } from './release-type'
import type { VersionBumpOptions } from './types/version-bump-options'
import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import process from 'node:process'
import { glob } from 'tinyglobby'
import yaml from 'yaml'
import { isReleaseType } from './release-type'

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
  sign?: boolean
  push: boolean
  files: string[]
  cwd: string
  install: boolean
  interface: Interface
  ignoreScripts: boolean
  execute?: string | ((config: Operation) => void | PromiseLike<void>)
  printCommits?: boolean
  customVersion?: VersionBumpOptions['customVersion']
  currentVersion?: string
}

/**
 * Converts raw VersionBumpOptions to a normalized and sanitized Options object.
 */
export async function normalizeOptions(raw: VersionBumpOptions): Promise<NormalizedOptions> {
  // Set the simple properties first
  const preid = typeof raw.preid === 'string' ? raw.preid : 'beta'
  const sign = Boolean(raw.sign)
  const push = Boolean(raw.push)
  const all = Boolean(raw.all)
  const install = Boolean(raw.install)
  const noVerify = Boolean(raw.noVerify)
  const cwd = raw.cwd || process.cwd()
  const ignoreScripts = Boolean(raw.ignoreScripts)
  const execute = raw.execute
  const recursive = Boolean(raw.recursive)

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

  if (recursive && !raw.files?.length) {
    raw.files = [
      'package.json',
      'package-lock.json',
      'packages/**/package.json',
      'jsr.json',
      'jsr.jsonc',
      'deno.json',
      'deno.jsonc',
    ]

    /** package.json defined in workspace */
    const workspaces: string[] = []

    // check if pnpm-workspace.yaml exists, if so, add all workspaces to files
    if (fsSync.existsSync('pnpm-workspace.yaml')) {
      // read pnpm-workspace.yaml
      const pnpmWorkspace = await fs.readFile('pnpm-workspace.yaml', 'utf8').then(yaml.parse) as { packages?: string[] }
      workspaces.push(...(pnpmWorkspace.packages ?? []))
    }
    // check npm/bun workspace config
    if (fsSync.existsSync('package.json')) {
      type PKGWorkspaces = string[] | { packages?: string[] }
      const packageJson = await fs.readFile('package.json', 'utf8').then(JSON.parse) as { workspaces?: PKGWorkspaces }
      const _workspaces
        = Array.isArray(packageJson.workspaces)
          ? packageJson.workspaces
          : packageJson.workspaces && Array.isArray(packageJson.workspaces.packages)
            ? packageJson.workspaces.packages
            : []

      workspaces.push(..._workspaces)
    }
    // append package.json to each workspace string
    const workspacesWithPackageJson = workspaces.map(workspace => `${workspace}/package.json`)
    // start with ! or already in files should be excluded
    const withoutExcludedWorkspaces = workspacesWithPackageJson.filter(workspace => !workspace.startsWith('!') && !raw.files?.includes(workspace))
    // add to files
    raw.files = raw.files.concat(withoutExcludedWorkspaces)
  }
  else {
    raw.files = raw.files?.length
      ? raw.files
      : ['package.json', 'package-lock.json', 'jsr.json', 'jsr.jsonc', 'deno.json', 'deno.jsonc']
  }

  const files = await glob(
    raw.files,
    {
      cwd,
      onlyFiles: true,
      expandDirectories: false,
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
    sign,
    push,
    files,
    cwd,
    install,
    interface: ui,
    ignoreScripts,
    execute,
    printCommits: raw.printCommits ?? true,
    customVersion: raw.customVersion,
    currentVersion: raw.currentVersion,
  }
}
