import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { expect, it } from 'vitest'
import { versionBump } from '../src'

const distDir = join(cwd(), 'test', 'fixture', 'dist')

it('exec command to clean dist dir', async () => {
  if (!existsSync(distDir)) {
    await mkdir(distDir)
  }

  expect(existsSync(distDir)).toBeTruthy()
  await versionBump({
    cwd: join(cwd(), 'test', 'fixture'),
    release: '0.0.1',
    confirm: false,
    execute: 'npm run clean',
  })
  expect(existsSync(distDir)).toBeFalsy()
})
