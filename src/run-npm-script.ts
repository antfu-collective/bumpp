import * as ezSpawn from '@jsdevtools/ez-spawn'
import { readJsonFile } from './fs'
import type { Manifest } from './manifest'
import { isManifest } from './manifest'
import type { Operation } from './operation'
import type { NpmScript } from './types/version-bump-progress'
import { ProgressEvent } from './types/version-bump-progress'

/**
 * Runs the specified NPM script in the package.json file.
 */
export async function runNpmScript(script: NpmScript, operation: Operation): Promise<Operation> {
  const { cwd, ignoreScripts } = operation.options

  if (!ignoreScripts) {
    const { data: manifest } = await readJsonFile('package.json', cwd)

    if (isManifest(manifest) && hasScript(manifest, script)) {
      await ezSpawn.async('npm', ['run', script, '--silent'], { stdio: 'inherit' })
      operation.update({ event: ProgressEvent.NpmScript, script })
    }
  }

  return operation
}

/**
 * Determines whether the specified NPM script exists in the given manifest.
 */
function hasScript(manifest: Manifest, script: NpmScript): boolean {
  const scripts = manifest.scripts as Record<NpmScript, string> | undefined

  if (scripts && typeof scripts === 'object')
    return Boolean(scripts[script])

  return false
}
