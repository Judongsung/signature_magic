import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const BUILD_CYOA_DATA_ALIASES = {
  cyoaRows: './src/data/buildPlaceholders/cyoaRows.json',
  cyoaDialogueScripts: './src/data/buildPlaceholders/cyoaDialogueScripts.json',
  cyoaImageRegistry: './src/systems/cyoa/buildPlaceholders/cyoaImageRegistry.ts',
  cyoaIntroScreen: './src/components/cyoa/buildPlaceholders/CyoaIntroScreen.svelte',
} as const

const ENABLE_NODE_COMPOSITION_ONLY_BUILD = false

function buildCyoaDataExclusionPlugin(enabled: boolean) {
  const cyoaRowsPlaceholder = fileURLToPath(new URL(BUILD_CYOA_DATA_ALIASES.cyoaRows, import.meta.url))
  const cyoaDialogueScriptsPlaceholder = fileURLToPath(new URL(BUILD_CYOA_DATA_ALIASES.cyoaDialogueScripts, import.meta.url))
  const cyoaImageRegistryPlaceholder = fileURLToPath(new URL(BUILD_CYOA_DATA_ALIASES.cyoaImageRegistry, import.meta.url))
  const cyoaIntroScreenPlaceholder = fileURLToPath(new URL(BUILD_CYOA_DATA_ALIASES.cyoaIntroScreen, import.meta.url))

  return {
    name: 'build-cyoa-data-exclusion',
    enforce: 'pre' as const,
    resolveId(source: string) {
      if (!enabled) return null
      if (source.replaceAll('\\', '/').endsWith('/data/cyoaRows.json')) {
        return cyoaRowsPlaceholder
      }
      if (source.replaceAll('\\', '/').endsWith('/data/cyoaDialogueScripts.json')) {
        return cyoaDialogueScriptsPlaceholder
      }
      if (source.replaceAll('\\', '/').endsWith('/systems/cyoa/cyoaImageRegistry')) {
        return cyoaImageRegistryPlaceholder
      }
      if (source.replaceAll('\\', '/').endsWith('/components/cyoa/CyoaIntroScreen.svelte')) {
        return cyoaIntroScreenPlaceholder
      }
      return null
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const excludeCyoaData = ENABLE_NODE_COMPOSITION_ONLY_BUILD && command === 'build'

  return {
    base: './',
    plugins: [buildCyoaDataExclusionPlugin(excludeCyoaData), svelte()],
    define: {
      __NODE_COMPOSITION_ONLY_BUILD__: JSON.stringify(excludeCyoaData),
    },
    build: {
      sourcemap: true,
    },
  }
})
