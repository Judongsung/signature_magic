import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const BROWSER_EXPORT_RESOLVE_CONDITIONS = ['browser']

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [svelte()],
  resolve: {
    conditions: BROWSER_EXPORT_RESOLVE_CONDITIONS,
  },
  ssr: {
    resolve: {
      conditions: BROWSER_EXPORT_RESOLVE_CONDITIONS,
    },
  },
  build: {
    sourcemap: true,
  },
})
