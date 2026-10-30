import type { Operation } from './operation'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  getOriginRemoteUrl,
  getRepositoryFieldValue,
  parseRepoSlug,
  reposMatch,
} from './git'

export interface CheckPushRemoteOptions {
  /** When false, the check is skipped. */
  push: boolean
  cwd: string
  /** Injectable for tests. Defaults to reading `origin`. */
  getRemoteUrl?: () => Promise<string | undefined>
  /** Injectable for tests. Defaults to reading `cwd/package.json`. */
  readPackageJson?: () => Promise<unknown>
}

/**
 * Ensures the `origin` remote matches `package.json` `repository` before a
 * push, so tags/releases are not accidentally pushed to a fork.
 *
 * Skips when push is disabled, `repository` is missing, or either side cannot
 * be parsed. Throws a clear error on mismatch (use `--no-push` or fix `origin`).
 */
export async function checkPushRemoteMatchesPackage(
  options: CheckPushRemoteOptions,
): Promise<void> {
  if (!options.push)
    return

  const readPackageJson = options.readPackageJson ?? (async () => {
    const pkgPath = path.join(options.cwd, 'package.json')
    try {
      const raw = await fs.readFile(pkgPath, 'utf8')
      return JSON.parse(raw) as unknown
    }
    catch {
      return undefined
    }
  })

  const pkg = await readPackageJson()
  const repoField = pkg
    && typeof pkg === 'object'
    && 'repository' in pkg
    ? getRepositoryFieldValue((pkg as { repository: unknown }).repository)
    : undefined

  // Intentionally omit `repository` → skip (do not break those workflows).
  if (!repoField)
    return

  const expected = parseRepoSlug(repoField)
  if (!expected)
    return

  const getRemoteUrl = options.getRemoteUrl ?? getOriginRemoteUrl
  const remoteUrl = await getRemoteUrl()
  if (!remoteUrl)
    return

  const actual = parseRepoSlug(remoteUrl)
  if (!actual)
    return

  if (reposMatch(actual, expected))
    return

  throw new Error(
    `Git remote "origin" points to ${actual.owner}/${actual.repo}, `
    + `but package.json repository is ${expected.owner}/${expected.repo}. `
    + `Tags/releases would be pushed to the wrong repository. `
    + `Fix with \`git remote set-url origin\` to the canonical repo, `
    + `or pass \`--no-push\` to skip pushing.`,
  )
}

/**
 * Convenience wrapper used by the bump flow.
 */
export async function checkPushRemoteForOperation(operation: Operation): Promise<void> {
  await checkPushRemoteMatchesPackage({
    push: operation.options.push,
    cwd: operation.options.cwd,
  })
}
