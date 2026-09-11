import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
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

async function bumpWithExecute(execute: string) {
  const dir = await mkdtemp(join(tmpdir(), 'bumpp-exec-'))
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0' }, null, 2))
  await versionBump({
    cwd: dir,
    release: 'patch',
    confirm: false,
    execute,
  })
  return dir
}

it('substitutes %s in --execute with the new version', async () => {
  const dir = await bumpWithExecute(`node -e "require('fs').writeFileSync('out.txt', '%s')"`)
  try {
    expect(await readFile(join(dir, 'out.txt'), 'utf8')).toBe('1.0.1')
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})

it('substitutes {version} in --execute with the new version', async () => {
  const dir = await bumpWithExecute(`node -e "require('fs').writeFileSync('out.txt', '{version}')"`)
  try {
    expect(await readFile(join(dir, 'out.txt'), 'utf8')).toBe('1.0.1')
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})

it('does not append the version to --execute when there is no placeholder', async () => {
  const dir = await bumpWithExecute(`node -e "require('fs').writeFileSync('out.txt', 'ok')"`)
  try {
    expect(await readFile(join(dir, 'out.txt'), 'utf8')).toBe('ok')
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})
