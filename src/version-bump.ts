import process from 'node:process'
import * as ezSpawn from '@jsdevtools/ez-spawn'
import c from 'picocolors'
import symbols from 'log-symbols'
import prompts from 'prompts'
import { getNewVersion } from './get-new-version'
import { getCurrentVersion } from './get-current-version'
import { formatVersionString, gitCommit, gitPush, gitTag } from './git'
import { Operation } from './operation'
import { runNpmScript } from './run-npm-script'
import type { VersionBumpOptions } from './types/version-bump-options'
import { NpmScript } from './types/version-bump-progress'
import type { VersionBumpResults } from './types/version-bump-results'
import { updateFiles } from './update-files'

/**
 * Prompts the user for a version number and updates package.json and package-lock.json.
 *
 * @returns - The new version number
 */
export async function versionBump(): Promise<VersionBumpResults>

/**
 * Bumps the version number in package.json, package-lock.json.
 *
 * @param release
 * The release version or type. Can be one of the following:
 *
 * - The new version number (e.g. "1.23.456")
 * - A release type (e.g. "major", "minor", "patch", "prerelease", etc.)
 * - "prompt" to prompt the user for the version number
 */
export async function versionBump(release: string): Promise<VersionBumpResults>

/**
 * Bumps the version number in one or more files, prompting the user if necessary.
 * Optionally also commits, tags, and pushes to git.
 */
export async function versionBump(options: VersionBumpOptions): Promise<VersionBumpResults>

/**
 * Bumps the version number in one or more files, prompting the user if necessary.
 * Optionally also commits, tags, and pushes to git.
 */
export async function versionBump(arg: (VersionBumpOptions) | string = {}): Promise<VersionBumpResults | undefined> {
  if (typeof arg === 'string')
    arg = { release: arg }

  const operation = await Operation.start(arg)

  // Get the old and new version numbers
  await getCurrentVersion(operation)
  await getNewVersion(operation)

  if (arg.confirm) {
    printSummary(operation)

    if (!await prompts({
      name: 'yes',
      type: 'confirm',
      message: 'Bump?',
      initial: true,
    }).then(r => r.yes))
      process.exit(1)
  }

  // Run npm preversion script, if any
  await runNpmScript(NpmScript.PreVersion, operation)

  // Update the version number in all files
  await updateFiles(operation)

  if (operation.options.execute) {
    console.log(symbols.info, 'Executing script', operation.options.execute)
    await ezSpawn.async(operation.options.execute, { stdio: 'inherit' })
    console.log(symbols.success, 'Script finished')
  }

  // Run npm version script, if any
  await runNpmScript(NpmScript.Version, operation)

  // Git commit and tag, if enabled
  await gitCommit(operation)
  await gitTag(operation)

  // Run npm postversion script, if any
  await runNpmScript(NpmScript.PostVersion, operation)

  // Push the git commit and tag, if enabled
  await gitPush(operation)

  return operation.results
}

function printSummary(operation: Operation) {
  console.log()
  console.log(`   files ${operation.options.files.map(i => c.bold(i)).join('\n         ')}`)
  if (operation.options.commit)
    console.log(`  commit ${c.bold(formatVersionString(operation.options.commit.message, operation.state.newVersion))}`)
  if (operation.options.tag)
    console.log(`     tag ${c.bold(formatVersionString(operation.options.tag.name, operation.state.newVersion))}`)
  if (operation.options.execute)
    console.log(` execute ${c.bold(operation.options.execute)}`)
  if (operation.options.push)
    console.log(`    push ${c.cyan(c.bold('yes'))}`)
  console.log()
  console.log(`    from ${c.bold(operation.state.currentVersion)}`)
  console.log(`      to ${c.green(c.bold(operation.state.newVersion))}`)
  console.log()
}

/**
 * Bumps the version number in one or more files, prompting users if necessary.
 */
export async function versionBumpInfo(arg: VersionBumpOptions | string = {}): Promise<Operation> {
  if (typeof arg === 'string')
    arg = { release: arg }

  const operation = await Operation.start(arg)

  // Get the old and new version numbers
  await getCurrentVersion(operation)
  await getNewVersion(operation)
  return operation
}
