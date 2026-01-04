import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import prompts from 'prompts'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Operation } from '../src/operation'
import { resolvePublishTag } from '../src/publish-config-tag'
import { updateFiles } from '../src/update-files'

describe('resolvePublishTag', () => {
  it('should infer "beta" tag from prerelease version', async () => {
    prompts.inject(['beta'])
    const operation = await Operation.start({ release: '1.0.0-beta.1', cwd: process.cwd() })
    Object.assign(operation.state, { newVersion: '1.0.0-beta.1' })

    await resolvePublishTag(operation)
    expect(operation.state.publishTag).toBe('beta')
  })

  it('should infer "latest" tag from release version', async () => {
    prompts.inject(['latest'])
    const operation = await Operation.start({ release: '1.0.0', cwd: process.cwd() })
    Object.assign(operation.state, { newVersion: '1.0.0' })

    await resolvePublishTag(operation)
    expect(operation.state.publishTag).toBe('latest')
  })

  it('should allow user to override tag', async () => {
    prompts.inject(['next'])
    const operation = await Operation.start({ release: '1.0.0-beta.1', cwd: process.cwd() })
    Object.assign(operation.state, { newVersion: '1.0.0-beta.1' })

    await resolvePublishTag(operation)
    expect(operation.state.publishTag).toBe('next')
  })
})

describe('updateFiles with publishTag', () => {
  let tmpDir: string
  let pkgPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bumpp-test-'))
    pkgPath = path.join(tmpDir, 'package.json')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should add publishConfig.tag if not present', async () => {
    fs.writeFileSync(pkgPath, JSON.stringify({ version: '1.0.0' }, null, 2))
    const operation = await Operation.start({ release: '1.0.1', cwd: tmpDir })
    Object.assign(operation.state, { newVersion: '1.0.1', publishTag: 'beta' })

    await updateFiles(operation)

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    expect(pkg.version).toBe('1.0.1')
    expect(pkg.publishConfig).toEqual({ tag: 'beta' })
  })

  it('should update existing publishConfig.tag', async () => {
    fs.writeFileSync(pkgPath, JSON.stringify({ version: '1.0.0', publishConfig: { tag: 'alpha' } }, null, 2))
    const operation = await Operation.start({ release: '1.0.1', cwd: tmpDir })
    Object.assign(operation.state, { newVersion: '1.0.1', publishTag: 'beta' })

    await updateFiles(operation)

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    expect(pkg.publishConfig.tag).toBe('beta')
  })

  it('should remove publishConfig.tag if tag is latest', async () => {
    fs.writeFileSync(pkgPath, JSON.stringify({ version: '1.0.0', publishConfig: { tag: 'beta' } }, null, 2))
    const operation = await Operation.start({ release: '1.0.1', cwd: tmpDir })
    Object.assign(operation.state, { newVersion: '1.0.1', publishTag: 'latest' })

    await updateFiles(operation)

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    // publishConfig might be empty object or removed, or just tag removed.
    // implementation: file.modified.push([['publishConfig', 'tag'], undefined])
    // jsonc-parser remove logic should remove the key.
    if (pkg.publishConfig) {
      expect(pkg.publishConfig.tag).toBeUndefined()
    }
    else {
      expect(pkg.publishConfig).toBeUndefined()
    }
  })

  it('should not add publishConfig if tag is latest and not present', async () => {
    fs.writeFileSync(pkgPath, JSON.stringify({ version: '1.0.0' }, null, 2))
    const operation = await Operation.start({ release: '1.0.1', cwd: tmpDir })
    Object.assign(operation.state, { newVersion: '1.0.1', publishTag: 'latest' })

    await updateFiles(operation)

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    expect(pkg.publishConfig).toBeUndefined()
  })

  it('should not remove publishConfig if tag is latest', async () => {
    fs.writeFileSync(pkgPath, JSON.stringify({ version: '1.0.0', publishConfig: { tag: 'alpha' } }, null, 2))
    const operation = await Operation.start({ release: '1.0.1', cwd: tmpDir })
    Object.assign(operation.state, { newVersion: '1.0.1', publishTag: 'latest' })

    await updateFiles(operation)

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    expect(pkg.publishConfig).toBeUndefined()
  })

  it('should keep other publishConfig fields (e.g. access) when removing tag', async () => {
    fs.writeFileSync(pkgPath, JSON.stringify({
      version: '1.0.0',
      publishConfig: { tag: 'beta', access: 'public' },
    }, null, 2))
    const operation = await Operation.start({ release: '1.0.1', cwd: tmpDir })
    Object.assign(operation.state, { newVersion: '1.0.1', publishTag: 'latest' })

    await updateFiles(operation)

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    expect(pkg.publishConfig.tag).toBeUndefined()
    expect(pkg.publishConfig.access).toBe('public')
  })
})

describe('updateFiles in Monorepo', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bumpp-test-monorepo-'))
    fs.mkdirSync(path.join(tmpDir, 'packages/a'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'packages/b'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should update multiple packages with the same tag', async () => {
    const pkgAPath = path.join(tmpDir, 'packages/a/package.json')
    const pkgBPath = path.join(tmpDir, 'packages/b/package.json')

    fs.writeFileSync(pkgAPath, JSON.stringify({ version: '1.0.0' }, null, 2))
    fs.writeFileSync(pkgBPath, JSON.stringify({ version: '1.0.0' }, null, 2))

    const operation = await Operation.start({
      release: '1.0.1-beta.1',
      cwd: tmpDir,
      files: ['packages/a/package.json', 'packages/b/package.json'],
    })

    // Simulate resolved tag
    Object.assign(operation.state, {
      newVersion: '1.0.1-beta.1',
      publishTag: 'beta',
    })

    await updateFiles(operation)

    const pkgA = JSON.parse(fs.readFileSync(pkgAPath, 'utf-8'))
    const pkgB = JSON.parse(fs.readFileSync(pkgBPath, 'utf-8'))

    expect(pkgA.publishConfig.tag).toBe('beta')
    expect(pkgB.publishConfig.tag).toBe('beta')
  })
})
