import { describe, expect, it } from 'vitest'
import { checkPushRemoteMatchesPackage } from '../src/check-push-remote'
import {
  getRepositoryFieldValue,
  parseRepoSlug,
  reposMatch,
} from '../src/git'

describe('parseRepoSlug', () => {
  it('parses HTTPS GitHub URLs', () => {
    expect(parseRepoSlug('https://github.com/antfu-collective/bumpp.git'))
      .toEqual({ owner: 'antfu-collective', repo: 'bumpp' })
    expect(parseRepoSlug('https://github.com/antfu-collective/bumpp'))
      .toEqual({ owner: 'antfu-collective', repo: 'bumpp' })
  })

  it('parses SSH and git+ URLs the same as HTTPS', () => {
    expect(parseRepoSlug('git@github.com:antfu-collective/bumpp.git'))
      .toEqual({ owner: 'antfu-collective', repo: 'bumpp' })
    expect(parseRepoSlug('git+https://github.com/antfu-collective/bumpp.git'))
      .toEqual({ owner: 'antfu-collective', repo: 'bumpp' })
    expect(parseRepoSlug('ssh://git@github.com/antfu-collective/bumpp.git'))
      .toEqual({ owner: 'antfu-collective', repo: 'bumpp' })
  })

  it('parses npm shorthand forms', () => {
    expect(parseRepoSlug('antfu-collective/bumpp'))
      .toEqual({ owner: 'antfu-collective', repo: 'bumpp' })
    expect(parseRepoSlug('github:antfu-collective/bumpp'))
      .toEqual({ owner: 'antfu-collective', repo: 'bumpp' })
  })

  it('returns undefined for unparseable input', () => {
    expect(parseRepoSlug('')).toBeUndefined()
    expect(parseRepoSlug('not a repo')).toBeUndefined()
  })
})

describe('reposMatch', () => {
  it('compares owner/repo case-insensitively', () => {
    expect(reposMatch(
      { owner: 'AntFu-Collective', repo: 'Bumpp' },
      { owner: 'antfu-collective', repo: 'bumpp' },
    )).toBe(true)
    expect(reposMatch(
      { owner: 'webywz', repo: 'bumpp' },
      { owner: 'antfu-collective', repo: 'bumpp' },
    )).toBe(false)
  })
})

describe('getRepositoryFieldValue', () => {
  it('accepts string and object forms', () => {
    expect(getRepositoryFieldValue('antfu-collective/bumpp'))
      .toBe('antfu-collective/bumpp')
    expect(getRepositoryFieldValue({ type: 'git', url: 'https://github.com/antfu-collective/bumpp.git' }))
      .toBe('https://github.com/antfu-collective/bumpp.git')
    expect(getRepositoryFieldValue({ url: 'git@github.com:antfu-collective/bumpp.git' }))
      .toBe('git@github.com:antfu-collective/bumpp.git')
    expect(getRepositoryFieldValue(undefined)).toBeUndefined()
    expect(getRepositoryFieldValue({})).toBeUndefined()
  })
})

describe('checkPushRemoteMatchesPackage', () => {
  it('skips when push is disabled', async () => {
    await expect(checkPushRemoteMatchesPackage({
      push: false,
      cwd: '/tmp',
      readPackageJson: async () => ({ repository: 'antfu-collective/bumpp' }),
      getRemoteUrl: async () => 'git@github.com:webywz/bumpp.git',
    })).resolves.toBeUndefined()
  })

  it('skips when package.json has no repository field', async () => {
    await expect(checkPushRemoteMatchesPackage({
      push: true,
      cwd: '/tmp',
      readPackageJson: async () => ({ name: 'demo' }),
      getRemoteUrl: async () => 'git@github.com:webywz/bumpp.git',
    })).resolves.toBeUndefined()
  })

  it('skips when origin is missing', async () => {
    await expect(checkPushRemoteMatchesPackage({
      push: true,
      cwd: '/tmp',
      readPackageJson: async () => ({ repository: 'antfu-collective/bumpp' }),
      getRemoteUrl: async () => undefined,
    })).resolves.toBeUndefined()
  })

  it('allows matching remotes across SSH and HTTPS', async () => {
    await expect(checkPushRemoteMatchesPackage({
      push: true,
      cwd: '/tmp',
      readPackageJson: async () => ({
        repository: {
          type: 'git',
          url: 'https://github.com/antfu-collective/bumpp.git',
        },
      }),
      getRemoteUrl: async () => 'git@github.com:antfu-collective/bumpp.git',
    })).resolves.toBeUndefined()
  })

  it('errors when origin is a fork of the package.json repository', async () => {
    await expect(checkPushRemoteMatchesPackage({
      push: true,
      cwd: '/tmp',
      readPackageJson: async () => ({
        repository: 'https://github.com/antfu-collective/bumpp.git',
      }),
      getRemoteUrl: async () => 'git@github.com:webywz/bumpp.git',
    })).rejects.toThrow(/origin.*webywz\/bumpp[\s\S]*antfu-collective\/bumpp/)
  })

  it('errors with a string repository field against a mismatched HTTPS origin', async () => {
    await expect(checkPushRemoteMatchesPackage({
      push: true,
      cwd: '/tmp',
      readPackageJson: async () => ({ repository: 'github:antfu-collective/sponsorkit' }),
      getRemoteUrl: async () => 'https://github.com/someone/sponsorkit.git',
    })).rejects.toThrow(/--no-push/)
  })
})
