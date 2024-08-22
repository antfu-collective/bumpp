import * as path from 'node:path'
import { existsSync } from 'node:fs'
import { readJsoncFile, readTextFile, writeJsoncFile, writeTextFile } from './fs'
import { isManifest, isPackageLockManifest } from './manifest'
import type { Operation } from './operation'
import { ProgressEvent } from './types/version-bump-progress'

/**
 * Updates the version number in the specified files.
 */
export async function updateFiles(operation: Operation): Promise<Operation> {
  const { files } = operation.options

  for (const relPath of files) {
    const modified = await updateFile(relPath, operation)

    if (modified) {
      operation.update({
        event: ProgressEvent.FileUpdated,
        updatedFiles: operation.state.updatedFiles.concat(relPath),
      })
    }
    else {
      operation.update({
        event: ProgressEvent.FileSkipped,
        skippedFiles: operation.state.skippedFiles.concat(relPath),
      })
    }
  }

  return operation
}

/**
 * Updates the version number in the specified file.
 *
 * @returns - `true` if the file was actually modified
 */
async function updateFile(relPath: string, operation: Operation): Promise<boolean> {
  if (!existsSync(relPath)) {
    return false
  }

  const name = path.basename(relPath).trim().toLowerCase()

  switch (name) {
    case 'package.json':
    case 'package-lock.json':
    case 'bower.json':
    case 'component.json':
    case 'jsr.json':
    case 'jsr.jsonc':
    case 'deno.json':
    case 'deno.jsonc':
      return updateManifestFile(relPath, operation)

    default:
      return updateTextFile(relPath, operation)
  }
}

/**
 * Updates the version number in the specified JSON manifest file.
 *
 * NOTE: Unlike text files, this is NOT a global find-and-replace.  It _specifically_ sets
 * the top-level `version` property.
 *
 * @returns - `true` if the file was actually modified
 */
async function updateManifestFile(relPath: string, operation: Operation): Promise<boolean> {
  const { cwd } = operation.options
  const { newVersion } = operation.state
  let modified = false

  const file = await readJsoncFile(relPath, cwd)

  if (isManifest(file.data) && file.data.version !== newVersion) {
    file.modified.push([['version'], newVersion])
    if (isPackageLockManifest(file.data))
      file.modified.push([['packages', '', 'version'], newVersion])

    await writeJsoncFile(file)
    modified = true
  }

  return modified
}

/**
 * Updates all occurrences of the version number in the specified text file.
 *
 * @returns - `true` if the file was actually modified
 */
async function updateTextFile(relPath: string, operation: Operation): Promise<boolean> {
  const { cwd } = operation.options
  const { currentVersion, newVersion } = operation.state
  const modified = false

  const file = await readTextFile(relPath, cwd)

  // Only update the file if it contains at least one occurrence of the old version
  if (file.data.includes(currentVersion)) {
    // Escape all non-alphanumeric characters in the version
    const sanitizedVersion = currentVersion.replace(/(\W)/g, '\\$1')

    // Replace occurrences of the old version number that are surrounded by word boundaries.
    // This ensures that it matches "1.23.456" or "v1.23.456", but not "321.23.456".
    const replacePattern = new RegExp(`(\\b|v)${sanitizedVersion}\\b`, 'g')

    file.data = file.data.replace(replacePattern, `$1${newVersion}`)
    await writeTextFile(file)

    return true
  }

  return modified
}
