<script lang="ts">
    import { SvelteFlowProvider } from '@xyflow/svelte';
    import DevPhaseNavigation from '../dev/DevPhaseNavigation.svelte';
    import MagicCircleGenerator from './MagicCircleGenerator.svelte';
    import MagicNodeEditor from './MagicNodeEditor.svelte';
</script>

<main class="node-composition-screen">
    <DevPhaseNavigation />

    <div class="app-container">
        <div class="editor-pane">
            <SvelteFlowProvider>
                <MagicNodeEditor />
            </SvelteFlowProvider>
        </div>
        <div class="preview-pane">
            <MagicCircleGenerator />
        </div>
    </div>
</main>

<style>
    .node-composition-screen {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
        background-color: #000;
    }

    .node-composition-screen :global(.dev-phase-navigation) {
        width: 100%;
        max-width: none;
        padding: 8px 12px;
        background: #050508;
        border-bottom: 1px solid #222;
    }
    
    .app-container {
        display: flex;
        width: 100%;
        flex: 1;
        min-height: 0;
        overflow: hidden;
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
