import type { VersionBumpOptions } from './types/version-bump-options'
import { basename, dirname } from 'node:path'
import process from 'node:process'
import { loadConfig } from 'unconfig'
import escalade from 'escalade/sync'

export const bumpConfigDefaults: VersionBumpOptions = {
  commit: true,
  push: true,
  tag: true,
  sign: false,
  install: false,
  recursive: false,
  noVerify: false,
  confirm: true,
  ignoreScripts: false,
  all: false,
  noGitCheck: true,
  files: [],
  configFilePath: undefined,
}

export async function loadBumpConfig(
  overrides?: Partial<VersionBumpOptions>,
  cwd = process.cwd(),
) {
  const name = 'bump'
  const customPath = overrides?.configFilePath
  const configFile = customPath || findConfigFile(name, cwd)

  const { config } = await loadConfig<VersionBumpOptions>({
    sources: [
      {
        files: customPath ? basename(customPath) : `${name}.config`,
        extensions: customPath ? [] : ['ts', 'mts', 'js', 'mjs', 'json'],
      },
    ],
    defaults: bumpConfigDefaults,
    cwd: configFile ? dirname(configFile) : cwd,
    merge: false,
  })

  return {
    ...config,
    ...(overrides as VersionBumpOptions),
  }
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
