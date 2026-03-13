import type { InspectColor } from 'node:util'
import type { GitCommit } from 'tiny-conventional-commits-parser'
import { styleText } from 'node:util'

const colorFn = (color: InspectColor) => (s: string) => styleText(color, s)
const gray = colorFn('gray')
const green = colorFn('green')
const cyan = colorFn('cyan')
const blue = colorFn('blue')
const yellow = colorFn('yellow')
const magenta = colorFn('magenta')
const red = colorFn('red')

const messageColorMap: Record<string, (s: string) => string> = {
  feat: green,
  feature: green,

  refactor: cyan,
  style: cyan,

  docs: blue,
  doc: blue,
  types: blue,
  type: blue,

  chore: gray,
  ci: gray,
  build: gray,
  deps: gray,
  dev: gray,

  fix: yellow,
  test: yellow,

  perf: magenta,

  revert: red,
  breaking: red,
}

export function formatParsedCommits(commits: GitCommit[]) {
  const typeLength = commits.map(({ type }) => type.length).reduce((a, b) => Math.max(a, b), 0)
  const scopeLength = commits.map(({ scope }) => scope.length).reduce((a, b) => Math.max(a, b), 0)

  return commits.map((commit) => {
    let color = messageColorMap[commit.type] || ((s: string) => s)
    if (commit.isBreaking) {
      color = s => styleText(['inverse', 'red'], s)
    }

    const paddedType = commit.type.padStart(typeLength + 1, ' ')
    const paddedScope = !commit.scope
      ? ' '.repeat(scopeLength ? scopeLength + 2 : 0)
      : styleText('dim', '(') + commit.scope + styleText('dim', ')') + ' '.repeat(scopeLength - commit.scope.length)

    return [
      styleText('dim', commit.shortHash),
      ' ',
      color === gray ? color(paddedType) : styleText('bold', color(paddedType)),
      ' ',
      paddedScope,
      styleText('dim', ':'),
      ' ',
      color === gray ? color(commit.description) : commit.description,
    ].join('')
  })
}

export function printRecentCommits(commits: GitCommit[]): void {
  if (!commits.length) {
    console.log()
    console.log(styleText('blue', 'i') + styleText('gray', ' No commits since the last version'))
    console.log()
    return
  }

  const prettified = formatParsedCommits(commits)

  console.log()
  console.log(styleText('bold', `${styleText('green', String(commits.length))} Commits since the last version:`))
  console.log()
  console.log(prettified.join('\n'))
  console.log()
}
