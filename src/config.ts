import type { VersionBumpOptions } from './types/version-bump-options'
import { dirname } from 'node:path'
import process from 'node:process'
import { loadConfig } from 'c12'
import escalade from 'escalade/sync'

export const bumpConfigDefaults: VersionBumpOptions = {
  commit: true,
  push: true,
  tag: true,
  sign: false,
  recursive: false,
  noVerify: false,
  confirm: true,
  ignoreScripts: false,
  all: false,
  files: [],
}

export async function loadBumpConfig(
  overrides?: Partial<VersionBumpOptions>,
  cwd = process.cwd(),
) {
  const name = 'bump'
  const configFile = findConfigFile(name, cwd)
  const { config } = await loadConfig<VersionBumpOptions>({
    name,
    defaults: bumpConfigDefaults,
    overrides: {
      ...(overrides as VersionBumpOptions),
    },
    cwd: configFile ? dirname(configFile) : cwd,
  })
  console.log(config)
  return config!
}

function findConfigFile(name: string, cwd: string) {
  let foundRepositoryRoot = false
  try {
    const candidates = ['js', 'mjs', 'ts', 'mts', 'json'].map(ext => `${name}.config.${ext}`)
    return escalade(cwd, (_dir, files) => {
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
