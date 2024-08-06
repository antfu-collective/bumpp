import { valid as isValidVersion } from 'semver'
import { readJsonFile } from './fs'
import { isManifest } from './manifest'
import type { Operation } from './operation'

/**
 * Finds the current version number from files such as package.json.
 * An error is thrown if no version number can be found.
 */
export async function getCurrentVersion(operation: Operation): Promise<Operation> {
  if (operation.state.currentVersion)
    return operation

  const { cwd, files } = operation.options

  // Check all JSON files in the files list
  const filesToCheck = files.filter(file => file.endsWith('.json'))

  // Always check package.json
  if (!filesToCheck.includes('package.json'))
    filesToCheck.push('package.json')

  // Always check deno.json
  if (!filesToCheck.includes('deno.json'))
    filesToCheck.push('deno.json')

  // Check each file, in order, and return the first valid version number we find
  for (const file of filesToCheck) {
    const version = await readVersion(file, cwd)

    if (version) {
      // We found the current version number!
      return operation.update({
        currentVersionSource: file,
        currentVersion: version,
      })
    }
  }

  // If we get here, then no version number was found
  throw new Error(
    `Unable to determine the current version number. Checked ${filesToCheck.join(', ')}.`,
  )
}

/**
 * Tries to read the version number from the specified JSON file.
 *
 * @returns - The version number, or undefined if the file doesn't have a version number
 */
async function readVersion(file: string, cwd: string): Promise<string | undefined> {
  try {
    const { data: manifest } = await readJsonFile(file, cwd)

    if (isManifest(manifest)) {
      if (isValidVersion(manifest.version))
        return manifest.version
    }
  }
  catch {
    // Ignore errors (no such file, not valid JSON, etc.)
    // Just try the next file instead.
    return undefined
  }
}
