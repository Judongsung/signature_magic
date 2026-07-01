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
        type NodeEventWithPointer,
        type NodeTargetEventWithPointer,
        type OnDelete,
        type OnBeforeDelete,
        type CoordinateExtent,
        type SnapGrid,
    } from '@xyflow/svelte';
    import { tick } from 'svelte';
    import '@xyflow/svelte/dist/style.css';

    import { graphStore } from '../../../stores/graphStore.svelte';
    import {
        DEFAULT_ACTIVE_MAGIC_NODE_CATEGORIES,
        EDITOR_CANVAS,
        type MagicNodeCategory,
    } from '../../../constants/nodeEditorConfigs';
    import {
        GRAPH_EDGE_TYPES,
        GRAPH_NODE_TYPES,
        MAGIC_CIRCLE_NODE_CONFIG,
        MAGIC_CONTROL_PAIR_ROLES,
    } from '../../../constants/graphConfigs';
    import { NODE_EDITOR_TEXT } from '../../../constants/uiText';
    import {
        getExtentCenter,
        resolveCenteredDropPosition,
        resolveCenteredViewport,
        resolveNearestAvailableRectPosition,
    } from '../../../systems/graph/editor/editorCanvas';
    import { getMagicTypesByCategory } from '../../../systems/graph/registry/magicTypeRegistry';
    import MagicGraphCanvasBackground from '../MagicGraphCanvasBackground.svelte';
    import MagicUnitNode from './nodes/MagicUnitNode.svelte';
    import MagicCircleNode from './nodes/MagicCircleNode.svelte';
    import MagicGraphEdge from './nodes/MagicGraphEdge.svelte';
    import MagicNodeToolbar from './MagicNodeToolbar.svelte';
    import { openNodeDetailsFromContextMenu } from './details/nodeDetailsInteraction';
    import {
        type MagicEditorNode,
    } from '../../../systems/graph/magicGraphTypes';
    import {
        type MagicType,
    } from '../../../types/magicTypeConfig';
    import {
        getMagicCircleNodes,
        isMagicTypeAllowedInCircleSequence,
        isMagicCircleNode,
    } from '../../../systems/graph/model/magicCircleGraph';
    import {
        createMagicNodeDragOrigins,
        resolveMagicCircleSequenceInsertion,
        resolveMagicNodeSequenceDrop,
        type MagicNodeSequenceDrop,
    } from '../../../systems/graph/editor/magicCircleEditorInteraction';
    import {
        createMagicCircleGraphIndex,
    } from '../../../systems/graph/model/magicCircleGraphIndex';
    import { provideNodeEditorDetails } from './details/nodeDetailsContext';
    import {
        provideMagicGraphEditorActions,
        provideMagicGraphRenderContext,
    } from '../rendering/magicGraphRenderContext';
    import { isMagicControlPairNode } from '../../../systems/graph/model/magicControlPairs';
    import {
        MAGIC_GRAPH_SELECTION_MODES,
        resolveMagicGraphCircleClickTargetId,
        resolveMagicGraphSelectionScope,
        type MagicGraphSelectionScope,
    } from '../../../systems/graph/editor/magicGraphSelection';
    import {
        MAGIC_GRAPH_CLIPBOARD_MIME_TYPE,
    } from '../../../systems/graph/model/magicGraphClipboard';

    let {
        onOpenPresetDialog,
        onOpenNodeDetails,
        onConfirmCircleDelete,
        interactionBlocked = false,
    }: {
        onOpenPresetDialog: () => void;
        onOpenNodeDetails: (nodeId: string) => void;
        onConfirmCircleDelete: () => Promise<boolean>;
        interactionBlocked?: boolean;
    } = $props();

    provideNodeEditorDetails((nodeId) => onOpenNodeDetails(nodeId));

    const renderGraphIndex = $derived(
        createMagicCircleGraphIndex(graphStore.nodes)
    );
    const renderCircleStateById = $derived(new Map(
        graphStore.circleStates.map(state => [state.circleId, state])
    ));
    provideMagicGraphRenderContext({
        getCircleChildren: circleId =>
            renderGraphIndex.childrenByCircleId.get(circleId) ?? [],
        getCircleState: circleId =>
            renderCircleStateById.get(circleId),
        get activeCircleId() {
            return graphStore.activeCircleId;
        },
        get sequenceDropPreview() {
            return graphStore.sequenceDropPreview;
        },
        get nodeStatEffects() {
            return graphStore.externalStatEffects.nodeEffects;
        },
    });
    provideMagicGraphEditorActions({
        resizeCircle: (circleId, size) =>
            graphStore.resizeCircle(circleId, size),
    });

    const nodeTypes = {
        [GRAPH_NODE_TYPES.MAGIC_NODE]: MagicUnitNode,
        [GRAPH_NODE_TYPES.MAGIC_CIRCLE]: MagicCircleNode,
    };
    const edgeTypes = { [GRAPH_EDGE_TYPES.MAGIC_EDGE]: MagicGraphEdge };
    const snapGrid = EDITOR_CANVAS.SNAP_GRID as SnapGrid;
    const canvasExtent = EDITOR_CANVAS.EXTENT as CoordinateExtent;
    const panOnDragButtons = [...EDITOR_CANVAS.PAN_ON_DRAG_BUTTONS];
    const canvasCenter = getExtentCenter(EDITOR_CANVAS.EXTENT);
    const { screenToFlowPosition, setViewport } = useSvelteFlow();

    let activeCategoryIds = $state<MagicNodeCategory[]>([...DEFAULT_ACTIVE_MAGIC_NODE_CATEGORIES]);
    let flowWrapperElement: HTMLDivElement | undefined;
    let draggedNodeOrigins = $state(createMagicNodeDragOrigins([]));
    let selectionScope = $state<MagicGraphSelectionScope>({
        mode: MAGIC_GRAPH_SELECTION_MODES.CIRCLES,
    });
    let sequenceDrop = $state<MagicNodeSequenceDrop>({
        targetCircleId: undefined,
        insertionIndex: 0,
        indicatorY: undefined,
        beforeNodeId: undefined,
        afterNodeId: undefined,
    });
    const visibleMagicTypes = $derived(
        getMagicTypesByCategory(activeCategoryIds)
            .filter(config => isMagicTypeAllowedInCircleSequence(config.type)),
    );
    const selectedCircle = $derived(
        getMagicCircleNodes(graphStore.nodes)
            .find(circle => circle.id === graphStore.activeCircleId)
    );

    function readFlowNodes(): MagicEditorNode[] {
        return graphStore.nodes;
    }

    function acceptFlowNodes(nodes: MagicEditorNode[]): void {
        graphStore.acceptFlowNodes(nodes);
    }

    function readFlowEdges(): Edge[] {
        return graphStore.edges;
    }

    function acceptFlowEdges(edges: Edge[]): void {
        graphStore.acceptFlowEdges(edges);
    }

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
        if (!selectedCircle) return;
        graphStore.addNode(magicType, selectedCircle.id);
    }

    function addCircleAtCanvasCenter() {
        const bounds = flowWrapperElement?.getBoundingClientRect();
        if (!bounds) return;

        const flowCenter = screenToFlowPosition({
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
        });
        const desiredPosition = resolveCenteredDropPosition(
            flowCenter,
            MAGIC_CIRCLE_NODE_CONFIG.DEFAULT_SIZE,
            snapGrid,
            canvasExtent
        );
        const position = resolveNearestAvailableRectPosition(
            desiredPosition,
            MAGIC_CIRCLE_NODE_CONFIG.DEFAULT_SIZE,
            getMagicCircleNodes(graphStore.nodes).map(circle => ({
                ...circle.position,
                width: circle.width,
                height: circle.height,
            })),
            snapGrid,
            canvasExtent,
            MAGIC_CIRCLE_NODE_CONFIG.COLLISION_GAP
        );

        graphStore.addCircle(position);
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
        if (
            !event.dataTransfer?.types.includes('application/magictype')
        ) {
            return;
        }

        const drop = resolveMagicCircleSequenceInsertion(
            screenToFlowPosition({ x: event.clientX, y: event.clientY }),
            graphStore.nodes,
            getMagicCircleNodes(graphStore.nodes)
        );
        showSequenceDropPreview(drop);
    }

    function onDrop(event: DragEvent) {
        event.preventDefault();
        const magicType = event.dataTransfer?.getData('application/magictype') as MagicType | undefined;
        if (!magicType) {
            graphStore.setSequenceDropPreview(undefined);
            return;
        }

        const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const drop = resolveMagicCircleSequenceInsertion(
            flowPosition,
            graphStore.nodes,
            getMagicCircleNodes(graphStore.nodes)
        );
        if (!drop.targetCircleId) {
            graphStore.setSequenceDropPreview(undefined);
            return;
        }

        graphStore.selectCircle(drop.targetCircleId);
        graphStore.addNode(
            magicType,
            drop.targetCircleId,
            drop.insertionIndex
        );
        graphStore.setSequenceDropPreview(undefined);
    }

    function onDragLeave(event: DragEvent) {
        const currentTarget = event.currentTarget;
        if (
            currentTarget instanceof HTMLElement &&
            event.relatedTarget instanceof Node &&
            currentTarget.contains(event.relatedTarget)
        ) {
            return;
        }

        graphStore.setSequenceDropPreview(undefined);
    }

    function onToolbarDragEnd() {
        graphStore.setSequenceDropPreview(undefined);
    }

    function showSequenceDropPreview(drop: MagicNodeSequenceDrop) {
        graphStore.setSequenceDropPreview(
            drop.targetCircleId && drop.indicatorY !== undefined
                ? drop
                : undefined
        );
    }

    function preventCanvasContextMenu(event: MouseEvent) {
        event.preventDefault();
    }

    function isEditableClipboardTarget(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) return false;
        return Boolean(target.closest(
            'input, textarea, select, [contenteditable="true"]'
        ));
    }

    function handleCopy(event: ClipboardEvent): void {
        if (
            interactionBlocked ||
            isEditableClipboardTarget(event.target)
        ) {
            return;
        }

        const serialized = graphStore.copySelection();
        if (!serialized) return;

        event.clipboardData?.setData(
            MAGIC_GRAPH_CLIPBOARD_MIME_TYPE,
            serialized
        );
        event.clipboardData?.setData('text/plain', serialized);
        event.preventDefault();
    }

    function handlePaste(event: ClipboardEvent): void {
        if (
            interactionBlocked ||
            isEditableClipboardTarget(event.target)
        ) {
            return;
        }

        const serialized =
            event.clipboardData?.getData(
                MAGIC_GRAPH_CLIPBOARD_MIME_TYPE
            ) ||
            event.clipboardData?.getData('text/plain') ||
            undefined;
        if (!graphStore.pasteSelection(serialized)) return;

        event.preventDefault();
    }

    function captureSelectionScope(event: PointerEvent): void {
        if (event.button !== 0 || interactionBlocked) return;

        selectionScope = resolveMagicGraphSelectionScope(
            screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            }),
            getMagicCircleNodes(graphStore.nodes)
        );
    }

    const onBeforeDelete: OnBeforeDelete<MagicEditorNode, Edge> = async ({ nodes }) => {
        if (!nodes.some(isMagicCircleNode)) return true;
        return onConfirmCircleDelete();
    };

    const onDelete: OnDelete<MagicEditorNode, Edge> = ({ nodes, edges }) => {
        graphStore.onDelete(nodes, edges);
    };

    const onNodeClick: NodeEventWithPointer<
        MouseEvent | TouchEvent,
        MagicEditorNode
    > = ({ node }) => {
        graphStore.syncSelectionForNode(node.id);
    };

    const onNodeDragStart: NodeTargetEventWithPointer<
        MouseEvent | TouchEvent,
        MagicEditorNode
    > = ({ targetNode }) => {
        sequenceDrop = {
            targetCircleId: undefined,
            insertionIndex: 0,
            indicatorY: undefined,
            beforeNodeId: undefined,
            afterNodeId: undefined,
        };
        graphStore.setSequenceDropPreview(undefined);
        if (targetNode && isMagicCircleNode(targetNode)) {
            graphStore.applySelectionScope({
                mode: MAGIC_GRAPH_SELECTION_MODES.CIRCLES,
            });
            draggedNodeOrigins = [];
            return;
        }

        if (targetNode?.parentId) {
            graphStore.applySelectionScope({
                mode: MAGIC_GRAPH_SELECTION_MODES.UNITS,
                circleId: targetNode.parentId,
            });
        }
        draggedNodeOrigins = createMagicNodeDragOrigins(graphStore.nodes);
        if (
            draggedNodeOrigins.length === 0 &&
            targetNode &&
            !isMagicCircleNode(targetNode) &&
            targetNode.parentId
        ) {
            draggedNodeOrigins = [{
                nodeId: targetNode.id,
                circleId: targetNode.parentId,
                sequenceIndex: targetNode.data.sequenceIndex ?? 0,
            }];
        }
    };

    function readEventScreenPoint(
        event: MouseEvent | TouchEvent
    ): { x: number; y: number } | undefined {
        if ('touches' in event) {
            const touch = event.touches[0] ?? event.changedTouches[0];
            return touch
                ? { x: touch.clientX, y: touch.clientY }
                : undefined;
        }

        return { x: event.clientX, y: event.clientY };
    }

    async function handlePaneClick(
        { event }: { event: MouseEvent }
    ): Promise<void> {
        const screenPoint = readEventScreenPoint(event);
        const circleId = screenPoint
            ? resolveMagicGraphCircleClickTargetId(
                screenToFlowPosition(screenPoint),
                getMagicCircleNodes(graphStore.nodes)
            )
            : undefined;

        // Svelte Flow의 pane 기본 선택 해제가 반영된 뒤 store 선택을 확정한다.
        await tick();
        graphStore.selectCircle(circleId);
    }

    const onNodeDrag: NodeTargetEventWithPointer<
        MouseEvent | TouchEvent,
        MagicEditorNode
    > = ({ event }) => {
        const screenPoint = readEventScreenPoint(event);
        if (!screenPoint || draggedNodeOrigins.length === 0) return;

        sequenceDrop = resolveMagicNodeSequenceDrop(
            screenToFlowPosition(screenPoint),
            draggedNodeOrigins,
            graphStore.nodes,
            getMagicCircleNodes(graphStore.nodes)
        );
        showSequenceDropPreview(sequenceDrop);
    };

    const onNodeDragStop: NodeTargetEventWithPointer<
        MouseEvent | TouchEvent,
        MagicEditorNode
    > = ({ targetNode }) => {
        if (targetNode && isMagicCircleNode(targetNode)) {
            graphStore.commitCircleLayoutChanges();
            return;
        }
        if (draggedNodeOrigins.length === 0) return;
        graphStore.moveNodeGroup(
            draggedNodeOrigins,
            sequenceDrop.targetCircleId,
            sequenceDrop.insertionIndex
        );
        draggedNodeOrigins = [];
        sequenceDrop = {
            targetCircleId: undefined,
            insertionIndex: 0,
            indicatorY: undefined,
            beforeNodeId: undefined,
            afterNodeId: undefined,
        };
        graphStore.setSequenceDropPreview(undefined);
    };

    const onNodeContextMenu: NodeEventWithPointer<MouseEvent, MagicEditorNode> = ({ node, event }) => {
        if (isMagicCircleNode(node)) return;
        if (
            isMagicControlPairNode(node) &&
            node.data.controlPair.role === MAGIC_CONTROL_PAIR_ROLES.END
        ) {
            return;
        }
        openNodeDetailsFromContextMenu(node, event, onOpenNodeDetails);
    };

</script>

<svelte:window oncopy={handleCopy} onpaste={handlePaste} />

<div class="editor-container">
    <MagicNodeToolbar
        {activeCategoryIds}
        {visibleMagicTypes}
        nodeStatEffects={graphStore.externalStatEffects.nodeEffects}
        canAddNode={Boolean(selectedCircle)}
        onToggleCategory={toggleCategory}
        onAddNode={addNodeAtCanvasCenter}
        onAddCircle={addCircleAtCanvasCenter}
        {onDragStart}
        onDragEnd={onToolbarDragEnd}
        onClear={() => graphStore.clear()}
        {onOpenPresetDialog}
    />

    <div
        bind:this={flowWrapperElement}
        class="flow-wrapper"
        onpointerdowncapture={captureSelectionScope}
        ondragover={onDragOver}
        ondragleave={onDragLeave}
        ondrop={onDrop}
        oncontextmenu={preventCanvasContextMenu}
        role="region"
        aria-label={NODE_EDITOR_TEXT.CANVAS_ARIA_LABEL}
        data-tooltip-boundary
    >
        <SvelteFlow
            bind:nodes={readFlowNodes, acceptFlowNodes}
            bind:edges={readFlowEdges, acceptFlowEdges}
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
            onbeforedelete={onBeforeDelete}
            ondelete={onDelete}
            onnodeclick={onNodeClick}
            onnodedragstart={onNodeDragStart}
            onnodedrag={onNodeDrag}
            onnodedragstop={onNodeDragStop}
            onnodecontextmenu={onNodeContextMenu}
            onselectionend={() => graphStore.applySelectionScope(selectionScope)}
            onpaneclick={handlePaneClick}
            oninit={centerInitialViewport}
            deleteKey={interactionBlocked ? null : 'Delete'}
        >
            <ViewportPortal target="back">
                <MagicGraphCanvasBackground />
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

    .flow-wrapper :global(.svelte-flow__pane),
    .flow-wrapper :global(.svelte-flow__pane.draggable),
    .flow-wrapper :global(.svelte-flow__pane.dragging),
    .flow-wrapper :global(.svelte-flow__pane.selection) {
        cursor: default;
    }

    .flow-wrapper :global(.svelte-flow__node-magicNode:hover),
    .flow-wrapper :global(.svelte-flow__node-magicNode:focus-within) {
        z-index: var(--node-editor-tooltip-node-z-index) !important;
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
