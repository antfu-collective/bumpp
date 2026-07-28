import { describe, expect, it } from 'vitest'
import { hasNamedTokens, renderTemplate } from '../src/tokens'

const tokens = {
  version: '1.2.3',
  oldVersion: '1.2.2',
  tag: 'v1.2.3',
  releaseType: 'patch',
  major: '1',
  minor: '2',
  patch: '3',
  date: '2026-07-28',
}

describe('hasNamedTokens', () => {
  it('detects known tokens', () => {
    expect(hasNamedTokens('release/v{version}')).toBe(true)
    expect(hasNamedTokens('{tag}')).toBe(true)
    expect(hasNamedTokens('bump to {major}.{minor}')).toBe(true)
  })

  it('ignores unknown braces and legacy placeholders', () => {
    expect(hasNamedTokens('chore: release %s')).toBe(false)
    expect(hasNamedTokens('release v')).toBe(false)
    expect(hasNamedTokens('{unknown}')).toBe(false)
  })
})

describe('renderTemplate (named tokens)', () => {
  it('substitutes each known token', () => {
    expect(renderTemplate('release/v{version}', tokens)).toBe('release/v1.2.3')
    expect(renderTemplate('chore: release {tag}', tokens)).toBe('chore: release v1.2.3')
    expect(renderTemplate('{oldVersion} -> {version}', tokens)).toBe('1.2.2 -> 1.2.3')
    expect(renderTemplate('{major}.{minor}.{patch} ({releaseType}) {date}', tokens))
      .toBe('1.2.3 (patch) 2026-07-28')
  })

  it('leaves unknown tokens untouched', () => {
    expect(renderTemplate('{version}-{unknown}', tokens)).toBe('1.2.3-{unknown}')
  })

  it('disables legacy %s once any named token is present', () => {
    expect(renderTemplate('{version} %s', tokens)).toBe('1.2.3 %s')
  })
})

describe('renderTemplate (legacy %s, soft-deprecated)', () => {
  it('replaces %s with the new version', () => {
    expect(renderTemplate('release: %s', tokens)).toBe('release: 1.2.3')
  })

  it('appends the version when there is no placeholder', () => {
    expect(renderTemplate('chore: release v', tokens)).toBe('chore: release v1.2.3')
  })
})
