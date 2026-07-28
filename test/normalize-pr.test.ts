import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_PR_BRANCH, normalizeOptions } from '../src/normalize-options'

describe('normalizeOptions (pr)', () => {
  it('leaves pr undefined when not requested', async () => {
    const options = await normalizeOptions({ release: '2.0.0', tag: false, push: false, commit: false })
    expect(options.pr).toBeUndefined()
  })

  it('applies defaults when pr is true', async () => {
    const options = await normalizeOptions({ release: '2.0.0', pr: true, push: true })
    expect(options.pr).toEqual({
      branch: DEFAULT_PR_BRANCH,
      base: undefined,
      title: undefined,
      body: undefined,
      draft: false,
    })
  })

  it('accepts an object form and preserves fields', async () => {
    const body = () => 'custom body'
    const options = await normalizeOptions({
      release: '2.0.0',
      push: true,
      pr: { branch: 'release/{version}', base: 'develop', title: 'Release {tag}', body, draft: true },
    })
    expect(options.pr).toEqual({
      branch: 'release/{version}',
      base: 'develop',
      title: 'Release {tag}',
      body,
      draft: true,
    })
  })

  it('throws when pr is enabled but push is disabled', async () => {
    await expect(normalizeOptions({ release: '2.0.0', pr: true, push: false }))
      .rejects
      .toThrow(/requires `push`/)
  })

  it('disables the tag (with a warning) when pr is enabled', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const options = await normalizeOptions({ release: '2.0.0', pr: true, tag: true, push: true })
    expect(options.tag).toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('still creates a commit when pr is enabled', async () => {
    const options = await normalizeOptions({ release: '2.0.0', pr: true, push: true })
    expect(options.commit).toBeTruthy()
  })
})
