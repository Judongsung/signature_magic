<script lang="ts">
    import { SvelteFlowProvider } from '@xyflow/svelte';
    import { APP_PHASES } from './constants/gameConfigs';
    import { appStore } from './stores/appStore.svelte';
    import CyoaIntroScreen from './components/cyoa/CyoaIntroScreen.svelte';
    import MagicNodeEditor from './components/node-editor/MagicNodeEditor.svelte';
    import MagicCircleGenerator from './components/node-editor/MagicCircleGenerator.svelte';
</script>

{#if appStore.phase === APP_PHASES.CYOA}
    <CyoaIntroScreen />
{:else if appStore.phase === APP_PHASES.NODE_COMPOSITION}
    <main class="app-container">
        <div class="editor-pane">
            <SvelteFlowProvider>
                <MagicNodeEditor />
            </SvelteFlowProvider>
        </div>
        <div class="preview-pane">
            <MagicCircleGenerator />
        </div>
    </main>
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #000;
        color: #fff;
        overflow: hidden;
    }
    
    .app-container {
        display: flex;
        width: 100vw;
        height: 100vh;
    }

    .editor-pane {
        flex: 1;
        min-width: 50%;
        border-right: 2px solid #222;
        box-shadow: 5px 0 15px rgba(0,0,0,0.5);
        z-index: 2;
    }

    .preview-pane {
        flex: 1;
        min-width: 50%;
        background-color: #050508;
    }
</style>
