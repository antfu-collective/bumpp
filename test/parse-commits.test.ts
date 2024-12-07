import { expect, it } from 'vitest'
import { parseCommits } from '../src/print-commits'

const fixture = `
3b93ca405 feat: update deps \`unconfig\` \`jiti\`
568bb4fff feat(vite): apply transformers to preflights during build (#4168)
65d775436 feat(svelte-scoped): optional theme() parsing (#4171)
9ed349ddd feat(transformer-directive): support \`icon()\` directive (#4113)
f38197553 fix(webpack): resolve config before processing (#4174)
6a882da21 feat(webpack): support rspack/rsbuild (#4173)
d8bf879f3 fix(preset-mini): data attributes with named groups (#4165)
19bc9c7e6 fix(postcss): postcss dependency should always be added (#4161)
f21efd539 fix(nuxt): resolve config in advance (#4163)
320dfef4e feat(preset-web-fonts): \`fontsource\` font provider (#4156)
bfad9f238 fix!(extractor-arbitrary-variants): skip extracting encoded html entities (#4162)
3f2e7f631 docs: add tutorial links update contributors (#4159)
31e6709c4 ci: use \`--only-templates\` (#4170)
3de433122 feat(preset-mini): support \`bg-[image:*]\` (#4160)
35297359b docs(rules): explain symbols.layer in symbols docs (#4145)
9be7b299d feat(core): add symbols.layer (#4143)
bd4d8e998 docs(config): layers using variants (#4144)
67f3237dc refactor!: make arbitrary variants extractor callable (#4239)
5420b1316 feat(core)!: deprecate \`new UnoGenerator\`, make \`createGenerator()\` async (#4268)
`

it('parseCommits', async () => {
  const parsed = parseCommits(fixture)
  // console.log(formatParsedCommits(parsed).join('\n'))
  expect(parsed)
    .toMatchInlineSnapshot(`
      [
        {
          "breaking": true,
          "color": [Function],
          "hash": "5420b1316",
          "message": "deprecate \`new UnoGenerator\`, make \`createGenerator()\` async (#4268)",
          "scope": "(core)",
          "tag": "feat!",
        },
        {
          "breaking": true,
          "color": [Function],
          "hash": "67f3237dc",
          "message": "make arbitrary variants extractor callable (#4239)",
          "scope": "",
          "tag": "refactor!",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "bd4d8e998",
          "message": "layers using variants (#4144)",
          "scope": "(config)",
          "tag": "docs",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "9be7b299d",
          "message": "add symbols.layer (#4143)",
          "scope": "(core)",
          "tag": "feat",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "35297359b",
          "message": "explain symbols.layer in symbols docs (#4145)",
          "scope": "(rules)",
          "tag": "docs",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "3de433122",
          "message": "support \`bg-[image:*]\` (#4160)",
          "scope": "(preset-mini)",
          "tag": "feat",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "31e6709c4",
          "message": "use \`--only-templates\` (#4170)",
          "scope": "",
          "tag": "ci",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "3f2e7f631",
          "message": "add tutorial links update contributors (#4159)",
          "scope": "",
          "tag": "docs",
        },
        {
          "breaking": true,
          "color": [Function],
          "hash": "bfad9f238",
          "message": "skip extracting encoded html entities (#4162)",
          "scope": "(extractor-arbitrary-variants)",
          "tag": "fix!",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "320dfef4e",
          "message": "\`fontsource\` font provider (#4156)",
          "scope": "(preset-web-fonts)",
          "tag": "feat",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "f21efd539",
          "message": "resolve config in advance (#4163)",
          "scope": "(nuxt)",
          "tag": "fix",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "19bc9c7e6",
          "message": "postcss dependency should always be added (#4161)",
          "scope": "(postcss)",
          "tag": "fix",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "d8bf879f3",
          "message": "data attributes with named groups (#4165)",
          "scope": "(preset-mini)",
          "tag": "fix",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "6a882da21",
          "message": "support rspack/rsbuild (#4173)",
          "scope": "(webpack)",
          "tag": "feat",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "f38197553",
          "message": "resolve config before processing (#4174)",
          "scope": "(webpack)",
          "tag": "fix",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "9ed349ddd",
          "message": "support \`icon()\` directive (#4113)",
          "scope": "(transformer-directive)",
          "tag": "feat",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "65d775436",
          "message": "optional theme() parsing (#4171)",
          "scope": "(svelte-scoped)",
          "tag": "feat",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "568bb4fff",
          "message": "apply transformers to preflights during build (#4168)",
          "scope": "(vite)",
          "tag": "feat",
        },
        {
          "breaking": false,
          "color": [Function],
          "hash": "3b93ca405",
          "message": "update deps \`unconfig\` \`jiti\`",
          "scope": "",
          "tag": "feat",
        },
      ]
    `)
})
