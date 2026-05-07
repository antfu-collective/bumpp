import type { VersionBumpOptions } from '../types/version-bump-options'
import process from 'node:process'
import { styleText } from 'node:util'
import cac from 'cac'
import { valid as isValidVersion } from 'semver'
import { version } from '../../package.json'
import { bumpConfigDefaults, loadBumpConfig } from '../config'
import { isReleaseType } from '../release-type'
import { ExitCode } from './exit-code'

/**
 * The parsed command-line arguments
 */
export interface ParsedArgs {
  help?: boolean
  version?: boolean
  quiet?: boolean
  options: VersionBumpOptions
}

/**
 * Parses the command-line arguments
 */
export async function parseArgs(): Promise<ParsedArgs> {
  try {
    const { args, resultArgs } = loadCliArgs()

    // Strip a leading release type / version number from positional args before
    // passing files to loadBumpConfig, so it doesn't override config-file `files`.
    const rawFiles = [...(args['--'] || []), ...resultArgs]
    let releaseFromArgs: string | undefined
    if (rawFiles.length > 0) {
      const firstArg = rawFiles[0]
      if (firstArg === 'prompt' || isReleaseType(firstArg) || isValidVersion(firstArg)) {
        releaseFromArgs = firstArg
        rawFiles.shift()
      }
    }

    const parsedArgs: ParsedArgs = {
      help: args.help as boolean,
      version: args.version as boolean,
      quiet: args.quiet as boolean,
      options: await loadBumpConfig({
        preid: args.preid,
        commit: args.commit,
        tag: args.tag,
        sign: args.sign,
        push: args.push,
        all: args.all,
        noGitCheck: args.gitCheck === undefined ? undefined : !args.gitCheck,
        confirm: args.yes === undefined ? undefined : !args.yes,
        noVerify: args.verify === undefined ? undefined : !args.verify,
        install: args.install,
        files: rawFiles.length ? rawFiles : undefined,
        ignoreScripts: args.ignoreScripts,
        currentVersion: args.currentVersion,
        execute: args.execute,
        printCommits: args.printCommits,
        recursive: args.recursive,
        release: args.release ?? releaseFromArgs,
        configFilePath: args.configFilePath,
      }),
    }

    if (parsedArgs.options.recursive && parsedArgs.options.files?.length)
      console.log(styleText('yellow', 'The --recursive option is ignored when files are specified'))

    return parsedArgs
  }
  catch (error) {
    // There was an error parsing the command-line args
    return errorHandler(error as Error)
  }
}

export function loadCliArgs(argv = process.argv) {
  const cli = cac('bumpp')

  cli
    .version(version)
    .usage('[...files]')
    .option('--preid <preid>', 'ID for prerelease')
    .option('-a, --all', `Include all files (default: ${bumpConfigDefaults.all})`)
    .option('--git-check', `Run git check (default: ${!bumpConfigDefaults.noGitCheck})`)
    .option('-c, --commit [msg]', `Commit message (default: ${bumpConfigDefaults.commit})`)
    .option('-t, --tag [tag]', `Tag name (default: ${bumpConfigDefaults.tag})`)
    .option('--sign', 'Sign commit and tag')
    .option('--install', `Run 'npm install' after bumping version (default: ${bumpConfigDefaults.install})`)
    .option('-p, --push', `Push to remote (default: ${bumpConfigDefaults.push})`)
    .option('-y, --yes', `Skip confirmation (default: ${!bumpConfigDefaults.confirm})`)
    .option('-r, --recursive', `Bump package.json files recursively (default: ${bumpConfigDefaults.recursive})`)
    .option('--verify', `Run git verification (default: ${!bumpConfigDefaults.noVerify})`)
    .option('--ignore-scripts', `Ignore scripts (default: ${bumpConfigDefaults.ignoreScripts})`)
    .option('-q, --quiet', 'Quiet mode')
    .option('--current-version <version>', 'Current version')
    .option('--print-commits', 'Print recent commits')
    .option('-x, --execute <command>', 'Commands to execute after version bumps')
    .option('--release <release>', `Release type or version number (e.g. 'major', 'minor', 'patch', 'prerelease', etc. default: ${bumpConfigDefaults.release})`)
    .option('--configFilePath <configFilePath>', `Path to custom build.config file`)
    .help()

  const result = cli.parse(argv)
  const args = result.options

  return {
    args,
    resultArgs: result.args,
  }
}

function errorHandler(error: Error): never {
  console.error(error.message)
  return process.exit(ExitCode.InvalidArgument)
}
