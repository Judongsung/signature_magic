<script lang="ts">
    import {
        ConnectionMode,
        SvelteFlow,
        ViewportPortal,
        type Edge,
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';

    import {
        GRAPH_EDGE_TYPES,
        GRAPH_NODE_TYPES,
    } from '../../../constants/graphConfigs';
    import { CYOA_REGISTRATION_RESULT_TEXT } from '../../../constants/uiText';
    import {
        buildMagicGraphResultPreview,
    } from '../../../systems/graph/presentation/magicGraphResultPreview';
    import { BUILD_RESULT_EXPORT_ROLES } from '../../../systems/export/buildResultExportContract';
    import type { MagicNode } from '../../../types/magic';
    import MagicGraphCanvasBackground from '../MagicGraphCanvasBackground.svelte';
    import CustomEdge from '../editor/CustomEdge.svelte';
    import CustomNode from '../editor/CustomNode.svelte';

    let {
        nodes,
        edges,
    }: {
        nodes: MagicNode[];
        edges: Edge[];
    } = $props();

    const nodeTypes = { [GRAPH_NODE_TYPES.MAGIC_NODE]: CustomNode };
    const edgeTypes = { [GRAPH_EDGE_TYPES.MAGIC_EDGE]: CustomEdge };
    const proOptions = { hideAttribution: true };
    const preview = $derived(buildMagicGraphResultPreview(nodes, edges));
</script>

<div
    class="graph-result-preview"
    data-build-export-role={BUILD_RESULT_EXPORT_ROLES.GRAPH_PREVIEW}
    aria-label={CYOA_REGISTRATION_RESULT_TEXT.GRAPH_ARIA_LABEL}
    style:--graph-result-aspect-ratio={`${preview.aspectRatio}`}
>
    {#if preview.nodes.length === 0}
        <p class="graph-empty">{CYOA_REGISTRATION_RESULT_TEXT.EMPTY_GRAPH}</p>
    {:else}
        <SvelteFlow
            id="registration-result-graph-preview"
            nodes={preview.nodes}
            edges={preview.edges}
            {nodeTypes}
            {edgeTypes}
            colorMode="dark"
            connectionMode={ConnectionMode.Strict}
            fitView
            fitViewOptions={preview.fitViewOptions}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            preventScrolling={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            panOnScroll={false}
            panOnDrag={false}
            selectionOnDrag={false}
            deleteKey={null}
            selectionKey={null}
            panActivationKey={null}
            zoomActivationKey={null}
            multiSelectionKey={null}
            {proOptions}
        >
            <ViewportPortal target="back">
                <MagicGraphCanvasBackground />
            </ViewportPortal>
        </SvelteFlow>
    {/if}
</div>

<style>
    .graph-result-preview {
        width: 100%;
        min-height: 260px;
        aspect-ratio: var(--graph-result-aspect-ratio);
        position: relative;
        overflow: hidden;
        border: 1px solid var(--node-editor-border);
        border-radius: var(--node-editor-radius-md);
        background: var(--node-editor-canvas-base-bg);
        box-shadow: var(--node-editor-panel-shadow);
        isolation: isolate;
        --node-editor-node-body-gap: 2px;
        --node-editor-node-icon-size: 18px;
        --node-editor-node-label-size: 13px;
        --node-editor-node-caption-size: 9.5px;
        --node-editor-node-caption-line-height: 1.1;
        --node-editor-handle-size: 9px;
    }

    .graph-result-preview :global(.svelte-flow) {
        z-index: 1;
        background: transparent;
    }

    .graph-result-preview :global(.svelte-flow__viewport) {
        overflow: visible;
    }

    .graph-result-preview :global(.svelte-flow__pane),
    .graph-result-preview :global(.svelte-flow__node),
    .graph-result-preview :global(.svelte-flow__edge) {
        cursor: default;
    }

    .graph-result-preview::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
        background: var(--node-editor-canvas-vignette);
    }

    .graph-empty {
        height: 100%;
        min-height: inherit;
        margin: 0;
        display: grid;
        place-items: center;
        color: var(--node-editor-muted-strong);
        font-size: 13px;
        line-height: 1.45;
        text-align: center;
    }

    @media (max-width: 720px) {
        .graph-result-preview {
            min-height: 220px;
            aspect-ratio: 1.2;
        }
    }
</style>
