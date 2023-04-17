import { loadConfig } from 'c12'
import escalade from 'escalade/sync'
import type { VersionBumpOptions } from './types/version-bump-options'

export const bumpConfigDefaults: VersionBumpOptions = {
  commit: true,
  push: true,
  tag: true,
  recursive: false,
  noVerify: false,
  confirm: true,
  ignoreScripts: false,
  all: false,
  files: [],
}

export async function loadBumpConfig(overrides?: Partial<VersionBumpOptions>,
  cwd = process.cwd()) {
  const name = 'bump'
  const configFile = findConfigFile(name, cwd)
  if (configFile) {
    const { config } = await loadConfig<VersionBumpOptions>({
      configFile,
      defaults: bumpConfigDefaults,
      overrides: {
        ...(overrides as VersionBumpOptions),
      },
      cwd,
    })

    return config!
  }
  return structuredClone(bumpConfigDefaults)
}

function findConfigFile(name: string, cwd: string) {
  let foundRepositoryRoot = false
  try {
    const candidates = ['js', 'mjs', 'ts', 'mts', 'json'].map(ext => `${name}.config.${ext}`)
    return escalade(cwd, (dir, files) => {
      const match = files.find((file) => {
        if (candidates.includes(file))
          return true
        if (file === '.git')
          foundRepositoryRoot = true
        return false
      })

      if (match)
        return match

      // Stop at the repository root.
      if (foundRepositoryRoot) {
        // eslint-disable-next-line no-throw-literal
        throw null
      }

      return false
    })
  }
  catch (error) {
    if (foundRepositoryRoot)
      return null
    throw error
  }
}

export function defineConfig(config: Partial<VersionBumpOptions>) {
  return config
}
