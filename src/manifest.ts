/**
 * The npm package manifest (package.json)
 */
export interface Manifest {
  name: string
  version: string
  description: string
  [key: string]: unknown
}

/**
 * The npm package lock manifest (package-lock.json)
 */
export interface PackageLockManifest extends Manifest {
  packages: {
    '': {
      version: string
    }
  }
}

/**
 * Determines whether the specified value is a package manifest.
 */
export function isManifest(obj: any): obj is Manifest {
  return obj
    && typeof obj === 'object'
    && isOptionalString(obj.name)
    && isOptionalString(obj.version)
    && isOptionalString(obj.description)
}

/**
 * Determines whether the specified manifest is package-lock.json
 */
export function isPackageLockManifest(
  manifest: Manifest,
): manifest is PackageLockManifest {
  return (typeof (manifest as PackageLockManifest).packages?.['']?.version === 'string')
}

/**
 * Determines whether the specified value is a string, null, or undefined.
 */
function isOptionalString(value: any): value is string | undefined {
  const type = typeof value
  return value === null
    || type === 'undefined'
    || type === 'string'
}
