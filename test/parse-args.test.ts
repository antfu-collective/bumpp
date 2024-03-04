import { describe, expect, it } from 'vitest'
import { loadCliArgs } from '../src/cli/parse-args'

const defaultArgs = ['node', 'bumpp']

describe('loadCliArgs', async () => {
  it('returns an object with the correct properties', () => {
    const result = loadCliArgs()

    expect(typeof result).toBe('object')
    expect(typeof result.args).toBe('object')
    expect(typeof result.resultArgs).toBe('object')
  })

  it('sets the commit property to undefined if no commit flag is present', () => {
    const result = loadCliArgs([...defaultArgs])

    expect(result.args.commit).toBe(undefined)
  })

  it('sets the commit property to true if `--commit` is present', () => {
    const result = loadCliArgs([...defaultArgs, '--commit'])

    expect(result.args.commit).toBe(true)
  })

  it('sets the commit property to true if `-c` is present', () => {
    const result = loadCliArgs([...defaultArgs, '-c'])

    expect(result.args.commit).toBe(true)
  })

  it('sets the commit property to false if `--no-commit` is present', () => {
    const result = loadCliArgs([...defaultArgs, '--no-commit'])

    expect(result.args.commit).toBe(false)
  })
})
