<script lang="ts">
    import {
        SvelteFlow,
        Controls,
        ViewportPortal,
        ConnectionMode,
        SelectionMode,
        useSvelteFlow,
        type Connection,
        type Edge,
        type OnDelete,
        type CoordinateExtent,
        type SnapGrid,
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';

    import { graphStore } from '../../stores/graphStore.svelte';
    import {
        DEFAULT_ACTIVE_MAGIC_NODE_CATEGORIES,
        EDITOR_CANVAS,
        type MagicNodeCategory,
    } from '../../constants/gameConfigs';
    import { GRAPH_EDGE_TYPES, GRAPH_NODE_TYPES } from '../../constants/graphConfigs';
    import { NODE_EDITOR_TEXT } from '../../constants/uiText';
    import {
        getExtentCenter,
        resolveCenteredDropPosition,
        resolveCenteredViewport,
        resolveDropPosition,
    } from '../../systems/graph/editor/editorCanvas';
    import { getMagicTypesByCategory } from '../../systems/graph/registry/magicTypeRegistry';
    import CustomNode from './CustomNode.svelte';
    import CustomEdge from './CustomEdge.svelte';
    import MagicNodeToolbar from './MagicNodeToolbar.svelte';
    import type { MagicNode, MagicType } from '../../types/magic';

    const STAR_FIELD_CONFIG = {
        COUNT: 700,
        SEED: 731,
        MIN_POSITION_PERCENT: 2,
        MAX_POSITION_PERCENT: 98,
        MIN_RADIUS_PX: 0.38,
        MAX_RADIUS_PX: 1.05,
        MIN_ALPHA: 0.2,
        MAX_ALPHA: 0.58,
        MIN_GLOW_PX: 3.2,
        MAX_GLOW_PX: 7.2,
        COLORS: [
            '233, 199, 111',
            '205, 234, 255',
            '110, 214, 209',
            '185, 150, 255',
        ],
    } as const;

    const nodeTypes = { [GRAPH_NODE_TYPES.MAGIC_NODE]: CustomNode };
    const edgeTypes = { [GRAPH_EDGE_TYPES.MAGIC_EDGE]: CustomEdge };
    const snapGrid = EDITOR_CANVAS.SNAP_GRID as SnapGrid;
    const canvasExtent = EDITOR_CANVAS.EXTENT as CoordinateExtent;
    const canvasLayerLeft = `${EDITOR_CANVAS.EXTENT[0][0]}px`;
    const canvasLayerTop = `${EDITOR_CANVAS.EXTENT[0][1]}px`;
    const canvasLayerWidth = `${EDITOR_CANVAS.EXTENT[1][0] - EDITOR_CANVAS.EXTENT[0][0]}px`;
    const canvasLayerHeight = `${EDITOR_CANVAS.EXTENT[1][1] - EDITOR_CANVAS.EXTENT[0][1]}px`;
    const panOnDragButtons = [...EDITOR_CANVAS.PAN_ON_DRAG_BUTTONS];
    const canvasStars = createStarField(STAR_FIELD_CONFIG, EDITOR_CANVAS.EXTENT);
    const canvasCenter = getExtentCenter(EDITOR_CANVAS.EXTENT);
    const { screenToFlowPosition, setViewport } = useSvelteFlow();

    let activeCategoryIds = $state<MagicNodeCategory[]>([...DEFAULT_ACTIVE_MAGIC_NODE_CATEGORIES]);
    let flowWrapperElement: HTMLDivElement | undefined;
    const visibleMagicTypes = $derived(
        getMagicTypesByCategory(activeCategoryIds),
    );

    function toggleCategory(categoryId: MagicNodeCategory) {
        activeCategoryIds = activeCategoryIds.includes(categoryId)
            ? activeCategoryIds.filter((id) => id !== categoryId)
            : [...activeCategoryIds, categoryId];
    }

    function onDragStart(event: DragEvent, magicType: MagicType) {
        event.dataTransfer?.setData('application/magictype', magicType);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    }

    function addNodeAtCanvasCenter(magicType: MagicType) {
        const bounds = flowWrapperElement?.getBoundingClientRect();
        const screenPosition = bounds
            ? {
                x: bounds.left + bounds.width / 2,
                y: bounds.top + bounds.height / 2,
            }
            : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const flowPosition = screenToFlowPosition(screenPosition);
        const position = resolveCenteredDropPosition(
            flowPosition,
            EDITOR_CANVAS.CLICK_PLACEMENT_NODE_SIZE,
            snapGrid,
            canvasExtent
        );

        graphStore.addNode(magicType, position);
    }

    function centerInitialViewport(attempt = 0) {
        const bounds = flowWrapperElement?.getBoundingClientRect();

        if (
            (!bounds || bounds.width <= 0 || bounds.height <= 0)
            && attempt < EDITOR_CANVAS.INITIAL_VIEWPORT_CENTER_RETRY_LIMIT
        ) {
            requestAnimationFrame(() => centerInitialViewport(attempt + 1));
            return;
        }

        if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;

        const viewport = resolveCenteredViewport(
            canvasCenter,
            { width: bounds.width, height: bounds.height },
            EDITOR_CANVAS.INITIAL_VIEWPORT_ZOOM
        );

        void setViewport(viewport, {
            duration: EDITOR_CANVAS.INITIAL_VIEWPORT_DURATION_MS,
        });
    }

    function onDragOver(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    }

    function onDrop(event: DragEvent) {
        event.preventDefault();
        const magicType = event.dataTransfer?.getData('application/magictype') as MagicType | undefined;
        if (!magicType) return;

        const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const position = resolveDropPosition(flowPosition, snapGrid, canvasExtent);
        graphStore.addNode(magicType, position);
    }

    function preventCanvasContextMenu(event: MouseEvent) {
        event.preventDefault();
    }

    const onDelete: OnDelete<MagicNode, Edge> = ({ nodes, edges }) => {
        graphStore.onDelete(nodes, edges);
    };

    function createSeededRandom(seed: number): () => number {
        let value = seed;

        return () => {
            value = (value * 9301 + 49297) % 233280;

            return value / 233280;
        };
    }

    function rangedValue(randomValue: number, min: number, max: number): number {
        return min + randomValue * (max - min);
    }

    function formatNumber(value: number): string {
        return value.toFixed(2).replace(/\.?0+$/, '');
    }

    function createStarField(config: typeof STAR_FIELD_CONFIG, extent: typeof EDITOR_CANVAS.EXTENT) {
        const random = createSeededRandom(config.SEED);
        const [minPosition, maxPosition] = extent;
        const width = maxPosition[0] - minPosition[0];
        const height = maxPosition[1] - minPosition[1];

        return Array.from({ length: config.COUNT }, (_, index) => {
            const xPercent = rangedValue(random(), config.MIN_POSITION_PERCENT, config.MAX_POSITION_PERCENT);
            const yPercent = rangedValue(random(), config.MIN_POSITION_PERCENT, config.MAX_POSITION_PERCENT);
            const radius = rangedValue(random(), config.MIN_RADIUS_PX, config.MAX_RADIUS_PX);
            const alpha = rangedValue(random(), config.MIN_ALPHA, config.MAX_ALPHA);
            const color = config.COLORS[index % config.COLORS.length];
            const glow = rangedValue(random(), config.MIN_GLOW_PX, config.MAX_GLOW_PX);

            return {
                x: `${formatNumber(width * (xPercent / 100))}px`,
                y: `${formatNumber(height * (yPercent / 100))}px`,
                size: `${formatNumber(radius * 2)}px`,
                color: `rgba(${color}, ${formatNumber(alpha)})`,
                glow: `0 0 ${formatNumber(glow)}px rgba(${color}, ${formatNumber(alpha * 0.8)})`,
            };
        });
    }
</script>

<div class="editor-container">
    <MagicNodeToolbar
        {activeCategoryIds}
        {visibleMagicTypes}
        onToggleCategory={toggleCategory}
        onAddNode={addNodeAtCanvasCenter}
        {onDragStart}
        onClear={() => graphStore.clear()}
    />

    <div
        bind:this={flowWrapperElement}
        class="flow-wrapper"
        ondragover={onDragOver}
        ondrop={onDrop}
        oncontextmenu={preventCanvasContextMenu}
        role="region"
        aria-label={NODE_EDITOR_TEXT.CANVAS_ARIA_LABEL}
        data-tooltip-boundary
        style:--node-editor-canvas-layer-left={canvasLayerLeft}
        style:--node-editor-canvas-layer-top={canvasLayerTop}
        style:--node-editor-canvas-layer-width={canvasLayerWidth}
        style:--node-editor-canvas-layer-height={canvasLayerHeight}
    >
        <SvelteFlow
            bind:nodes={graphStore.nodes}
            bind:edges={graphStore.edges}
            {nodeTypes}
            {edgeTypes}
            colorMode="dark"
            connectionMode={ConnectionMode.Strict}
            {snapGrid}
            translateExtent={canvasExtent}
            nodeExtent={canvasExtent}
            panOnDrag={panOnDragButtons}
            selectionOnDrag={true}
            selectionMode={SelectionMode.Partial}
            isValidConnection={(edge) => graphStore.checkConnection(edge)}
            onbeforeconnect={(conn) => graphStore.prepareEdge(conn)}
            onconnect={(conn: Connection) => graphStore.onEdgeConnected(conn)}
            ondelete={onDelete}
            oninit={centerInitialViewport}
            deleteKey="Delete"
        >
            <ViewportPortal target="back">
                <div class="star-field" aria-hidden="true">
                    {#each canvasStars as star}
                        <span
                            class="star"
                            style:left={star.x}
                            style:top={star.y}
                            style:--star-size={star.size}
                            style:--star-color={star.color}
                            style:--star-glow={star.glow}
                        ></span>
                    {/each}
                </div>
            </ViewportPortal>
            <Controls />
        </SvelteFlow>
    </div>
</div>

<style>
    .editor-container {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        background: var(--node-editor-canvas-base-bg);
    }

    .flow-wrapper {
        flex-grow: 1;
        min-height: 0;
        position: relative;
        overflow: hidden;
        background: var(--node-editor-canvas-base-bg);
        isolation: isolate;
    }

    .flow-wrapper::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .flow-wrapper::after {
        z-index: 2;
        background: var(--node-editor-canvas-vignette);
    }

    .flow-wrapper :global(.svelte-flow) {
        z-index: 1;
        background: transparent;
    }

    .flow-wrapper :global(.svelte-flow__viewport) {
        overflow: visible;
    }

    .flow-wrapper :global(.svelte-flow__viewport::before) {
        content: '';
        position: absolute;
        left: var(--node-editor-canvas-layer-left);
        top: var(--node-editor-canvas-layer-top);
        width: var(--node-editor-canvas-layer-width);
        height: var(--node-editor-canvas-layer-height);
        pointer-events: none;
    }

    .flow-wrapper :global(.svelte-flow__viewport::before) {
        z-index: -2;
        background: var(--node-editor-canvas-bg);
    }

    .star-field {
        position: absolute;
        left: var(--node-editor-canvas-layer-left);
        top: var(--node-editor-canvas-layer-top);
        width: var(--node-editor-canvas-layer-width);
        height: var(--node-editor-canvas-layer-height);
        pointer-events: none;
    }

    .star {
        position: absolute;
        width: var(--star-size);
        height: var(--star-size);
        border-radius: 50%;
        background: var(--star-color);
        box-shadow: var(--star-glow);
        transform: translate(-50%, -50%);
    }

    .flow-wrapper :global(.svelte-flow__controls) {
        overflow: hidden;
        border: 1px solid var(--node-editor-border);
        border-radius: var(--node-editor-radius-md);
        box-shadow: var(--node-editor-toolbar-shadow);
    }

    .flow-wrapper :global(.svelte-flow__controls-button) {
        color: var(--node-editor-text);
        background: var(--node-editor-toolbar-bg);
        border-bottom-color: var(--node-editor-divider);
    }

    .flow-wrapper :global(.svelte-flow__controls-button:hover) {
        color: var(--node-editor-text-strong);
        background: var(--node-editor-action-hover-bg);
    }
</style>
