import type { Operation } from './operation'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { valid as isValidVersion } from 'semver'
import { parse, stringify } from 'smol-toml'

type CargoTomlDep = string | { version?: string, path?: string }

// https://doc.rust-lang.org/cargo/reference/manifest.html
interface CargoToml {
  package?: {
    version?: string
  }
  dependencies?: Record<string, CargoTomlDep>
  workspace?: {
    // The workspace.package table is where you define keys that can be inherited by members of a workspace
    package?: { version?: string }
    members?: string[]
    dependencies?: Record<string, CargoTomlDep>
  }
}

export const cargoTomlCache = new Map<string, CargoToml>()

/**
 * Read the Cargo.toml file and return the data.
 */
export async function readCargoToml(path: string = 'Cargo.toml'): Promise<CargoToml> {
  if (cargoTomlCache.has(path))
    return cargoTomlCache.get(path)!

  const content = await readFile(path, 'utf-8')
  const data = parse(content) as CargoToml
  cargoTomlCache.set(path, data)
  return data
}

/**
 * Write the Cargo.toml file with the data.
 */
export async function writeCargoToml(path: string, data: CargoToml): Promise<void> {
  const toml = stringify(data)
  await writeFile(path, toml, 'utf-8')
}

/**
 * Find the first valid version in Cargo.toml, root Cargo.toml will detect workspace dependencies.
 */
export async function readCargoTomlVersion(paths: string[]): Promise<{
  currentVersionSource: string
  currentVersion: string
} | undefined> {
  const detect = (dependencies: Record<string, CargoTomlDep>) => {
    for (const [_, value] of Object.entries(dependencies)) {
      if (typeof value === 'string')
        continue
      if (value.path && value.version && isValidVersion(value.version)) {
        return value.version
      }
    }
  }

  // Priority order:
  // 1. package.version - current package's version (most specific)
  // 2. workspace.package.version - workspace shared version
  // 3. dependencies - internal dependencies in current package
  // 4. workspace.dependencies - workspace internal dependencies
  for (const path of paths) {
    const cargoToml = await readCargoToml(path)

    // Check package version
    if (cargoToml.package?.version && isValidVersion(cargoToml.package.version)) {
      return {
        currentVersionSource: path,
        currentVersion: cargoToml.package.version,
      }
    }

    // Check workspace package version
    if (cargoToml.workspace?.package?.version && isValidVersion(cargoToml.workspace.package.version)) {
      return {
        currentVersionSource: path,
        currentVersion: cargoToml.workspace.package.version,
      }
    }

    // Check internal dependencies version
    if (cargoToml.dependencies) {
      const version = detect(cargoToml.dependencies)
      if (version) {
        return {
          currentVersionSource: path,
          currentVersion: version,
        }
      }
    }

    // Check workspace internal dependencies version
    if (cargoToml.workspace?.dependencies) {
      const version = detect(cargoToml.workspace.dependencies)
      if (version) {
        return {
          currentVersionSource: path,
          currentVersion: version,
        }
      }
    }
  }
  return undefined
}

/**
 * Update the Cargo.toml file with the new version.
 */
export async function updateCargoTomlFile(relPath: string, operation: Operation): Promise<boolean> {
  const { cwd } = operation.options
  const { newVersion } = operation.state
  let modified = false

  const cargoToml = await readCargoToml(resolve(cwd, relPath))

  const update = (dependencies: Record<string, CargoTomlDep>) => {
    for (const [_, value] of Object.entries(dependencies)) {
      if (typeof value === 'string')
        continue
      if (value.path && value.version && value.version !== newVersion && isValidVersion(value.version)) {
        value.version = newVersion
        modified = true
      }
    }
  }

  // Update package version
  if (cargoToml.package?.version && cargoToml.package.version !== newVersion) {
    cargoToml.package.version = newVersion
    modified = true
  }

  // Update workspace package version
  if (cargoToml.workspace?.package?.version && cargoToml.workspace.package.version !== newVersion) {
    cargoToml.workspace.package.version = newVersion
    modified = true
  }

  // Update internal dependencies version
  if (cargoToml.dependencies)
    update(cargoToml.dependencies)

  // Update workspace internal dependencies version
  if (cargoToml.workspace?.dependencies)
    update(cargoToml.workspace.dependencies)

  if (modified)
    await writeCargoToml(resolve(cwd, relPath), cargoToml)

  return modified
}
