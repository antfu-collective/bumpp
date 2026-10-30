import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { normalizeOptions } from '../src/normalize-options'

// Workspace discovery uses process.cwd() (not options.cwd), so chdir into a temp dir.
let dir: string
let originalCwd: string

beforeEach(async () => {
  originalCwd = process.cwd()
  dir = await mkdtemp(join(tmpdir(), 'bumpp-recursive-ws-'))
  process.chdir(dir)
})

afterEach(async () => {
  process.chdir(originalCwd)
  await rm(dir, { recursive: true, force: true })
})

describe('normalizeOptions (recursive workspaces)', () => {
  it('does not throw when pnpm-workspace.yaml parses to null', async () => {
    await writeFile('package.json', JSON.stringify({ name: 'fixture', version: '1.0.0' }))
    await writeFile('pnpm-workspace.yaml', 'null\n')

    const options = await normalizeOptions({
      release: '1.0.1',
      recursive: true,
      tag: false,
      push: false,
      commit: false,
      confirm: false,
    })

    expect(options.files).toEqual(['package.json'])
  })

  it('does not throw when pnpm-workspace.yaml is empty', async () => {
    await writeFile('package.json', JSON.stringify({ name: 'fixture', version: '1.0.0' }))
    await writeFile('pnpm-workspace.yaml', '')

    const options = await normalizeOptions({
      release: '1.0.1',
      recursive: true,
      tag: false,
      push: false,
      commit: false,
      confirm: false,
    })

    expect(options.files).toEqual(['package.json'])
  })

  it('skips missing or non-array packages in pnpm-workspace.yaml', async () => {
    await writeFile('package.json', JSON.stringify({ name: 'fixture', version: '1.0.0' }))
    await writeFile('pnpm-workspace.yaml', 'onlyBuiltDependencies: []\n')

    const options = await normalizeOptions({
      release: '1.0.1',
      recursive: true,
      tag: false,
      push: false,
      commit: false,
      confirm: false,
    })

    expect(options.files).toEqual(['package.json'])
  })

  it('uses default recursive globs on a plain non-monorepo', async () => {
    await writeFile('package.json', JSON.stringify({ name: 'fixture', version: '1.0.0' }))

    const options = await normalizeOptions({
      release: '1.0.1',
      recursive: true,
      tag: false,
      push: false,
      commit: false,
      confirm: false,
    })

    expect(options.files).toEqual(['package.json'])
  })

  it('still picks up valid pnpm workspace packages', async () => {
    await writeFile('package.json', JSON.stringify({ name: 'root', version: '1.0.0' }))
    await writeFile('pnpm-workspace.yaml', 'packages:\n  - packages/*\n')
    await mkdir(join(dir, 'packages', 'a'), { recursive: true })
    await writeFile(join(dir, 'packages', 'a', 'package.json'), JSON.stringify({ name: 'a', version: '1.0.0' }))

    const options = await normalizeOptions({
      release: '1.0.1',
      recursive: true,
      tag: false,
      push: false,
      commit: false,
      confirm: false,
    })

    expect([...options.files].sort()).toEqual([
      'package.json',
      'packages/a/package.json',
    ].sort())
  })
})
