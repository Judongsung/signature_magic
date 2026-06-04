<script lang="ts">
    import {
        SvelteFlow,
        Background,
        Controls,
        BackgroundVariant,
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
        DEFAULT_ACTIVE_MAGIC_NODE_CATEGORY_IDS,
        EDITOR_CANVAS,
        type MagicNodeCategory,
    } from '../../constants/gameConfigs';
    import { NODE_EDITOR_TEXT } from '../../constants/uiText';
    import {
        resolveCenteredDropPosition,
        resolveDropPosition,
    } from '../../systems/graph/editorCanvas';
    import { getMagicTypesByCategory } from '../../systems/graph/magicTypeRegistry';
    import CustomNode from './CustomNode.svelte';
    import CustomEdge from './CustomEdge.svelte';
    import MagicNodeToolbar from './MagicNodeToolbar.svelte';
    import type { MagicNode, MagicType } from '../../types/magic';

    const nodeTypes = { magicNode: CustomNode };
    const edgeTypes = { magicEdge: CustomEdge };
    const snapGrid = EDITOR_CANVAS.SNAP_GRID as SnapGrid;
    const canvasExtent = EDITOR_CANVAS.EXTENT as CoordinateExtent;
    const panOnDragButtons = [...EDITOR_CANVAS.PAN_ON_DRAG_BUTTONS];
    const { screenToFlowPosition } = useSvelteFlow();

    let activeCategoryIds = $state<MagicNodeCategory[]>([...DEFAULT_ACTIVE_MAGIC_NODE_CATEGORY_IDS]);
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
            deleteKey="Delete"
        >
            <Background variant={BackgroundVariant.Dots} gap={snapGrid[0]} size={1.2} />
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
        background: #0a0a0f;
    }

    .flow-wrapper {
        flex-grow: 1;
        position: relative;
    }
</style>
