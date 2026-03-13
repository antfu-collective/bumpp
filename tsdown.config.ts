import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  dts: {
    tsgo: true,
  },
  deps: {
    onlyBundle: [
      'tiny-conventional-commits-parser',
      'prompts',
      'kleur',
      'sisteransi',
    ],
  },
  exports: true,
})
