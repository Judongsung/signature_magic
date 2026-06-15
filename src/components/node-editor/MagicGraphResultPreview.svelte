<script lang="ts">
    import { tick } from 'svelte';
    import { domToPng } from 'modern-screenshot';
    import {
        ConnectionMode,
        SvelteFlow,
        type Edge,
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';

    import {
        MAGIC_GRAPH_RESULT_CAPTURE_CONFIG,
        GRAPH_EDGE_TYPES,
        GRAPH_NODE_TYPES,
    } from '../../constants/graphConfigs';
    import { CYOA_REGISTRATION_RESULT_TEXT } from '../../constants/uiText';
    import {
        buildMagicGraphResultPreview,
    } from '../../systems/graph/presentation/magicGraphResultPreview';
    import type { MagicNode } from '../../types/magic';
    import CustomEdge from './CustomEdge.svelte';
    import CustomNode from './CustomNode.svelte';

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
    const previewHeight = $derived(
        Math.max(
            MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.MIN_HEIGHT_PX,
            Math.round(MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.WIDTH_PX / preview.aspectRatio)
        )
    );
    let capturedDataUrl = $state<string | undefined>();
    let captureFailed = $state(false);
    let captureGeneration = 0;
    const captureKey = $derived(createCaptureKey());

    async function waitForCaptureLayout(): Promise<void> {
        await tick();
        await document.fonts?.ready;
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

        if (MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.CAPTURE_FRAME_DELAY_MS <= 0) return;

        await new Promise<void>(resolve => {
            window.setTimeout(resolve, MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.CAPTURE_FRAME_DELAY_MS);
        });
    }

    async function capturePreviewImage(element: HTMLDivElement, generation: number): Promise<void> {
        if (preview.nodes.length === 0) return;

        await waitForCaptureLayout();
        if (generation !== captureGeneration) return;

        try {
            const dataUrl = await domToPng(element, {
                width: MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.WIDTH_PX,
                height: previewHeight,
                scale: MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.PIXEL_RATIO,
                backgroundColor: MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.BACKGROUND_COLOR,
            });

            if (generation !== captureGeneration) return;

            capturedDataUrl = dataUrl;
            captureFailed = false;
        } catch {
            if (generation !== captureGeneration) return;

            capturedDataUrl = undefined;
            captureFailed = true;
        }
    }

    function startCapture(element: HTMLDivElement): void {
        const generation = ++captureGeneration;
        capturedDataUrl = undefined;
        captureFailed = false;
        void capturePreviewImage(element, generation);
    }

    function captureGraphPreview(element: HTMLDivElement) {
        startCapture(element);

        return {
            update() {
                startCapture(element);
            },
            destroy() {
                captureGeneration++;
            },
        };
    }

    function createCaptureKey(): string {
        const nodeKey = preview.nodes
            .map(node => `${node.id}:${node.position.x}:${node.position.y}:${node.data.magicType}`)
            .join('|');
        const edgeKey = preview.edges
            .map(edge => `${edge.id}:${edge.source}:${edge.target}:${edge.sourceHandle ?? ''}:${edge.targetHandle ?? ''}`)
            .join('|');

        return `${nodeKey}::${edgeKey}::${previewHeight}`;
    }
</script>

<div
    class="graph-result-preview"
    aria-label={CYOA_REGISTRATION_RESULT_TEXT.GRAPH_ARIA_LABEL}
    style:--graph-result-aspect-ratio={`${preview.aspectRatio}`}
>
    {#if preview.nodes.length === 0}
        <p class="graph-empty">{CYOA_REGISTRATION_RESULT_TEXT.EMPTY_GRAPH}</p>
    {:else if capturedDataUrl}
        <img
            class="graph-result-image"
            src={capturedDataUrl}
            alt={CYOA_REGISTRATION_RESULT_TEXT.GRAPH_ARIA_LABEL}
            aria-label={CYOA_REGISTRATION_RESULT_TEXT.GRAPH_ARIA_LABEL}
        />
    {:else if captureFailed}
        <p class="graph-empty">{CYOA_REGISTRATION_RESULT_TEXT.GRAPH_CAPTURE_FAILED}</p>
    {:else}
        <p class="graph-empty">{CYOA_REGISTRATION_RESULT_TEXT.GRAPH_CAPTURE_LOADING}</p>
    {/if}

    {#if preview.nodes.length > 0}
        <div
            use:captureGraphPreview={captureKey}
            class="graph-capture-stage"
            aria-hidden="true"
            style:width={`${MAGIC_GRAPH_RESULT_CAPTURE_CONFIG.WIDTH_PX}px`}
            style:height={`${previewHeight}px`}
        >
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
        />
        </div>
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
    }

    .graph-result-preview :global(.svelte-flow) {
        z-index: 1;
        background: var(--node-editor-canvas-bg);
    }

    .graph-result-preview :global(.svelte-flow__pane),
    .graph-result-preview :global(.svelte-flow__node),
    .graph-result-preview :global(.svelte-flow__edge) {
        cursor: default;
    }

    .graph-result-image {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: contain;
        pointer-events: none;
        user-select: none;
    }

    .graph-capture-stage {
        position: fixed;
        left: -10000px;
        top: 0;
        overflow: hidden;
        pointer-events: none;
        background: var(--node-editor-canvas-base-bg);
    }

    .graph-capture-stage::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
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
