import { expect, it } from 'vitest'
import { parseCommits } from '../src/git'

const fixture = `
----
chore: release v9.10.2|db6e8dd|Anthony Fu|github@antfu.me

----
chore: update deps|bf94ede|Anthony Fu|github@antfu.me

----
fix: version update issue (#70)|8f08209|Blithe-Chiang|40333428+Blithe-Chiang@users.noreply.github.com
Co-authored-by: jiangzs <2373806028@qq.com>
----
chore: release v9.10.1|bf80c85|Anthony Fu|github@antfu.me

----
feat!: fake more colors for semantic commit tags|40b4edb|Anthony Fu|github@antfu.me

----
chore: release v9.10.0|7fafd9a|Anthony Fu|github@antfu.me

----
chore: update deps|e8be529|Anthony Fu|github@antfu.me

----
feat: support \`--install\` flag|96a4754|Anthony Fu|github@antfu.me

----
chore: release v9.9.3|6875220|Anthony Fu|github@antfu.me

----
chore: update deps|6eda4dd|Anthony Fu|github@antfu.me

----
fix: throw on exec error, fix #67|52816cc|Anthony Fu|github@antfu.me

----
chore: release v9.9.2|b9f797f|Anthony Fu|github@antfu.me

----
chore: upgrade args-tokenizer (#65)|70855ec|Bogdan Chadkin|bogdanchadkin@protonmail.com
Co-authored-by: Anthony Fu <github@antfu.me>
----
chore: lint|ed8dffd|Anthony Fu|github@antfu.me

----
chore: replace shell-quote with args-tokenizer (#64)|457271d|Bogdan Chadkin|bogdanchadkin@protonmail.com

----
chore: release v9.9.1|ba0a0d5|Anthony Fu|github@antfu.me

----
fix: --exec ENOENT tinyexec args, close #62 (#63)|1eda378|浜戞父鍚泑me@yunyoujun.cn
Co-authored-by: Anthony Fu <github@antfu.me>

----
chore: release v9.9.0|1229cd7|Anthony Fu|github@antfu.me

----
feat: migrate to \`tinyexec\`|780b7cc|Anthony Fu|github@antfu.me

----
fix: fix parsing a breaking change commit with scope (#61)|95b8af3|ntnyq|ntnyq13@gmail.com

----
fix: \`execute\` type fix. (#59)|bb02365|juicysteak|s3xysteak@outlook.com

----
chore: release v9.8.1|705b60b|Anthony Fu|github@antfu.me

----
fix: remove the useless option 'version' (#56)|41f0c38|No Two|1244476905@qq.com

----
fix: --no-print-commits not working (#57)|5675e6e|No Two|1244476905@qq.com

----
docs: update|cfd35a1|Anthony Fu|github@antfu.me

----
chore: release v9.8.0|9081b50|Anthony Fu|github@antfu.me

----
chore: update deps|e5f0631|Anthony Fu|github@antfu.me

----
feat: execute could receive a function (#54)|e05fac1|juicysteak|s3xysteak@outlook.com

----
test: \`update-files\` should await async functions in beforeEach/afterEach (#55)|14305e3|juicysteak|s3xysteak@outlook.com

----
chore(deps): replace fast-glob by tinyglobby (#50)|e461b8f|Antony David|antonydavid945@gmail.com

----
chore: release v9.7.1|b2ac17c|Anthony Fu|github@antfu.me

----
fix: remove debug console log|b207d62|Anthony Fu|github@antfu.me

----
chore: release v9.7.0|47305de|Anthony Fu|github@antfu.me

----
chore: update deps|a11af37|Anthony Fu|github@antfu.me

----
feat: check git status before bump if option.all is falsy (#44)|5f78126|Liting|luz.liting@gmail.com

----
chore: fix lint & added lint:fix script (#48)|81afd3c|Neko|neko@ayaka.moe

----
feat(cli): support signing git commits and tags (#47)|312cf50|Neko|neko@ayaka.moe

----
feat: ignore manifest files without version property (#49)|24c49a5|Neko|neko@ayaka.moe

----
chore: release v9.6.1|5d4591b|Anthony Fu|github@antfu.me

----
feat: improve commit printing|aaad54d|Anthony Fu|github@antfu.me
`

it('parseCommits', async () => {
  const parsed = parseCommits(fixture)
  // console.log(formatParsedCommits(parsed).join('\n'))
  expect(parsed)
    .toMatchInlineSnapshot(`
      [
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.10.2",
          "isBreaking": false,
          "message": "chore: release v9.10.2",
          "references": [
            {
              "type": "hash",
              "value": "db6e8dd",
            },
          ],
          "scope": "",
          "shortHash": "db6e8dd",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "update deps",
          "isBreaking": false,
          "message": "chore: update deps",
          "references": [
            {
              "type": "hash",
              "value": "bf94ede",
            },
          ],
          "scope": "",
          "shortHash": "bf94ede",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "40333428+Blithe-Chiang@users.noreply.github.com",
              "name": "Blithe-Chiang",
            },
            {
              "email": "2373806028@qq.com",
              "name": "jiangzs",
            },
          ],
          "body": "Co-authored-by: jiangzs <2373806028@qq.com>",
          "description": "version update issue",
          "isBreaking": false,
          "message": "fix: version update issue (#70)",
          "references": [
            {
              "type": "pull-request",
              "value": "#70",
            },
            {
              "type": "hash",
              "value": "8f08209",
            },
          ],
          "scope": "",
          "shortHash": "8f08209",
          "type": "fix",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.10.1",
          "isBreaking": false,
          "message": "chore: release v9.10.1",
          "references": [
            {
              "type": "hash",
              "value": "bf80c85",
            },
          ],
          "scope": "",
          "shortHash": "bf80c85",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "fake more colors for semantic commit tags",
          "isBreaking": true,
          "message": "feat!: fake more colors for semantic commit tags",
          "references": [
            {
              "type": "hash",
              "value": "40b4edb",
            },
          ],
          "scope": "",
          "shortHash": "40b4edb",
          "type": "feat",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.10.0",
          "isBreaking": false,
          "message": "chore: release v9.10.0",
          "references": [
            {
              "type": "hash",
              "value": "7fafd9a",
            },
          ],
          "scope": "",
          "shortHash": "7fafd9a",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "update deps",
          "isBreaking": false,
          "message": "chore: update deps",
          "references": [
            {
              "type": "hash",
              "value": "e8be529",
            },
          ],
          "scope": "",
          "shortHash": "e8be529",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "support \`--install\` flag",
          "isBreaking": false,
          "message": "feat: support \`--install\` flag",
          "references": [
            {
              "type": "hash",
              "value": "96a4754",
            },
          ],
          "scope": "",
          "shortHash": "96a4754",
          "type": "feat",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.9.3",
          "isBreaking": false,
          "message": "chore: release v9.9.3",
          "references": [
            {
              "type": "hash",
              "value": "6875220",
            },
          ],
          "scope": "",
          "shortHash": "6875220",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "update deps",
          "isBreaking": false,
          "message": "chore: update deps",
          "references": [
            {
              "type": "hash",
              "value": "6eda4dd",
            },
          ],
          "scope": "",
          "shortHash": "6eda4dd",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "throw on exec error, fix #67",
          "isBreaking": false,
          "message": "fix: throw on exec error, fix #67",
          "references": [
            {
              "type": "issue",
              "value": "#67",
            },
            {
              "type": "hash",
              "value": "52816cc",
            },
          ],
          "scope": "",
          "shortHash": "52816cc",
          "type": "fix",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.9.2",
          "isBreaking": false,
          "message": "chore: release v9.9.2",
          "references": [
            {
              "type": "hash",
              "value": "b9f797f",
            },
          ],
          "scope": "",
          "shortHash": "b9f797f",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "bogdanchadkin@protonmail.com",
              "name": "Bogdan Chadkin",
            },
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "Co-authored-by: Anthony Fu <github@antfu.me>",
          "description": "upgrade args-tokenizer",
          "isBreaking": false,
          "message": "chore: upgrade args-tokenizer (#65)",
          "references": [
            {
              "type": "pull-request",
              "value": "#65",
            },
            {
              "type": "hash",
              "value": "70855ec",
            },
          ],
          "scope": "",
          "shortHash": "70855ec",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "lint",
          "isBreaking": false,
          "message": "chore: lint",
          "references": [
            {
              "type": "hash",
              "value": "ed8dffd",
            },
          ],
          "scope": "",
          "shortHash": "ed8dffd",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "bogdanchadkin@protonmail.com",
              "name": "Bogdan Chadkin",
            },
          ],
          "body": "",
          "description": "replace shell-quote with args-tokenizer",
          "isBreaking": false,
          "message": "chore: replace shell-quote with args-tokenizer (#64)",
          "references": [
            {
              "type": "pull-request",
              "value": "#64",
            },
            {
              "type": "hash",
              "value": "457271d",
            },
          ],
          "scope": "",
          "shortHash": "457271d",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.9.1",
          "isBreaking": false,
          "message": "chore: release v9.9.1",
          "references": [
            {
              "type": "hash",
              "value": "ba0a0d5",
            },
          ],
          "scope": "",
          "shortHash": "ba0a0d5",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": undefined,
              "name": "浜戞父鍚泑me@yunyoujun.cn",
            },
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "Co-authored-by: Anthony Fu <github@antfu.me>",
          "description": "--exec ENOENT tinyexec args, close #62",
          "isBreaking": false,
          "message": "fix: --exec ENOENT tinyexec args, close #62 (#63)",
          "references": [
            {
              "type": "pull-request",
              "value": "#63",
            },
            {
              "type": "issue",
              "value": "#62",
            },
            {
              "type": "hash",
              "value": "1eda378",
            },
          ],
          "scope": "",
          "shortHash": "1eda378",
          "type": "fix",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.9.0",
          "isBreaking": false,
          "message": "chore: release v9.9.0",
          "references": [
            {
              "type": "hash",
              "value": "1229cd7",
            },
          ],
          "scope": "",
          "shortHash": "1229cd7",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "migrate to \`tinyexec\`",
          "isBreaking": false,
          "message": "feat: migrate to \`tinyexec\`",
          "references": [
            {
              "type": "hash",
              "value": "780b7cc",
            },
          ],
          "scope": "",
          "shortHash": "780b7cc",
          "type": "feat",
        },
        {
          "authors": [
            {
              "email": "ntnyq13@gmail.com",
              "name": "ntnyq",
            },
          ],
          "body": "",
          "description": "fix parsing a breaking change commit with scope",
          "isBreaking": false,
          "message": "fix: fix parsing a breaking change commit with scope (#61)",
          "references": [
            {
              "type": "pull-request",
              "value": "#61",
            },
            {
              "type": "hash",
              "value": "95b8af3",
            },
          ],
          "scope": "",
          "shortHash": "95b8af3",
          "type": "fix",
        },
        {
          "authors": [
            {
              "email": "s3xysteak@outlook.com",
              "name": "juicysteak",
            },
          ],
          "body": "",
          "description": "\`execute\` type fix.",
          "isBreaking": false,
          "message": "fix: \`execute\` type fix. (#59)",
          "references": [
            {
              "type": "pull-request",
              "value": "#59",
            },
            {
              "type": "hash",
              "value": "bb02365",
            },
          ],
          "scope": "",
          "shortHash": "bb02365",
          "type": "fix",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.8.1",
          "isBreaking": false,
          "message": "chore: release v9.8.1",
          "references": [
            {
              "type": "hash",
              "value": "705b60b",
            },
          ],
          "scope": "",
          "shortHash": "705b60b",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "1244476905@qq.com",
              "name": "No Two",
            },
          ],
          "body": "",
          "description": "remove the useless option 'version'",
          "isBreaking": false,
          "message": "fix: remove the useless option 'version' (#56)",
          "references": [
            {
              "type": "pull-request",
              "value": "#56",
            },
            {
              "type": "hash",
              "value": "41f0c38",
            },
          ],
          "scope": "",
          "shortHash": "41f0c38",
          "type": "fix",
        },
        {
          "authors": [
            {
              "email": "1244476905@qq.com",
              "name": "No Two",
            },
          ],
          "body": "",
          "description": "--no-print-commits not working",
          "isBreaking": false,
          "message": "fix: --no-print-commits not working (#57)",
          "references": [
            {
              "type": "pull-request",
              "value": "#57",
            },
            {
              "type": "hash",
              "value": "5675e6e",
            },
          ],
          "scope": "",
          "shortHash": "5675e6e",
          "type": "fix",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "update",
          "isBreaking": false,
          "message": "docs: update",
          "references": [
            {
              "type": "hash",
              "value": "cfd35a1",
            },
          ],
          "scope": "",
          "shortHash": "cfd35a1",
          "type": "docs",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.8.0",
          "isBreaking": false,
          "message": "chore: release v9.8.0",
          "references": [
            {
              "type": "hash",
              "value": "9081b50",
            },
          ],
          "scope": "",
          "shortHash": "9081b50",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "update deps",
          "isBreaking": false,
          "message": "chore: update deps",
          "references": [
            {
              "type": "hash",
              "value": "e5f0631",
            },
          ],
          "scope": "",
          "shortHash": "e5f0631",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "s3xysteak@outlook.com",
              "name": "juicysteak",
            },
          ],
          "body": "",
          "description": "execute could receive a function",
          "isBreaking": false,
          "message": "feat: execute could receive a function (#54)",
          "references": [
            {
              "type": "pull-request",
              "value": "#54",
            },
            {
              "type": "hash",
              "value": "e05fac1",
            },
          ],
          "scope": "",
          "shortHash": "e05fac1",
          "type": "feat",
        },
        {
          "authors": [
            {
              "email": "s3xysteak@outlook.com",
              "name": "juicysteak",
            },
          ],
          "body": "",
          "description": "\`update-files\` should await async functions in beforeEach/afterEach",
          "isBreaking": false,
          "message": "test: \`update-files\` should await async functions in beforeEach/afterEach (#55)",
          "references": [
            {
              "type": "pull-request",
              "value": "#55",
            },
            {
              "type": "hash",
              "value": "14305e3",
            },
          ],
          "scope": "",
          "shortHash": "14305e3",
          "type": "test",
        },
        {
          "authors": [
            {
              "email": "antonydavid945@gmail.com",
              "name": "Antony David",
            },
          ],
          "body": "",
          "description": "replace fast-glob by tinyglobby",
          "isBreaking": false,
          "message": "chore(deps): replace fast-glob by tinyglobby (#50)",
          "references": [
            {
              "type": "pull-request",
              "value": "#50",
            },
            {
              "type": "hash",
              "value": "e461b8f",
            },
          ],
          "scope": "deps",
          "shortHash": "e461b8f",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.7.1",
          "isBreaking": false,
          "message": "chore: release v9.7.1",
          "references": [
            {
              "type": "hash",
              "value": "b2ac17c",
            },
          ],
          "scope": "",
          "shortHash": "b2ac17c",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "remove debug console log",
          "isBreaking": false,
          "message": "fix: remove debug console log",
          "references": [
            {
              "type": "hash",
              "value": "b207d62",
            },
          ],
          "scope": "",
          "shortHash": "b207d62",
          "type": "fix",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.7.0",
          "isBreaking": false,
          "message": "chore: release v9.7.0",
          "references": [
            {
              "type": "hash",
              "value": "47305de",
            },
          ],
          "scope": "",
          "shortHash": "47305de",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "update deps",
          "isBreaking": false,
          "message": "chore: update deps",
          "references": [
            {
              "type": "hash",
              "value": "a11af37",
            },
          ],
          "scope": "",
          "shortHash": "a11af37",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "luz.liting@gmail.com",
              "name": "Liting",
            },
          ],
          "body": "",
          "description": "check git status before bump if option.all is falsy",
          "isBreaking": false,
          "message": "feat: check git status before bump if option.all is falsy (#44)",
          "references": [
            {
              "type": "pull-request",
              "value": "#44",
            },
            {
              "type": "hash",
              "value": "5f78126",
            },
          ],
          "scope": "",
          "shortHash": "5f78126",
          "type": "feat",
        },
        {
          "authors": [
            {
              "email": "neko@ayaka.moe",
              "name": "Neko",
            },
          ],
          "body": "",
          "description": "fix lint & added lint:fix script",
          "isBreaking": false,
          "message": "chore: fix lint & added lint:fix script (#48)",
          "references": [
            {
              "type": "pull-request",
              "value": "#48",
            },
            {
              "type": "hash",
              "value": "81afd3c",
            },
          ],
          "scope": "",
          "shortHash": "81afd3c",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "neko@ayaka.moe",
              "name": "Neko",
            },
          ],
          "body": "",
          "description": "support signing git commits and tags",
          "isBreaking": false,
          "message": "feat(cli): support signing git commits and tags (#47)",
          "references": [
            {
              "type": "pull-request",
              "value": "#47",
            },
            {
              "type": "hash",
              "value": "312cf50",
            },
          ],
          "scope": "cli",
          "shortHash": "312cf50",
          "type": "feat",
        },
        {
          "authors": [
            {
              "email": "neko@ayaka.moe",
              "name": "Neko",
            },
          ],
          "body": "",
          "description": "ignore manifest files without version property",
          "isBreaking": false,
          "message": "feat: ignore manifest files without version property (#49)",
          "references": [
            {
              "type": "pull-request",
              "value": "#49",
            },
            {
              "type": "hash",
              "value": "24c49a5",
            },
          ],
          "scope": "",
          "shortHash": "24c49a5",
          "type": "feat",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "release v9.6.1",
          "isBreaking": false,
          "message": "chore: release v9.6.1",
          "references": [
            {
              "type": "hash",
              "value": "5d4591b",
            },
          ],
          "scope": "",
          "shortHash": "5d4591b",
          "type": "chore",
        },
        {
          "authors": [
            {
              "email": "github@antfu.me",
              "name": "Anthony Fu",
            },
          ],
          "body": "",
          "description": "improve commit printing",
          "isBreaking": false,
          "message": "feat: improve commit printing",
          "references": [
            {
              "type": "hash",
              "value": "aaad54d",
            },
          ],
          "scope": "",
          "shortHash": "aaad54d",
          "type": "feat",
        },
      ]
    `)
})
