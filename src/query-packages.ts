import fs from 'node:fs'
import path from 'node:path'

/**
 * Recursively search for directories that contain a package.json file.
 * 
 * @param workspaces Array of workspace paths
 * @returns Array of paths that contain a package.json file
 */
export async function queryPackages(workspaces: string[]): Promise<string[]> {
  const packagePaths: string[] = []

  async function findPackageJson(dir: string) {
    try {
      const files = await fs.promises.readdir(dir, { withFileTypes: true })
      for (const file of files) {
        const filePath = path.join(dir, file.name)
        if (file.isDirectory()) {
          // Recurse into the directory
          await findPackageJson(filePath)
        } else if (file.isFile() && file.name === 'package.json') {
          packagePaths.push(dir)
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err)
    }
  }

  // Iterate over each workspace path and search for package.json
  for (const workspace of workspaces) {
    const absolutePath = path.resolve(workspace)
    await findPackageJson(absolutePath)
  }

  return packagePaths
}
