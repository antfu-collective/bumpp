import type { Operation } from './operation'

/**
 * The set of named tokens that can be used in template strings such as the
 * commit message, tag name, and pull request branch/title/body.
 *
 * @example
 * ```
 * "chore: release {tag}" -> "chore: release v1.2.3"
 * "release/v{version}"   -> "release/v1.2.3"
 * ```
 */
export interface TemplateTokens {
  /** The new version number, e.g. `1.2.3` */
  version: string
  /** The previous version number, e.g. `1.2.2` */
  oldVersion: string
  /** The formatted tag name, e.g. `v1.2.3` */
  tag: string
  /** The release type, e.g. `major`, `minor`, `patch`, `prerelease` (empty for explicit versions) */
  releaseType: string
  /** The major segment of the new version, e.g. `1` */
  major: string
  /** The minor segment of the new version, e.g. `2` */
  minor: string
  /** The patch segment of the new version, e.g. `3` */
  patch: string
  /** The current date in `YYYY-MM-DD` (local time) */
  date: string
}

/**
 * All recognized named tokens. Order does not matter.
 */
const KNOWN_TOKENS: (keyof TemplateTokens)[] = [
  'version',
  'oldVersion',
  'tag',
  'releaseType',
  'major',
  'minor',
  'patch',
  'date',
]

const TOKEN_ALTERNATION = KNOWN_TOKENS.join('|')
const TOKEN_DETECT_SOURCE = `\\{(?:${TOKEN_ALTERNATION})\\}`
const TOKEN_CAPTURE_SOURCE = `\\{(${TOKEN_ALTERNATION})\\}`

/**
 * Determines whether the template uses any of the named `{token}` placeholders.
 */
export function hasNamedTokens(template: string): boolean {
  return new RegExp(TOKEN_DETECT_SOURCE).test(template)
}

/**
 * Renders a template string using the given tokens.
 *
 * Named tokens (e.g. `{version}`, `{tag}`) are the recommended template style.
 * If a template contains any known named token, only token substitution is
 * performed.
 *
 * For backwards compatibility, templates that contain no named tokens keep the
 * legacy `%s` behavior: any `%s` placeholders are replaced with the new version
 * number, and if there are none, the new version number is appended to the
 * string. The legacy `%s` style is soft-deprecated in favor of `{version}`.
 */
export function renderTemplate(template: string, tokens: TemplateTokens): string {
  if (hasNamedTokens(template)) {
    return template.replace(
      new RegExp(TOKEN_CAPTURE_SOURCE, 'g'),
      (_, key: keyof TemplateTokens) => tokens[key] ?? '',
    )
  }

  // Legacy `%s` behavior (soft-deprecated, kept for backwards compatibility)
  if (template.includes('%s'))
    return template.replaceAll('%s', tokens.version)

  return template + tokens.version
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Builds the template tokens for an operation from its resolved state.
 * Must be called after the new version number has been resolved.
 */
export function buildTokens(operation: Operation): TemplateTokens {
  const { currentVersion, newVersion, release } = operation.state

  const [core = ''] = newVersion.split('-')
  const [major = '', minor = '', patch = ''] = core.split('.')

  const now = new Date()
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  const base: TemplateTokens = {
    version: newVersion,
    oldVersion: currentVersion,
    tag: '',
    releaseType: release ?? '',
    major,
    minor,
    patch,
    date,
  }

  // Resolve the tag name so it can be referenced via the `{tag}` token in other
  // templates (commit message, PR title/body, branch name).
  const tagName = operation.options.tag
    ? renderTemplate(operation.options.tag.name, base)
    : `v${newVersion}`

  return { ...base, tag: tagName }
}
