import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  outExtensions: () => ({ js: '.mjs' }),
  deps: {
    alwaysBundle: [
      'tiny-conventional-commits-parser',
      'prompts',
      'kleur',
      'sisteransi',
    ],
  },
})
