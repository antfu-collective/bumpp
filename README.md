# bumpp

[![NPM version](https://img.shields.io/npm/v/bumpp?color=a1b858&label=)](https://www.npmjs.com/package/bumpp)

Forked from [`version-bump-prompt`](https://github.com/JS-DevTools/version-bump-prompt)

###### Changes in this fork

- Renamed to `bumpp` - so you can use `npx bumpp` directly.
- Ships ESM and CJS bundles.
- Add a new argument `--execute` to execute the command before committing.
- Use the current version's `preid` when available.
- Confirmation before bumping.
- Enable `--commit` `--tag` `--push` by default. (opt-out by `--no-push`, etc.)
- `-r` or `--recursive` to bump all packages in the monorepo.
- Conventional Commits by default.
- Supports config file `bump.config.ts`:

```ts
// bump.config.ts
import { defineConfig } from 'bumpp'

export default defineConfig({
  // ...options
})
```
