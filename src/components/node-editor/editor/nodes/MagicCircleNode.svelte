<script lang="ts">
    import {
        Handle,
        NodeResizer,
        Position,
        useUpdateNodeInternals,
    } from '@xyflow/svelte';
    import {
        MAGIC_CIRCLE_NODE_CONFIG,
        MAGIC_CIRCLE_SEQUENCE_CONFIG,
        MAGIC_CONTROL_PAIR_CONFIG,
    } from '../../../../constants/graphConfigs';
    import { NODE_EDITOR_TEXT } from '../../../../constants/uiText';
    import type { MagicCircleNodeData } from '../../../../types/magic';
    import { graphStore } from '../../../../stores/graphStore.svelte';
    import { resolveMagicCircleViewModel } from '../../../../systems/graph/presentation/magicCirclePresentation';
    import { resolveCirclePortLeft } from '../../../../systems/graph/presentation/magicHandlePresentation';
    import { resolveMagicControlPairConnectors } from '../../../../systems/graph/presentation/magicControlPairPresentation';
    import { resolveMagicBranchPairRailWidth } from '../../../../systems/graph/model/magicControlPairs';
    import {
        createNodeHandleLayoutKey,
        createNodeInternalsRefresh,
    } from './nodeInternalsRefresh';
    import { useNodeEditorDetails } from '../details/nodeDetailsContext';

    const componentInstanceId = $props.id();

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
    const controlPairConnectors = $derived(
        resolveMagicControlPairConnectors(graphStore.nodes, id)
    );
    const rightRailWidth = $derived(
        resolveMagicBranchPairRailWidth(graphStore.nodes, id)
    );
    const cardRight = $derived(
        width -
        MAGIC_CIRCLE_SEQUENCE_CONFIG.HORIZONTAL_INSET -
        rightRailWidth
    );
    const branchMarkerId = $derived(
        `${componentInstanceId}-branch-arrow-${id}`
    );

    $effect(() => {
        refreshNodeInternals(handleLayoutKey);
    });

    function openCircleDetails(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        openDetails?.(id);
    }

    function branchConnectorLaneX(
        connector: (typeof controlPairConnectors)[number]
    ): number {
        return cardRight +
            connector.railIndentDepth *
                MAGIC_CONTROL_PAIR_CONFIG.REPEAT_INDENT_PX +
            MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_HOOK_WIDTH +
            connector.lane *
                MAGIC_CONTROL_PAIR_CONFIG.RAIL_LANE_GAP;
    }

    function connectorPath(
        connector: (typeof controlPairConnectors)[number]
    ): string {
        const {
            startIndentDepth,
            endIndentDepth,
            startY,
            endY,
        } = connector;
        const startAnchorX = cardRight +
            startIndentDepth *
                MAGIC_CONTROL_PAIR_CONFIG.REPEAT_INDENT_PX;
        const endAnchorX = cardRight +
            endIndentDepth *
                MAGIC_CONTROL_PAIR_CONFIG.REPEAT_INDENT_PX;
        const laneX = branchConnectorLaneX(connector);
        const direction = endY >= startY ? 1 : -1;
        const cornerRadius = Math.min(
            MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_CORNER_RADIUS,
            Math.abs(endY - startY) / 2,
            laneX - startAnchorX,
            laneX - endAnchorX
        );
        return [
            `M ${startAnchorX} ${startY}`,
            `H ${laneX - cornerRadius}`,
            `Q ${laneX} ${startY} ${laneX} ${startY + direction * cornerRadius}`,
            `V ${endY - direction * cornerRadius}`,
            `Q ${laneX} ${endY} ${laneX - cornerRadius} ${endY}`,
            `H ${endAnchorX}`,
        ].join(' ');
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
    style:pointer-events="none"
    style:cursor="default"
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
        role="group"
        aria-label={circleTitle}
        oncontextmenu={openCircleDetails}
    >
        <span
            class="circle-title-content"
            class:has-caption={Boolean(data.caption)}
        >
            <span class="circle-title-name">{circleTitle}</span>
            {#if data.caption}
                <span class="circle-title-caption">{data.caption}</span>
            {/if}
        </span>
        <span class="circle-title-actions">
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

    {#if controlPairConnectors.length > 0}
        <svg
            class="control-pair-overlay"
            width={width}
            height={height}
            aria-hidden="true"
        >
            <defs>
                <marker
                    id={branchMarkerId}
                    markerWidth={MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_MARKER_SIZE}
                    markerHeight={MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_MARKER_SIZE}
                    refX={MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_MARKER_SIZE}
                    refY={MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_MARKER_SIZE / 2}
                    orient="auto"
                >
                    <path
                        d={`M 0 0 L ${MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_MARKER_SIZE} ${MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_MARKER_SIZE / 2} L 0 ${MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_MARKER_SIZE}`}
                    />
                </marker>
            </defs>
            {#each controlPairConnectors as connector (connector.pairId)}
                <path
                    class="control-pair-connector branch-connector"
                    d={connectorPath(connector)}
                    marker-end={`url(#${branchMarkerId})`}
                />
            {/each}
        </svg>
    {/if}

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

    .control-pair-overlay {
        position: absolute;
        inset: 0;
        z-index: 2;
        overflow: visible;
        pointer-events: none;
    }

    .control-pair-connector {
        fill: none;
        stroke-width: 2;
        vector-effect: non-scaling-stroke;
    }

    .branch-connector {
        stroke: var(--node-editor-branch-color);
    }

    .control-pair-overlay marker path {
        fill: none;
        stroke: var(--node-editor-branch-color);
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    .magic-circle-node[data-status='valid'] {
        border-color: color-mix(in srgb, var(--node-editor-circle-valid) 58%, var(--node-editor-border));
    }

    .magic-circle-node[data-status='empty'] {
        border-style: dashed;
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

    .circle-title-content {
        min-width: 0;
        flex: 1 1 auto;
        display: flex;
        align-items: baseline;
        gap: 12px;
    }

    .circle-title-name {
        min-width: 0;
        flex: 0 1 auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .circle-title-content.has-caption .circle-title-name {
        max-width: 55%;
    }

    .circle-title-caption {
        min-width: 0;
        flex: 1 1 auto;
        overflow: hidden;
        opacity: 0.72;
        font-family: var(--font-body);
        font-size: 11px;
        font-weight: 400;
        letter-spacing: normal;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .circle-title-actions {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        margin-left: 12px;
    }

    .circle-details-trigger {
        width: 24px;
        height: 24px;
        padding: 0;
        border: 1px solid color-mix(in srgb, var(--node-editor-circle-selected) 38%, var(--node-editor-border));
        border-radius: var(--node-editor-radius-sm);
        background: var(--node-editor-button-bg);
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
