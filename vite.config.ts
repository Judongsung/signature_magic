import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const BUILD_CYOA_DATA_ALIASES = {
  cyoaRows: './src/data/buildPlaceholders/cyoaRows.json',
  cyoaDialogueScripts: './src/data/buildPlaceholders/cyoaDialogueScripts.json',
  cyoaImageRegistry: './src/systems/cyoa/buildPlaceholders/cyoaImageRegistry.ts',
  cyoaIntroScreen: './src/components/cyoa/buildPlaceholders/CyoaIntroScreen.svelte',
} as const

const NODE_COMPOSITION_ONLY_BUILD_ENV = 'NODE_COMPOSITION_ONLY'
const ENABLED_ENV_VALUES = new Set(['1', 'true', 'yes'])

function isNodeCompositionOnlyBuild(command: string, env: NodeJS.ProcessEnv): boolean {
  // NODE_COMPOSITION_ONLY=1 빌드는 CYOA 데이터와 화면을 placeholder로 바꿔 노드 조합 흐름만 번들링한다.
  return command === 'build' && ENABLED_ENV_VALUES.has(env[NODE_COMPOSITION_ONLY_BUILD_ENV]?.toLowerCase() ?? '')
}

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
  const excludeCyoaData = isNodeCompositionOnlyBuild(command, process.env)

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
