import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // NASA research uses its own offline harness and is executed separately via
    // `node src/integrations/nasa/__tests__/run.ts`.
    exclude: [
      ...configDefaults.exclude,
      'src/integrations/nasa/__tests__/*.test.ts',
    ],
  },
})
