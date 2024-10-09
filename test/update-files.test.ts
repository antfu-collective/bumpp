import { mkdir, readFile, rmdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { Operation } from '../src/operation'
import { updateFiles } from '../src/update-files'

beforeEach(async () => {
  mkdir(join(cwd(), 'test', 'update-files', 'testdata'), { recursive: true }).catch(() => { })
})

afterEach(async () => {
  rmdir(join(cwd(), 'test', 'update-files', 'testdata'), { recursive: true }).catch(() => { })
})

it('should skip to modify the manifest file if version field is not specified', async () => {
  await writeFile(join(cwd(), 'test', 'update-files', 'testdata', 'package.json'), JSON.stringify({}), 'utf8')

  const operation = await Operation.start({
    cwd: join(cwd(), 'test', 'update-files', 'testdata'),
    currentVersion: '1.0.0',
  })

  operation.update({
    newVersion: '2.0.0',
  })

  await updateFiles(operation)
  const updatedPackageJSON = await readFile(join(cwd(), 'test', 'update-files', 'testdata', 'package.json'), 'utf8')
  expect(JSON.parse(updatedPackageJSON)).toMatchObject({})
})
