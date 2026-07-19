import { describe, expect, it } from 'vitest'
import { versionBumpInfo } from '../src'

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
})
