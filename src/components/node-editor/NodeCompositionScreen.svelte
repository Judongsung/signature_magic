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
        padding-bottom: 68px;
        overflow: hidden;
        background: var(--node-editor-screen-bg);
        box-sizing: border-box;
    }

    .node-composition-screen :global(.dev-phase-navigation) {
        width: 100%;
        max-width: none;
        padding: 8px 12px;
        background: var(--node-editor-panel-bg);
        border-bottom: 1px solid var(--node-editor-border);
        box-shadow: var(--node-editor-toolbar-shadow);
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
        border-right: 1px solid var(--node-editor-divider);
        box-shadow: var(--node-editor-panel-shadow);
        z-index: 2;
    }

    .preview-pane {
        flex: 1;
        min-width: 50%;
        background: var(--node-editor-panel-bg);
        min-height: 0;
    }

    @media (max-width: 900px) {
        .app-container {
            flex-direction: column;
        }

        .editor-pane,
        .preview-pane {
            min-width: 100%;
            min-height: 50%;
        }

        .editor-pane {
            border-right: 0;
            border-bottom: 1px solid var(--node-editor-divider);
            box-shadow: 0 1px 0 var(--node-editor-divider-glow);
        }
    }
</style>
