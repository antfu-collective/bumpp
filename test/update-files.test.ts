import { mkdir, readFile, rmdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { Operation } from '../src/operation'
import { updateFiles } from '../src/update-files'

beforeEach(async () => {
  await mkdir(join(cwd(), 'test', 'update-files', 'testdata'), { recursive: true }).catch(() => { })
})

afterEach(async () => {
  await rmdir(join(cwd(), 'test', 'update-files', 'testdata'), { recursive: true }).catch(() => { })
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

it('should update the manifest file correctly', async () => {
  await writeFile(join(cwd(), 'test', 'update-files', 'testdata', 'package-lock.json'), JSON.stringify(
    {
      name: 'example',
      version: '1.0.43',
      lockfileVersion: 2,
      requires: true,
      packages: {
        '': {
          name: 'example',
          version: '1.0.43',
          hasInstallScript: true,
          dependencies: {},
        },
      },
    },
    null,
    2,
  ), 'utf8')

  const operation = await Operation.start({
    cwd: join(cwd(), 'test', 'update-files', 'testdata'),
    currentVersion: '1.0.0',
  })

  operation.update({
    newVersion: '2.0.0',
  })

  await updateFiles(operation)
  const updatedPackageJSON = await readFile(join(cwd(), 'test', 'update-files', 'testdata', 'package-lock.json'), 'utf8')
  expect(JSON.parse(updatedPackageJSON)).toMatchObject({
    name: 'example',
    version: '2.0.0',
    lockfileVersion: 2,
    requires: true,
    packages: {
      '': {
        name: 'example',
        version: '2.0.0',
        hasInstallScript: true,
        dependencies: {},
      },
    },
  })
})
