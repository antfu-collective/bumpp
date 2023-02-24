import { valid as isValidVersion } from 'semver'
import cac from 'cac'
import c from 'picocolors'
import { isReleaseType } from '../release-type'
import type { VersionBumpOptions } from '../types/version-bump-options'
import { version } from '../../package.json'
import { bumpConfigDefaults, loadBumpConfig } from '../config'
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
    const cli = cac('bumpp')

    cli
      .version(version)
      .usage('[...files]')
      .option('--preid <preid>', 'ID for prerelease')
      .option('--all', `Include all files (default: ${bumpConfigDefaults.all})`)
      .option('-c, --commit [msg]', `Commit message (default: ${bumpConfigDefaults.commit})`)
      .option('-t, --tag [tag]', `Tag name (default: ${bumpConfigDefaults.tag})`)
      .option('-p, --push', `Push to remote (default: ${bumpConfigDefaults.push})`)
      .option('-y, --yes', `Skip confirmation (default: ${!bumpConfigDefaults.confirm})`)
      .option('-r, --recursive', `Bump package.json files recursively (default: ${bumpConfigDefaults.recursive})`)
      .option('--no-verify', 'Skip git verification')
      .option('--ignore-scripts', `Ignore scripts (default: ${bumpConfigDefaults.ignoreScripts})`)
      .option('-q, --quiet', 'Quiet mode')
      .option('-v, --version <version>', 'Tagert version')
      .option('-x, --execute <command>', 'Commands to execute after version bumps')
      .help()

    const result = cli.parse()
    const args = result.options

    const parsedArgs: ParsedArgs = {
      help: args.help as boolean,
      version: args.version as boolean,
      quiet: args.quiet as boolean,
      options: await loadBumpConfig({
        preid: args.preid,
        commit: args.commit,
        tag: args.tag,
        push: args.push,
        all: args.all,
        confirm: !args.yes,
        noVerify: !args.verify,
        files: [...(args['--'] || []), ...result.args],
        ignoreScripts: args.ignoreScripts,
        execute: args.execute,
        recursive: !!args.recursive,
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

    if (parsedArgs.options.recursive) {
      if (parsedArgs.options.files?.length)
        console.log(c.yellow('The --recursive option is ignored when files are specified'))

      else
        parsedArgs.options.files = ['package.json', 'package-lock.json', 'packages/**/package.json']
    }

    return parsedArgs
  }
  catch (error) {
    // There was an error parsing the command-line args
    return errorHandler(error as Error)
  }
}

function errorHandler(error: Error): never {
  console.error(error.message)
  return process.exit(ExitCode.InvalidArgument)
}
