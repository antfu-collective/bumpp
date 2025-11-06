import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cargoTomlCache, readCargoToml, readCargoTomlVersion, updateCargoTomlFile } from '../src/cargo-toml'
import { Operation } from '../src/operation'

const workspace = join(cwd(), 'test', 'cargo-toml', 'testdata')
const filepath = join(workspace, 'Cargo.toml')

beforeEach(async () => {
  await mkdir(workspace, { recursive: true }).catch(() => { })
})

afterEach(async () => {
  await rm(workspace, { recursive: true }).catch(() => { })
  cargoTomlCache.clear()
})

describe('readCargoTomlVersion', () => {
  it('should read version with correct priority order', async () => {
    // Priority: package.version > workspace.package.version > dependencies > workspace.dependencies
    const cargoTomlContent = `[workspace]
members = ["crate1"]

[workspace.package]
version = "2.0.0"

[package]
name = "example"
version = "1.0.0"
`
    await writeFile(filepath, cargoTomlContent, 'utf-8')

    const result = await readCargoTomlVersion([filepath])
    expect(result?.currentVersion).toBe('1.0.0')
    expect(result?.currentVersionSource).toBe(filepath)
  })

  it('should read version from workspace.package when package.version not exists', async () => {
    const cargoTomlContent = `[workspace]
members = ["crate1", "crate2"]

[workspace.package]
version = "2.5.0"
`
    await writeFile(filepath, cargoTomlContent, 'utf-8')

    const result = await readCargoTomlVersion([filepath])
    expect(result?.currentVersion).toBe('2.5.0')
    expect(result?.currentVersionSource).toBe(filepath)
  })

  it('should read version from dependencies with path', async () => {
    const cargoTomlContent = `[package]
name = "example"

[dependencies]
my-crate = { version = "1.5.0", path = "./my-crate" }
`
    await writeFile(filepath, cargoTomlContent, 'utf-8')

    const result = await readCargoTomlVersion([filepath])
    expect(result?.currentVersion).toBe('1.5.0')
    expect(result?.currentVersionSource).toBe(filepath)
  })

  it('should read version from workspace.dependencies with path', async () => {
    const cargoTomlContent = `[workspace]
members = ["crate1", "crate2"]

[workspace.dependencies]
my-crate = { version = "3.4.5", path = "./my-crate" }
`
    await writeFile(filepath, cargoTomlContent, 'utf-8')

    const result = await readCargoTomlVersion([filepath])
    expect(result?.currentVersion).toBe('3.4.5')
    expect(result?.currentVersionSource).toBe(filepath)
  })

  it('should return undefined when no valid version found', async () => {
    const cargoTomlContent = `[workspace]
members = ["crate1"]

[workspace.dependencies]
my-crate = { path = "./my-crate" }
another-crate = "1.0.0"
`
    await writeFile(filepath, cargoTomlContent, 'utf-8')

    const result = await readCargoTomlVersion([filepath])
    expect(result).toBeUndefined()
  })
})

describe('updateCargoTomlFile - basic updates', () => {
  it('should update package.version', async () => {
    const cargoTomlContent = `[package]
name = "example"
version = "1.0.0"
`
    await writeFile(filepath, cargoTomlContent, 'utf-8')

    const operation = await Operation.start({
      cwd: workspace,
      currentVersion: '1.0.0',
    })

    operation.update({ newVersion: '2.0.0' })

    const modified = await updateCargoTomlFile('Cargo.toml', operation)
    expect(modified).toBe(true)

    const updatedContent = await readFile(filepath, 'utf-8')
    expect(updatedContent).toContain('version = "2.0.0"')
  })

  it('should update workspace.package.version', async () => {
    const cargoTomlContent = `[workspace]
members = ["crate1"]

[workspace.package]
version = "1.0.0"
`
    await writeFile(filepath, cargoTomlContent, 'utf-8')

    const operation = await Operation.start({
      cwd: workspace,
      currentVersion: '1.0.0',
    })

    operation.update({ newVersion: '2.0.0' })

    const modified = await updateCargoTomlFile('Cargo.toml', operation)
    expect(modified).toBe(true)

    const cargoToml = await readCargoToml(filepath)
    expect(cargoToml.workspace?.package?.version).toBe('2.0.0')
  })

  it('should not modify when version is already up to date', async () => {
    const cargoTomlContent = `[package]
name = "example"
version = "2.0.0"
`
    await writeFile(filepath, cargoTomlContent, 'utf-8')

    const operation = await Operation.start({
      cwd: workspace,
      currentVersion: '1.0.0',
    })

    operation.update({ newVersion: '2.0.0' })

    const modified = await updateCargoTomlFile('Cargo.toml', operation)
    expect(modified).toBe(false)
  })
})

describe('updateCargoTomlFile - internal vs external dependencies', () => {
  it('should update internal dependencies but not external ones in dependencies section', async () => {
    const cargoTomlContent = `[package]
name = "example"
version = "1.0.0"

[dependencies]
internal-crate = { version = "1.0.0", path = "../internal" }
local-crate = { path = "../local" }
external-crate = "2.0.0"
`
    await writeFile(filepath, cargoTomlContent, 'utf-8')

    const operation = await Operation.start({
      cwd: workspace,
      currentVersion: '1.0.0',
    })

    operation.update({ newVersion: '3.0.0' })

    const modified = await updateCargoTomlFile('Cargo.toml', operation)
    expect(modified).toBe(true)

    const cargoToml = await readCargoToml(filepath)
    expect(cargoToml.package?.version).toBe('3.0.0')
    expect(cargoToml.dependencies?.['internal-crate']).toMatchObject({
      version: '3.0.0',
      path: '../internal',
    })
    expect(cargoToml.dependencies?.['local-crate']).toMatchObject({ path: '../local' })
    expect(cargoToml.dependencies?.['external-crate']).toBe('2.0.0')
  })

  it('should update internal dependencies but not external ones in workspace.dependencies', async () => {
    const cargoTomlContent = `[package]
name = "example"
version = "1.0.0"

[workspace.dependencies]
internal = { version = "1.0.0", path = "./internal" }
serde = { version = "1.0.130" }
tokio = "1.0.0"
`
    await writeFile(filepath, cargoTomlContent, 'utf-8')

    const operation = await Operation.start({
      cwd: workspace,
      currentVersion: '1.0.0',
    })

    operation.update({ newVersion: '2.0.0' })

    const modified = await updateCargoTomlFile('Cargo.toml', operation)
    expect(modified).toBe(true)

    const cargoToml = await readCargoToml(filepath)
    expect(cargoToml.workspace?.dependencies?.internal).toMatchObject({
      version: '2.0.0',
      path: './internal',
    })
    expect(cargoToml.workspace?.dependencies?.serde).toMatchObject({
      version: '1.0.130',
    })
    expect(cargoToml.workspace?.dependencies?.tokio).toBe('1.0.0')
  })
})

describe('updateCargoTomlFile - complex scenarios', () => {
  it('should update all internal version fields in a complex workspace', async () => {
    const cargoTomlContent = `[workspace]
members = ["crate1", "crate2"]

[workspace.package]
version = "1.0.0"

[workspace.dependencies]
crate1 = { version = "1.0.0", path = "./crate1" }
crate2 = { version = "1.0.0", path = "./crate2" }
serde = "1.0"

[package]
name = "workspace-root"
version = "1.0.0"

[dependencies]
crate1 = { version = "1.0.0", path = "./crate1" }
external = "2.0.0"
`
    await writeFile(filepath, cargoTomlContent, 'utf-8')

    const operation = await Operation.start({
      cwd: workspace,
      currentVersion: '1.0.0',
    })

    operation.update({ newVersion: '5.0.0' })

    const modified = await updateCargoTomlFile('Cargo.toml', operation)
    expect(modified).toBe(true)

    const cargoToml = await readCargoToml(filepath)
    // All internal versions should be updated
    expect(cargoToml.package?.version).toBe('5.0.0')
    expect(cargoToml.workspace?.package?.version).toBe('5.0.0')
    expect(cargoToml.workspace?.dependencies?.crate1).toMatchObject({
      version: '5.0.0',
      path: './crate1',
    })
    expect(cargoToml.workspace?.dependencies?.crate2).toMatchObject({
      version: '5.0.0',
      path: './crate2',
    })
    expect(cargoToml.dependencies?.crate1).toMatchObject({
      version: '5.0.0',
      path: './crate1',
    })
    // External dependencies should remain unchanged
    expect(cargoToml.workspace?.dependencies?.serde).toBe('1.0')
    expect(cargoToml.dependencies?.external).toBe('2.0.0')
  })
})
