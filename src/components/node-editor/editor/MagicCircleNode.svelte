<script lang="ts">
    import {
        Handle,
        NodeResizer,
        Position,
        useUpdateNodeInternals,
    } from '@xyflow/svelte';
    import {
        MAGIC_CIRCLE_NODE_CONFIG,
    } from '../../../constants/graphConfigs';
    import {
        MAGIC_CIRCLE_STATUS_LABELS,
        NODE_EDITOR_TEXT,
    } from '../../../constants/uiText';
    import type { MagicCircleNodeData } from '../../../types/magic';
    import { graphStore } from '../../../stores/graphStore.svelte';
    import { resolveMagicCircleViewModel } from '../../../systems/graph/presentation/magicCirclePresentation';
    import { resolveCirclePortLeft } from '../../../systems/graph/presentation/magicHandlePresentation';
    import {
        createNodeHandleLayoutKey,
        createNodeInternalsRefresh,
    } from './nodeInternalsRefresh';
    import { useNodeEditorDetails } from './nodeDetailsContext';

    let {
        id,
        data,
        width = MAGIC_CIRCLE_NODE_CONFIG.DEFAULT_SIZE.width,
        height = MAGIC_CIRCLE_NODE_CONFIG.DEFAULT_SIZE.height,
        selected = false,
        draggable = true,
        isConnectable = true,
    }: {
        id: string;
        data: MagicCircleNodeData;
        width?: number;
        height?: number;
        selected?: boolean;
        draggable?: boolean;
        isConnectable?: boolean;
    } = $props();

    const circleState = $derived(
        graphStore.circleStates.find(state => state.circleId === id)
    );
    const viewModel = $derived(resolveMagicCircleViewModel(
        { id, data, width, height },
        graphStore.nodes,
        circleState
    ));
    const isActiveTarget = $derived(
        draggable && graphStore.activeCircleId === id
    );
    const insertionIndicatorY = $derived(
        graphStore.sequenceDropPreview?.circleId === id
            ? graphStore.sequenceDropPreview.y
            : undefined
    );
    const updateNodeInternals = useUpdateNodeInternals();
    const openDetails = useNodeEditorDetails();
    const refreshNodeInternals = createNodeInternalsRefresh(
        () => id,
        updateNodeInternals
    );
    const handleLayoutKey = $derived(createNodeHandleLayoutKey([
        data.inputHandleCount,
        data.outputHandleCount,
    ]));
    const circleTitle = $derived(
        data.name ||
        `${NODE_EDITOR_TEXT.CIRCLE_TITLE} ${viewModel.displayOrder ?? '—'}`
    );

    $effect(() => {
        refreshNodeInternals(handleLayoutKey);
    });

    function openCircleDetails(event: MouseEvent): void {
        event.stopPropagation();
        openDetails?.(id);
    }
</script>

<div
    class="magic-circle-node"
    class:selected
    class:read-only={!draggable}
    class:active-target={isActiveTarget && !selected}
    data-status={viewModel.status}
    style:width={`${width}px`}
    style:height={`${height}px`}
    style:--circle-port-offset={`${MAGIC_CIRCLE_NODE_CONFIG.PORT_OFFSET}px`}
>
    <NodeResizer
        isVisible={draggable && selected}
        minWidth={viewModel.minimumWidth}
        minHeight={viewModel.minimumHeight}
        onResizeEnd={(_event, params) => graphStore.resizeCircle(id, params)}
    />

    <div
        class={`circle-title ${MAGIC_CIRCLE_NODE_CONFIG.DRAG_HANDLE_CLASS}`}
    >
        <span class="circle-title-name">{circleTitle}</span>
        <span class="circle-title-actions">
            <span class="circle-status">
                {MAGIC_CIRCLE_STATUS_LABELS[viewModel.status]}
            </span>
            {#if draggable && openDetails}
                <button
                    type="button"
                    class="circle-details-trigger nodrag nopan"
                    aria-label={`${circleTitle} ${NODE_EDITOR_TEXT.DETAILS_OPEN_ARIA_LABEL}`}
                    onpointerdown={(event) => event.stopPropagation()}
                    onclick={openCircleDetails}
                >
                    {NODE_EDITOR_TEXT.DETAILS_BUTTON_TEXT}
                </button>
            {/if}
        </span>
    </div>

    <div class="port-label outer-input-label">
        {NODE_EDITOR_TEXT.CIRCLE_INPUT}
    </div>
    {#each viewModel.inputHandleIds as inputHandleId, index}
        <Handle
            id={inputHandleId}
            type="target"
            position={Position.Top}
            {isConnectable}
            class="circle-port outer-input"
            style={`left: ${resolveCirclePortLeft(index, viewModel.inputHandleIds.length)};`}
        />
    {/each}

    {#if insertionIndicatorY !== undefined}
        <div
            class="sequence-insertion-indicator"
            style:top={`${insertionIndicatorY}px`}
            aria-hidden="true"
        ></div>
    {/if}

    {#each viewModel.outputHandleIds as outputHandleId, index}
        <Handle
            id={outputHandleId}
            type="source"
            position={Position.Bottom}
            {isConnectable}
            class="circle-port outer-output"
            style={`left: ${resolveCirclePortLeft(index, viewModel.outputHandleIds.length)};`}
        />
    {/each}
    <div class="port-label outer-output-label">
        {NODE_EDITOR_TEXT.CIRCLE_OUTPUT}
    </div>
</div>

<style>
    :global(.svelte-flow__node-magicCircle) {
        pointer-events: none !important;
        cursor: default !important;
    }

    .magic-circle-node {
        position: relative;
        box-sizing: border-box;
        pointer-events: none;
        border: 2px solid var(--node-editor-border);
        border-radius: var(--node-editor-circle-radius);
        background: var(--node-editor-circle-surface-bg);
        box-shadow:
            var(--node-editor-surface-inset-highlight),
            var(--node-editor-panel-shadow);
        transition:
            border-color var(--node-editor-transition-fast),
            box-shadow var(--node-editor-transition-fast);
    }

    .magic-circle-node::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        border-radius: inherit;
        background: var(--node-editor-circle-rings-bg);
        opacity: 0.8;
    }

    .magic-circle-node[data-status='valid'] {
        border-color: color-mix(in srgb, var(--node-editor-circle-valid) 58%, var(--node-editor-border));
    }

    .magic-circle-node[data-status='empty'],
    .magic-circle-node[data-status='external'] {
        border-style: dashed;
    }

    .magic-circle-node[data-status='external'] {
        border-color: color-mix(in srgb, var(--node-editor-circle-external) 62%, var(--node-editor-border));
    }

    .magic-circle-node.active-target {
        box-shadow:
            inset 0 0 0 1px color-mix(in srgb, var(--node-editor-circle-selected) 28%, transparent),
            var(--node-editor-panel-shadow);
    }

    .magic-circle-node.selected {
        border-style: solid;
        border-color: var(--node-editor-circle-selected);
        outline: 2px solid color-mix(in srgb, var(--node-editor-circle-selected) 72%, transparent);
        outline-offset: 2px;
        box-shadow: var(--node-editor-circle-selected-shadow);
    }

    .circle-title {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 4;
        box-sizing: border-box;
        min-height: var(--node-editor-circle-title-height);
        padding: 9px 14px;
        pointer-events: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--node-editor-text-strong);
        border-bottom: 1px solid var(--node-editor-divider);
        border-radius:
            calc(var(--node-editor-circle-radius) - 2px)
            calc(var(--node-editor-circle-radius) - 2px)
            0
            0;
        background: var(--node-editor-circle-title-bg);
        font-family: var(--font-title);
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.12em;
        cursor: move;
        user-select: none;
        box-shadow: 0 1px 8px rgba(233, 199, 111, 0.10);
    }

    .magic-circle-node.selected .circle-title {
        color: var(--node-editor-circle-selected-text);
        border-bottom-color: var(--node-editor-circle-selected);
        background: var(--node-editor-circle-selected-title-bg);
    }

    .magic-circle-node.read-only .circle-title {
        pointer-events: none;
        cursor: default;
    }

    .circle-status {
        padding: 2px 6px;
        color: var(--node-editor-muted-strong);
        border: 1px solid var(--node-editor-border);
        border-radius: var(--node-editor-radius-sm);
        background: var(--node-editor-circle-status-bg);
        font-family: var(--font-body);
        font-size: 9px;
        letter-spacing: 0.06em;
    }

    .circle-title-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .circle-title-actions {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .circle-details-trigger {
        width: 24px;
        height: 24px;
        padding: 0;
        border: 1px solid color-mix(in srgb, var(--node-editor-circle-selected) 38%, var(--node-editor-border));
        border-radius: var(--node-editor-radius-sm);
        background: var(--node-editor-circle-status-bg);
        color: var(--node-editor-text-strong);
        cursor: pointer;
        font-size: 15px;
        line-height: 1;
    }

    .circle-details-trigger:hover,
    .circle-details-trigger:focus-visible {
        border-color: var(--node-editor-circle-selected);
        background: var(--node-editor-button-active-bg);
    }

    .circle-details-trigger:focus-visible {
        outline: 2px solid var(--node-editor-starlight);
        outline-offset: 1px;
    }

    .magic-circle-node :global(.svelte-flow__resize-control) {
        pointer-events: all;
    }

    :global(.circle-port) {
        z-index: 5;
        width: 14px;
        height: 14px;
        pointer-events: all;
        border: 2px solid var(--node-editor-accent);
        background: var(--node-editor-handle-bg);
        box-shadow: 0 0 12px color-mix(in srgb, var(--node-editor-accent) 55%, transparent);
        transform: translateX(-50%);
    }

    :global(.outer-input) {
        top: -8px;
    }

    :global(.outer-output) {
        bottom: -8px;
    }

    .sequence-insertion-indicator {
        position: absolute;
        left: 24px;
        right: 24px;
        z-index: 3;
        height: 2px;
        pointer-events: none;
        border-radius: 999px;
        background: var(--node-editor-circle-selected);
        box-shadow: 0 0 12px var(--node-editor-circle-selected);
    }

    .port-label {
        position: absolute;
        left: 50%;
        z-index: 3;
        transform: translateX(-50%);
        color: var(--node-editor-muted-strong);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.08em;
        pointer-events: none;
    }

    .outer-input-label {
        top: calc(-1 * var(--circle-port-offset));
    }

    .outer-output-label {
        bottom: calc(-1 * var(--circle-port-offset));
    }
</style>
