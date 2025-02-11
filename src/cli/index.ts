import type { VersionBumpProgress } from '../types/version-bump-progress'
import process from 'node:process'
import { NonZeroExitError, x } from 'tinyexec'
import { ProgressEvent } from '../types/version-bump-progress'
import { versionBump } from '../version-bump'
import { ExitCode } from './exit-code'
import { parseArgs } from './parse-args'
import { symbols } from './symbols'

/**
 * The main entry point of the CLI
 */
export async function main(): Promise<void> {
  try {
    // Setup global error handlers
    process.on('uncaughtException', errorHandler)
    process.on('unhandledRejection', errorHandler)

    // Parse the command-line arguments
    const { help, version, quiet, options } = await parseArgs()

    if (help || version) {
      // Will be handled by cac, just need to exit
      process.exit(ExitCode.Success)
    }
    else {
      if (!options.all && !options.noGitCheck) {
        await checkGitStatus()
      }

      if (!quiet)
        options.progress = options.progress ? options.progress : progress

      await versionBump(options)
    }
  }
  catch (error) {
    errorHandler(error as Error)
  }
}

export async function checkGitStatus() {
  const { stdout } = await x('git', ['status', '--porcelain'])
  if (stdout.trim()) {
    throw new Error(`Git working tree is not clean:\n${stdout}`)
  }
}

function progress({ event, script, updatedFiles, skippedFiles, newVersion }: VersionBumpProgress): void {
  switch (event) {
    case ProgressEvent.FileUpdated:
      console.log(symbols.success, `Updated ${updatedFiles.pop()} to ${newVersion}`)
      break

    case ProgressEvent.FileSkipped:
      console.log(symbols.info, `${skippedFiles.pop()} did not need to be updated`)
      break

    case ProgressEvent.GitCommit:
      console.log(symbols.success, 'Git commit')
      break

    case ProgressEvent.GitTag:
      console.log(symbols.success, 'Git tag')
      break

    case ProgressEvent.GitPush:
      console.log(symbols.success, 'Git push')
      break

    case ProgressEvent.NpmScript:
      console.log(symbols.success, `Npm run ${script}`)
      break
  }
}

function errorHandler(error: Error | NonZeroExitError): void {
  let message = error.message || String(error)

  if (error instanceof NonZeroExitError)
    message += `\n\n${error.output?.stderr || ''}`

  if (process.env.DEBUG || process.env.NODE_ENV === 'development')
    message += `\n\n${error.stack || ''}`

  console.error(message)
  process.exit(ExitCode.FatalError)
}
