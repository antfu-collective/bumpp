import { defineConfig } from 'tsup'

export default defineConfig({
  banner: ({ format }) => {
    if (format === 'esm') {
      return {
        js: 'import {createRequire as __createRequire} from \'module\';var require=__createRequire(import.meta.url);',
      }
    }
  },
})
