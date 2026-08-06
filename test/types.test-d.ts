import type { VersionBumpOptions } from '../src'
import { expectTypeOf, it } from 'vitest'

it('release accepts release types, versions and prompt', () => {
  expectTypeOf<'patch'>().toExtend<VersionBumpOptions['release']>()
  expectTypeOf<'1.2.3'>().toExtend<VersionBumpOptions['release']>()
  expectTypeOf<'prompt'>().toExtend<VersionBumpOptions['release']>()
  // @ts-expect-error typo must be rejected
  expectTypeOf<'prerealse'>().toExtend<VersionBumpOptions['release']>()
})
