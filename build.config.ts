import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/cli',
  ],
  declaration: true,
  clean: true,
  rollup: {
    inlineDependencies: [
      'tiny-conventional-commits-parser',

      'prompts',
      'kleur',
      'sisteransi',
    ],
  },
})
