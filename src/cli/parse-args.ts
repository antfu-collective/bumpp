import type { VersionBumpOptions } from '../types/version-bump-options'
import process from 'node:process'
import c from 'ansis'
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
        noGitCheck: args.noGitCheck,
        confirm: args.yes === undefined ? undefined : !args.yes,
        noVerify: args.verify === undefined ? undefined : !args.verify,
        install: args.install,
        files: [...(args['--'] || []), ...resultArgs],
        ignoreScripts: args.ignoreScripts,
        currentVersion: args.currentVersion,
        execute: args.execute,
        printCommits: args.printCommits,
        recursive: args.recursive,
        release: args.release,
      }),
    }

    // If a version number or release type was specified, then it will mistakenly be added to the "files" array
    if (parsedArgs.options.files && parsedArgs.options.files.length > 0) {
      const firstArg = parsedArgs.options.files[0]

      if (firstArg === 'prompt' || isReleaseType(firstArg) || isValidVersion(firstArg)) {
        parsedArgs.options.release = firstArg
        parsedArgs.options.files.shift()
      }
    }

    if (parsedArgs.options.recursive && parsedArgs.options.files?.length)
      console.log(c.yellow('The --recursive option is ignored when files are specified'))

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
    .option('--no-git-check', `Skip git check`, { default: bumpConfigDefaults.noGitCheck })
    .option('-c, --commit [msg]', 'Commit message', { default: true })
    .option('--no-commit', 'Skip commit', { default: false })
    .option('-t, --tag [tag]', 'Tag name', { default: true })
    .option('--no-tag', 'Skip tag', { default: false })
    .option('--sign', 'Sign commit and tag')
    .option('--install', `Run 'npm install' after bumping version (default: ${bumpConfigDefaults.install})`, { default: false })
    .option('-p, --push', `Push to remote (default: ${bumpConfigDefaults.push})`)
    .option('-y, --yes', `Skip confirmation (default: ${!bumpConfigDefaults.confirm})`)
    .option('-r, --recursive', `Bump package.json files recursively (default: ${bumpConfigDefaults.recursive})`)
    .option('--no-verify', 'Skip git verification')
    .option('--ignore-scripts', `Ignore scripts (default: ${bumpConfigDefaults.ignoreScripts})`)
    .option('-q, --quiet', 'Quiet mode')
    .option('--current-version <version>', 'Current version')
    .option('--print-commits', 'Print recent commits')
    .option('-x, --execute <command>', 'Commands to execute after version bumps')
    .option('--release <release>', `Release type or version number (e.g. 'major', 'minor', 'patch', 'prerelease', etc. default: ${bumpConfigDefaults.release})`)
    .help()

  const result = cli.parse(argv)
  const rawArgs = cli.rawArgs
  const args = result.options

  // TODO: To simplify the checks here, should we move the default value declaration to config.ts/bumpConfigDefaults?
  const COMMIT_REG = /(?:-c|--commit|--no-commit)(?:=.*|$)/
  const TAG_REG = /(?:-t|--tag|--no-tag)(?:=.*|$)/
  const YES_REG = /(?:-y|--yes)(?:=.*|$)/
  const NO_VERIFY_REG = /--no-verify(?:=.*|$)/
  const INSTALL_ARG = /--install(?:=.*|$)/
  const hasCommitFlag = rawArgs.some(arg => COMMIT_REG.test(arg))
  const hasTagFlag = rawArgs.some(arg => TAG_REG.test(arg))
  const hasYesFlag = rawArgs.some(arg => YES_REG.test(arg))
  const hasNoVerifyFlag = rawArgs.some(arg => NO_VERIFY_REG.test(arg))
  const hasInstallFlag = rawArgs.some(arg => INSTALL_ARG.test(arg))

  const { tag, commit, yes, ...rest } = args

  return {
    args: {
      ...rest,
      commit: hasCommitFlag ? commit : undefined,
      tag: hasTagFlag ? tag : undefined,
      yes: hasYesFlag ? yes : undefined,
      verify: hasNoVerifyFlag ? !args.verify : undefined,
      install: hasInstallFlag ? !args.install : undefined,
    } as { [k: string]: any },
    resultArgs: result.args,
  }
}

function errorHandler(error: Error): never {
  console.error(error.message)
  return process.exit(ExitCode.InvalidArgument)
}
