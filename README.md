# bumpp

[![NPM version](https://img.shields.io/npm/v/bumpp?color=a1b858&label=)](https://www.npmjs.com/package/bumpp)

Forked from [`version-bump-prompt`](https://github.com/JS-DevTools/version-bump-prompt)

###### Changes in this fork

- Renamed to `bumpp` - so you can use `npx bumpp` directly.
- Use the current version's `preid` when available.
- Confirmation before bumping.
- Enable `--commit` `--tag` `--push` by default. (opt-out by `--no-push`, etc.)
- `-r` or `--recursive` to bump all packages in the monorepo.
- `--npm-tag` to update the npm publish tag (e.g. `latest`, `next`, `beta`) in `package.json`.
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
