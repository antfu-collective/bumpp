import type { VersionBumpOptions } from './types/version-bump-options'
import type { VersionBumpResults } from './types/version-bump-results'
import process from 'node:process'
import c from 'ansis'
import { tokenizeArgs } from 'args-tokenizer'
import prompts from 'prompts'
import { getRecentCommits } from 'tiny-conventional-commits-parser'
import { x } from 'tinyexec'
import { symbols } from './cli/symbols'
import { getCurrentVersion } from './get-current-version'
import { getNewVersion } from './get-new-version'
import { formatVersionString, gitCommit, gitPush, gitTag } from './git'
import { Operation } from './operation'
import { printRecentCommits } from './print-commits'
import { runNpmScript } from './run-npm-script'
import { NpmScript } from './types/version-bump-progress'
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

  const commits = getRecentCommits()
  if (operation.options.printCommits) {
    printRecentCommits(commits)
  }

  // Get the old and new version numbers
  await getCurrentVersion(operation)
  await getNewVersion(operation, commits)

  if (arg.confirm) {
    printSummary(operation)

    if (!await prompts({
      name: 'yes',
      type: 'confirm',
      message: 'Bump?',
      initial: true,
    }).then(r => r.yes)) {
      process.exit(1)
    }
  }

  // Run npm preversion script, if any
  await runNpmScript(NpmScript.PreVersion, operation)

  // Update the version number in all files
  await updateFiles(operation)

  if (operation.options.install) {
    const { detect } = await import('package-manager-detector/detect')
    const pm = await detect()
    if (!pm?.name) {
      throw new Error('Could not detect package manager, failed to run npm install')
    }

    const { COMMANDS, constructCommand } = await import('package-manager-detector/commands')
    const command = constructCommand(COMMANDS[pm.name].install, [])
    if (!command) {
      throw new Error('Could not find install command for package manager')
    }
    console.log(symbols.info, 'Installing dependencies with', `${command.command} ${command.args.join(' ')}`)
    await x(command.command, command.args, {
      throwOnError: true,
      nodeOptions: {
        stdio: 'inherit',
        cwd: operation.options.cwd,
      },
    })
    console.log(symbols.success, 'Dependencies installed')
  }

  if (operation.options.execute) {
    if (typeof operation.options.execute === 'function') {
      await operation.options.execute(operation)
    }
    else {
      const [command, ...args] = tokenizeArgs(operation.options.execute)
      console.log(symbols.info, 'Executing script', command, ...args)
      await x(command, args, {
        throwOnError: true,
        nodeOptions: {
          stdio: 'inherit',
          cwd: operation.options.cwd,
        },
      })
      console.log(symbols.success, 'Script finished')
    }
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
    console.log(` execute ${c.bold(typeof operation.options.execute === 'function' ? 'function' : operation.options.execute)}`)
  if (operation.options.push)
    console.log(`    push ${c.cyan.bold('yes')}`)
  if (operation.options.install)
    console.log(` install ${c.cyan.bold('yes')}`)
  console.log()
  console.log(`    from ${c.bold(operation.state.currentVersion)}`)
  console.log(`      to ${c.green.bold(operation.state.newVersion)}`)
  console.log()
}

/**
 * Bumps the version number in one or more files, prompting users if necessary.
 */
export async function versionBumpInfo(arg: VersionBumpOptions | string = {}): Promise<Operation> {
  if (typeof arg === 'string')
    arg = { release: arg }

  const operation = await Operation.start(arg)
  const commits = getRecentCommits()

  // Get the old and new version numbers
  await getCurrentVersion(operation)
  await getNewVersion(operation, commits)
  return operation
}
