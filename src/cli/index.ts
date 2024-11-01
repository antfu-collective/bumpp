import type { VersionBumpProgress } from '../types/version-bump-progress'
import process from 'node:process'
import * as ezSpawn from '@jsdevtools/ez-spawn'
import symbols from 'log-symbols'
import { ProgressEvent } from '../types/version-bump-progress'
import { versionBump } from '../version-bump'
import { ExitCode } from './exit-code'
import { parseArgs } from './parse-args'

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
        checkGitStatus()
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

export function checkGitStatus() {
  const { stdout } = ezSpawn.sync('git', ['status', '--porcelain'])
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

function errorHandler(error: Error): void {
  let message = error.message || String(error)

  if (process.env.DEBUG || process.env.NODE_ENV === 'development')
    message = error.stack || message

  console.error(message)
  process.exit(ExitCode.FatalError)
}
