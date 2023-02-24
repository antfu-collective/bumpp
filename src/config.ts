import { loadConfig } from 'c12'
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

export const loadBumpConfig = async (
  overrides?: Partial<VersionBumpOptions>,
  cwd = process.cwd(),
) => {
  const { config } = await loadConfig<VersionBumpOptions>({
    name: 'bump',
    defaults: bumpConfigDefaults,
    overrides: {
      ...(overrides as VersionBumpOptions),
    },
    cwd,
  })

  return config!
}

export const defineConfig = (config: Partial<VersionBumpOptions>) => config
