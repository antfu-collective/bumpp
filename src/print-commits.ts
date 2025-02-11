import type { GitCommit } from 'tiny-conventional-commits-parser'
import c from 'ansis'

const messageColorMap: Record<string, (c: string) => string> = {
  feat: c.green,
  feature: c.green,

  refactor: c.cyan,
  style: c.cyan,

  docs: c.blue,
  doc: c.blue,
  types: c.blue,
  type: c.blue,

  chore: c.gray,
  ci: c.gray,
  build: c.gray,
  deps: c.gray,
  dev: c.gray,

  fix: c.yellow,
  test: c.yellow,

  perf: c.magenta,

  revert: c.red,
  breaking: c.red,
}

export function formatParsedCommits(commits: GitCommit[]) {
  const typeLength = commits.map(({ type }) => type.length).reduce((a, b) => Math.max(a, b), 0)
  const scopeLength = commits.map(({ scope }) => scope.length).reduce((a, b) => Math.max(a, b), 0)

  return commits.map((commit) => {
    let color = messageColorMap[commit.type] || ((c: string) => c)
    if (commit.isBreaking) {
      color = s => c.inverse.red(s)
    }

    const paddedType = commit.type.padStart(typeLength + 1, ' ')
    const paddedScope = !commit.scope
      ? ' '.repeat(scopeLength ? scopeLength + 2 : 0)
      : c.dim`(` + commit.scope + c.dim`)` + ' '.repeat(scopeLength - commit.scope.length)

    return [
      c.dim(commit.shortHash),
      ' ',
      color === c.gray ? color(paddedType) : c.bold(color(paddedType)),
      ' ',
      paddedScope,
      c.dim(':'),
      ' ',
      color === c.gray ? color(commit.description) : commit.description,
    ].join('')
  })
}

export function printRecentCommits(commits: GitCommit[]): void {
  if (!commits.length) {
    console.log()
    console.log(c.blue`i` + c.gray` No commits since the last version`)
    console.log()
    return
  }

  const prettified = formatParsedCommits(commits)

  console.log()
  console.log(c.bold`${c.green(commits.length)} Commits since the last version:`)
  console.log()
  console.log(prettified.join('\n'))
  console.log()
}
