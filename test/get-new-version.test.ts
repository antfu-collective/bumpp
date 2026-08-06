import { describe, expect, it, vi } from 'vitest'
import { versionBumpInfo } from '../src'

vi.mock('prompts', () => ({
  default: vi.fn(async () => ({ release: 'minor' })),
}))

describe('getNewVersion', () => {
  it('normalizes explicit loose versions', async () => {
    const operation = await versionBumpInfo({
      currentVersion: '1.0.0',
      release: 'v2.0.0',
    })

    expect(operation.results.newVersion).toBe('2.0.0')
  })

  it('starts prerelease versions at one', async () => {
    const operation = await versionBumpInfo({
      currentVersion: '1.2.3',
      preid: 'beta',
      release: 'prepatch',
    })

    expect(operation.results.newVersion).toBe('1.2.4-beta.1')
  })

  it('increments existing prerelease versions', async () => {
    const operation = await versionBumpInfo({
      currentVersion: '1.2.4-beta.1',
      preid: 'beta',
      release: 'prerelease',
    })

    expect(operation.results.newVersion).toBe('1.2.4-beta.2')
  })

  // `verkit` omits `prerelease` entirely for stable versions, unlike `semver`
  // which always returned an empty array. Guard against dereferencing it.
  describe('stable (non-prerelease) current versions', () => {
    it('bumps `next` to a patch', async () => {
      const operation = await versionBumpInfo({
        currentVersion: '12.0.0',
        release: 'next',
      })

      expect(operation.results.newVersion).toBe('12.0.1')
    })

    it('bumps `conventional` without throwing', async () => {
      const operation = await versionBumpInfo({
        currentVersion: '12.0.0',
        release: 'conventional',
      })

      expect(operation.results.newVersion).toMatch(/^\d+\.\d+\.\d+$/)
    })

    it('prompts without throwing', async () => {
      const operation = await versionBumpInfo({
        currentVersion: '12.0.0',
        release: 'prompt',
      })

      expect(operation.results.newVersion).toBe('12.1.0')
    })
  })
})
