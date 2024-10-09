import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { expect, it } from 'vitest'
import { Operation } from '../src/operation'
import { updateFiles } from '../src/update-files'

it('should skip to modify the manifest file if version field is not specified', async () => {
  const operation = await Operation.start({
    cwd: join(cwd(), 'test', 'testdata'),
    currentVersion: '1.0.0',
  })

  operation.update({
    newVersion: '2.0.0',
  })

  await updateFiles(operation)
  const updatedPackageJSON = await readFile(join(cwd(), 'test', 'testdata', 'package.json'), 'utf8')
  expect(JSON.parse(updatedPackageJSON)).toMatchObject({})
})
