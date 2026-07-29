import type { GitCommit } from 'tiny-conventional-commits-parser'
import type { TemplateTokens } from '../src/tokens'
import { describe, expect, it } from 'vitest'
import { defaultPrBody } from '../src/pr'

const tokens: TemplateTokens = {
  version: '1.2.3',
  oldVersion: '1.2.2',
  tag: 'v1.2.3',
  releaseType: 'minor',
  major: '1',
  minor: '2',
  patch: '3',
  date: '2026-07-28',
}

function commit(partial: Partial<GitCommit>): GitCommit {
  return {
    message: '',
    body: '',
    shortHash: 'abc1234',
    data: '',
    isConventional: true,
    description: '',
    type: '',
    scope: '',
    references: [],
    authors: [],
    isBreaking: false,
    ...partial,
  }
}

describe('defaultPrBody', () => {
  it('renders a summary line with no sections when there are no commits', () => {
    expect(defaultPrBody(tokens, [])).toBe(
      'Release `v1.2.3` (`1.2.2` → `1.2.3`).',
    )
  })

  it('groups commits by type in a stable section order', () => {
    const body = defaultPrBody(tokens, [
      commit({ type: 'chore', description: 'tidy up', shortHash: 'c000001' }),
      commit({ type: 'fix', description: 'handle empty input', shortHash: 'f000001' }),
      commit({ type: 'feat', description: 'add flag', shortHash: 'a000001' }),
    ])

    const featIdx = body.indexOf('### Features')
    const fixIdx = body.indexOf('### Bug Fixes')
    const choreIdx = body.indexOf('### Chores')

    expect(featIdx).toBeGreaterThan(-1)
    expect(fixIdx).toBeGreaterThan(featIdx)
    expect(choreIdx).toBeGreaterThan(fixIdx)
    expect(body).toContain('- add flag (a000001)')
  })

  it('lists breaking changes first, regardless of type', () => {
    const body = defaultPrBody(tokens, [
      commit({ type: 'feat', description: 'a normal feature', shortHash: 'a000001' }),
      commit({ type: 'feat', description: 'drop node 20', shortHash: 'b000001', isBreaking: true }),
    ])

    expect(body.indexOf('### Breaking Changes')).toBeLessThan(body.indexOf('### Features'))
    expect(body).toContain('- drop node 20 (b000001)')
  })

  it('bolds the scope and appends pull-request references', () => {
    const body = defaultPrBody(tokens, [
      commit({
        type: 'feat',
        scope: 'cli',
        description: 'add `--pr` flag',
        shortHash: 'd000001',
        references: [{ type: 'pull-request', value: '#125' }],
      }),
    ])

    expect(body).toContain('- **cli**: add `--pr` flag (#125) (d000001)')
  })

  it('normalizes type aliases and buckets unknown types under Other Changes', () => {
    const body = defaultPrBody(tokens, [
      commit({ type: 'feature', description: 'aliased feat', shortHash: 'e000001' }),
      commit({ type: 'wip', description: 'unknown type', shortHash: 'f000001' }),
    ])

    expect(body).toContain('### Features')
    expect(body).toContain('- aliased feat (e000001)')
    expect(body).toContain('### Other Changes')
    expect(body).toContain('- unknown type (f000001)')
  })
})
