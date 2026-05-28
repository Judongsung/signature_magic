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
        useSvelteFlow,
        type Connection,
        type Edge,
        type OnDelete,
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';

    import { graphStore } from '../stores/graphStore.svelte';
    import CustomNode from './CustomNode.svelte';
    import CustomEdge from './CustomEdge.svelte';
    import type { MagicNode, MagicType, MagicTypeConfig } from '../types/magic';
    // 노드 타입 데이터는 JSON에서 로드합니다.
    import magicTypesData from '../data/magicTypes.json';

    const nodeTypes = { magicNode: CustomNode };
    const edgeTypes = { magicEdge: CustomEdge };
    const { screenToFlowPosition } = useSvelteFlow();

    // JSON 데이터를 MagicType으로 타입 단언하여 사용합니다.
    const magicTypes = magicTypesData as MagicTypeConfig[];

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

        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        graphStore.addNode(magicType, position);
    }

    const onDelete: OnDelete<MagicNode, Edge> = ({ nodes, edges }) => {
        graphStore.onDelete(nodes, edges);
    };
</script>

<div class="editor-container">
    <!-- 툴바 -->
    <div class="toolbar">
        <span class="toolbar-label">노드</span>
        {#each magicTypes as { type, icon }}
            <button
                class="drag-btn"
                draggable="true"
                ondragstart={(e) => onDragStart(e, type)}
            >
                {icon} {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
        {/each}

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
            isValidConnection={(edge) => graphStore.checkConnection(edge)}
            onbeforeconnect={(conn) => graphStore.prepareEdge(conn)}
            onconnect={(conn: Connection) => graphStore.onEdgeConnected(conn)}
            ondelete={onDelete}
            deleteKey="Delete"
            fitView
        >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
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

    .drag-btn {
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
