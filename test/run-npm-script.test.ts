import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { Operation } from '../src/operation'
import { runNpmScript } from '../src/run-npm-script'
import { NpmScript } from '../src/types/version-bump-progress'

const testdata = join(cwd(), 'test', 'run-npm-script', 'testdata')

beforeEach(async () => {
  await mkdir(testdata, { recursive: true }).catch(() => { })
})

afterEach(async () => {
  await rm(testdata, { recursive: true }).catch(() => { })
})

it('should skip the npm scripts when there is no package.json', async () => {
  const operation = await Operation.start({
    cwd: testdata,
    currentVersion: '1.0.0',
  })

  await expect(runNpmScript(NpmScript.PreVersion, operation)).resolves.toBe(operation)
})
