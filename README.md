# bumpp

[![NPM version](https://img.shields.io/npm/v/bumpp?color=a1b858&label=)](https://www.npmjs.com/package/bumpp)

Forked from [`version-bump-prompt`](https://github.com/JS-DevTools/version-bump-prompt)

<!-- eslint-disable-next-line markdown/heading-increment -->
###### Changes in this fork

- Renamed to `bumpp` - so you can use `npx bumpp` directly.
- Use the current version's `preid` when available.
- Confirmation before bumping.
- Enable `--commit` `--tag` `--push` by default. (opt-out by `--no-push`, etc.)
- `-r` or `--recursive` to bump all packages in the monorepo.
- `--execute` to execute the command, or execute a function before committing.
- Conventional Commits by default.
- Ships ESM and CJS bundles.
- Supports config file `bump.config.ts`:

```ts
// bump.config.ts
import { defineConfig } from 'bumpp'

export default defineConfig({
  // ...options
})
```

## Template tokens

The commit message, tag name, and pull request branch/title/body all support
named tokens. This is the recommended template style:

| Token           | Description                                        | Example      |
| --------------- | -------------------------------------------------- | ------------ |
| `{version}`     | The new version number                             | `1.2.3`      |
| `{oldVersion}`  | The previous version number                        | `1.2.2`      |
| `{tag}`         | The formatted tag name                             | `v1.2.3`     |
| `{releaseType}` | The release type (empty for explicit versions)     | `patch`      |
| `{major}`       | The major segment of the new version               | `1`          |
| `{minor}`       | The minor segment of the new version               | `2`          |
| `{patch}`       | The patch segment of the new version               | `3`          |
| `{date}`        | The current date (`YYYY-MM-DD`, local time)        | `2026-07-28` |

```sh
bumpp --commit "chore: release {tag}" --tag "{version}"
```

> The legacy `%s` placeholder (replaced with the new version) still works but is
> soft-deprecated in favour of `{version}`. If a template contains any named
> token, `%s` substitution is disabled for that template.

## Releasing via a Pull Request

Pushing version-bump commits and tags straight to `main` is convenient for solo
projects, but on a team it bypasses branch protection and code review. The
`--pr` flag lets you drive releases through a pull request instead: a maintainer
approves and merges it, and CI tags the merge commit and publishes.

```sh
bumpp --pr
```

With `--pr`, bumpp:

1. Checks the working tree is clean, that you are on the base branch (the remote
   default branch, detected via `origin/HEAD`), and that it is not behind its
   remote.
2. Creates a release branch (`release/v{version}` by default).
3. Bumps the version in your files and runs the `execute` script, if any.
4. Commits the bump — **no tag is created locally**; the tag is created by CI
   after the pull request is merged.
5. Pushes the branch, then switches you back to your original branch.
6. Offers to open a pull request via the local [`gh`](https://cli.github.com)
   CLI (auto-created with `--yes`). If `gh` is unavailable, it prints a link to
   open the pull request manually.

The `release/` branch prefix is the marker CI uses to recognise a release pull
request, so keep it unless you also update your workflow.

### Configuration

`--pr` toggles the feature on the CLI. For finer control, use the object form in
`bump.config.ts`:

```ts
// bump.config.ts
import { defineConfig } from 'bumpp'

export default defineConfig({
  pr: {
    branch: 'release/v{version}', // release branch name template
    base: 'main', // PR base branch (defaults to origin/HEAD)
    title: 'chore: release {tag}', // defaults to the release commit message
    body: '{oldVersion} → {version}', // template string, or a function receiving the tokens
    draft: false, // open the PR as a draft
  },
})
```

`pr` requires `push` to be enabled, and implies that no tag is created locally.

### GitHub Actions setup

Because a tag pushed with the default `GITHUB_TOKEN` will **not** trigger another
workflow (GitHub's recursion guard), the release runs in a single workflow that
reacts to the release pull request being merged, creates the tag, and publishes:

```yaml
# .github/workflows/release-pr.yml
name: Release (PR merged)

on:
  pull_request:
    types: [closed]

# Only run for merged release/* pull requests
jobs:
  release:
    if: >-
      github.event.pull_request.merged == true &&
      startsWith(github.event.pull_request.head.ref, 'release/')
    runs-on: ubuntu-latest
    permissions:
      contents: write # create the tag, release, and read the repo
      id-token: write # npm OIDC trusted publishing
    steps:
      - uses: actions/checkout@v5
        with:
          # Check out the merge commit so package.json has the bumped version
          ref: ${{ github.event.pull_request.merge_commit_sha }}
          fetch-depth: 0

      - uses: actions/setup-node@v5
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org

      - name: Read version
        id: version
        run: echo "version=$(node -p "require('./package.json').version")" >> "$GITHUB_OUTPUT"

      - name: Create tag
        uses: actions/github-script@v8
        with:
          script: |
            await github.rest.git.createRef({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: `refs/tags/v${{ steps.version.outputs.version }}`,
              sha: context.payload.pull_request.merge_commit_sha,
            })

      - run: npm ci
      - run: npm run build --if-present

      # Generate the GitHub Release notes from conventional commits
      - run: npx changelogithub
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # Publish with npm OIDC trusted publishing (no NPM_TOKEN needed).
      # Requires npm CLI >= 11.5.1 and a configured trusted publisher on npmjs.com.
      - run: npm publish
```

Then protect `main` (Settings → Branches): require a pull request and at least
one approval before merging. Now the only way to cut a release is `bumpp --pr` →
review → merge, and CI does the rest.

> If you already have a workflow triggered by `v*` tags, you can instead push the
> tag from a merge-triggered job using a Personal Access Token or a GitHub App
> token (not `GITHUB_TOKEN`) so the tag push triggers your existing pipeline.
