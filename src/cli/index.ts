import { info, success } from 'log-symbols'
import { version as packageVersion } from '../../package.json'
import type { VersionBumpProgress } from '../types/version-bump-progress'
import { ProgressEvent } from '../types/version-bump-progress'
import { versionBump } from '../version-bump'
import { ExitCode } from './exit-code'
import { helpText } from './help'
import { parseArgs } from './parse-args'

/**
 * The main entry point of the CLI
 *
 * @param args - The command-line arguments (e.g. ["major", "--preid=alpha", "-ctpa"])
 */
export async function main(args: string[]): Promise<void> {
  try {
    // Setup global error handlers
    process.on('uncaughtException', errorHandler)
    process.on('unhandledRejection', errorHandler)

    // Parse the command-line arguments
    const { help, version, quiet, options } = parseArgs(args)

    if (help) {
      // Show the help text and exit
      console.log(helpText)
      process.exit(ExitCode.Success)
    }
    else if (version) {
      // Show the version number and exit
      console.log(packageVersion)
      process.exit(ExitCode.Success)
    }
    else {
      if (!quiet)
        options.progress = progress

      await versionBump(options)
    }
  }
  catch (error) {
    errorHandler(error as Error)
  }
}

function progress({ event, script, updatedFiles, skippedFiles, newVersion }: VersionBumpProgress): void {
  switch (event) {
    case ProgressEvent.FileUpdated:
      console.log(success, `Updated ${updatedFiles.pop()} to ${newVersion}`)
      break

    case ProgressEvent.FileSkipped:
      console.log(info, `${skippedFiles.pop()} did not need to be updated`)
      break

    case ProgressEvent.GitCommit:
      console.log(success, 'Git commit')
      break

    case ProgressEvent.GitTag:
      console.log(success, 'Git tag')
      break

    case ProgressEvent.GitPush:
      console.log(success, 'Git push')
      break

    case ProgressEvent.NpmScript:
      console.log(success, `Npm run ${script}`)
      break
  }
}

function errorHandler(error: Error): void {
  let message = error.message || String(error)

  if (process.env.DEBUG || process.env.NODE_ENV === 'development')
    message = error.stack || message

  console.error(message)
  process.exit(ExitCode.FatalError)
}
