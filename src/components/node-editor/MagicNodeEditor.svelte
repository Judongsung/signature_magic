<script lang="ts">
    /**
     * MagicNodeEditor.svelte
     *
     * 역할: 순수 UI 컴포넌트
     * - SvelteFlow 캔버스를 렌더링합니다.
     * - 사용자 이벤트를 graphStore 액션으로 위임합니다.
     * - 비즈니스 로직을 직접 포함하지 않습니다.
     */
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
    import { EDITOR_CANVAS, MAGIC_NODE_CATEGORIES, type MagicNodeCategory } from '../../constants/gameConfigs';
    import { resolveDropPosition } from '../../systems/graph/editorCanvas';
    import { getMagicTypesByCategory } from '../../systems/graph/magicTypeRegistry';
    import CustomNode from './CustomNode.svelte';
    import CustomEdge from './CustomEdge.svelte';
    import NodeDescriptionTooltip from '../shared/NodeDescriptionTooltip.svelte';
    import type { MagicNode, MagicType } from '../../types/magic';

    const nodeTypes = { magicNode: CustomNode };
    const edgeTypes = { magicEdge: CustomEdge };
    const snapGrid = EDITOR_CANVAS.SNAP_GRID as SnapGrid;
    const canvasExtent = EDITOR_CANVAS.EXTENT as CoordinateExtent;
    const panOnDragButtons = [...EDITOR_CANVAS.PAN_ON_DRAG_BUTTONS];
    const { screenToFlowPosition } = useSvelteFlow();

    let activeCategoryIds = $state<MagicNodeCategory[]>(['basic']);
    const visibleMagicTypes = $derived(
        getMagicTypesByCategory(activeCategoryIds),
    );

    function toggleCategory(categoryId: MagicNodeCategory) {
        activeCategoryIds = activeCategoryIds.includes(categoryId)
            ? activeCategoryIds.filter((id) => id !== categoryId)
            : [...activeCategoryIds, categoryId];
    }

    // ── 드래그 앤 드롭 ──────────────────────────────────────────────────────

    function onDragStart(event: DragEvent, magicType: MagicType) {
        event.dataTransfer?.setData('application/magictype', magicType);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
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
    <!-- 툴바 -->
    <div class="toolbar">
        <span class="toolbar-label">노드</span>
        <div class="category-tabs" aria-label="노드 카테고리">
            {#each MAGIC_NODE_CATEGORIES as category}
                {@const isActive = activeCategoryIds.includes(category.id)}
                <button
                    type="button"
                    class="category-tab"
                    class:active={isActive}
                    aria-pressed={isActive}
                    onclick={() => toggleCategory(category.id)}
                >
                    {category.label}
                </button>
            {/each}
        </div>

        <div class="toolbar-divider"></div>

        {#each visibleMagicTypes as { type, label, icon, description }}
            <button
                class="drag-btn tooltip-host"
                draggable="true"
                aria-describedby={`magic-node-tooltip-${type}`}
                ondragstart={(e) => onDragStart(e, type)}
            >
                <span>{icon} {label}</span>
                <NodeDescriptionTooltip
                    id={`magic-node-tooltip-${type}`}
                    {description}
                    placement="bottom"
                />
            </button>
        {/each}
        {#if visibleMagicTypes.length === 0}
            <span class="toolbar-empty">표시할 노드 없음</span>
        {/if}

        <div class="toolbar-divider"></div>

        <button class="action-btn clear-btn" onclick={() => graphStore.clear()}>
            🗑 전체 초기화
        </button>

        <div class="toolbar-hint">
            드래그하여 배치 &nbsp;·&nbsp;
            선택 후 <kbd>Delete</kbd> 로 삭제
        </div>
    </div>

    <!-- SvelteFlow 캔버스 -->
    <div
        class="flow-wrapper"
        ondragover={onDragOver}
        ondrop={onDrop}
        oncontextmenu={preventCanvasContextMenu}
        role="region"
        aria-label="magic node canvas"
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

    .toolbar {
        padding: 10px 16px;
        background: #111118;
        border-bottom: 1px solid #2a2a3a;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
        z-index: 10;
    }

    .toolbar-label {
        font-size: 10px;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 1px;
        white-space: nowrap;
    }

    .category-tabs {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
    }

    .category-tab {
        background: #16161f;
        color: #8e8ea8;
        border: 1px solid #2f2f44;
        border-radius: 8px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
        transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
    }

    .category-tab:hover {
        color: #e8e2ff;
        border-color: #6f5e9c;
    }

    .category-tab.active {
        background: #2a2140;
        color: #f1ecff;
        border-color: #9b7ad6;
        box-shadow: 0 0 0 1px rgba(155, 122, 214, 0.18);
    }

    .drag-btn {
        position: relative;
        background: #1e1e2e;
        color: #ddd;
        border: 1px solid #3a3a5a;
        padding: 6px 13px;
        border-radius: 8px;
        cursor: grab;
        font-size: 13px;
        font-weight: 600;
        transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
        user-select: none;
    }

    .drag-btn:hover {
        background: #2a2a40;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(155, 89, 182, 0.35);
        border-color: #9b59b6;
    }

    .drag-btn:active { cursor: grabbing; transform: scale(0.96); }

    .toolbar-empty {
        color: #66667a;
        font-size: 12px;
        font-weight: 600;
        padding: 6px 8px;
        white-space: nowrap;
    }

    .toolbar-divider {
        width: 1px;
        height: 24px;
        background: #2a2a3a;
        margin: 0 4px;
    }

    .action-btn {
        padding: 6px 13px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid;
        transition: all 0.15s;
    }

    .clear-btn {
        background: #1e1010;
        color: #f87;
        border-color: #5a2a2a;
    }

    .clear-btn:hover {
        background: #2e1515;
        border-color: #f87;
        box-shadow: 0 2px 10px rgba(255, 100, 100, 0.25);
    }

    .toolbar-hint {
        margin-left: auto;
        color: #444;
        font-size: 11px;
        white-space: nowrap;
    }

    kbd {
        background: #222;
        border: 1px solid #444;
        border-radius: 4px;
        padding: 1px 5px;
        font-size: 10px;
        font-family: monospace;
        color: #aaa;
    }

    .flow-wrapper {
        flex-grow: 1;
        position: relative;
    }
</style>
