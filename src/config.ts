import type { VersionBumpOptions } from './types/version-bump-options'
import process from 'node:process'
import { loadConfig } from 'unconfig'

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
  const { config } = await loadConfig<VersionBumpOptions>({
    sources: [
      customPath
        ? {
            files: [customPath],
            extensions: [],
          }
        : {
            files: `${name}.config`,
            extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json'],
          },
    ],
    defaults: bumpConfigDefaults,
    cwd,
  })

  return {
    ...config,
    ...overrides,
  }
}

export function defineConfig(config: Partial<VersionBumpOptions>) {
  return config
}
