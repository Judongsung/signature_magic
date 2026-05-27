<script lang="ts">
    import { SvelteFlowProvider } from '@xyflow/svelte';
    import MagicNodeEditor from './components/MagicNodeEditor.svelte';
    import MagicCircleGenerator from './components/MagicCircleGenerator.svelte';
</script>

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
