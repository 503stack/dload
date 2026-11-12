import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  entry: ['src/**/*.ts'],
  format: ['esm', 'cjs'],
  splitting: true,
  dts: false,
  treeshake: true,
  minify: true,
  clean: true,
  ...options,
}))
