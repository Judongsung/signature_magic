<script lang="ts">
    import { Handle, Position, useUpdateNodeInternals } from '@xyflow/svelte';
    import {
        type MagicNodeData,
    } from '../../../../types/magic';
    import {
        MAGIC_NODE_HANDLE_CONFIG,
        MAGIC_NODE_KINDS,
        MAGIC_NODE_RENDERING_CONFIG,
    } from '../../../../constants/graphConfigs';
    import { NODE_EDITOR_TEXT } from '../../../../constants/uiText';
    import { graphStore } from '../../../../stores/graphStore.svelte';
    import { getMagicTypeConfig } from '../../../../systems/graph/registry/magicTypeRegistry';
    import {
        resolveMagicNodeCaption,
        resolveMagicNodeLabel,
    } from '../../../../systems/graph/model/magicNodeData';
    import { resolveHandleLeft } from '../../../../systems/graph/presentation/magicHandlePresentation';
    import { resolveMagicControlPairNodePresentation } from '../../../../systems/graph/presentation/magicControlPairPresentation';
    import { isCircleSystemMagicNodeData } from '../../../../systems/graph/model/circleSystemMagicNodes';
    import DescriptionTooltip from '../../../shared/DescriptionTooltip.svelte';
    import MagicNodeTooltipStats from '../MagicNodeTooltipStats.svelte';
    import {
        createNodeHandleLayoutKey,
        createNodeInternalsRefresh,
    } from './nodeInternalsRefresh';
    import { useNodeEditorDetails } from '../details/nodeDetailsContext';

    let {
        id,
        data,
        parentId,
        draggable = true,
        isConnectable,
    }: {
        id: string;
        data: MagicNodeData;
        parentId?: string;
        draggable?: boolean;
        isConnectable?: boolean;
    } = $props();

    const nodeConfig = $derived(getMagicTypeConfig(data.magicType));

    const color = $derived(nodeConfig?.color || MAGIC_NODE_RENDERING_CONFIG.FALLBACK_COLOR);
    const icon = $derived(nodeConfig?.icon || MAGIC_NODE_RENDERING_CONFIG.FALLBACK_ICON);
    const defaultLabel = $derived(resolveMagicNodeLabel(data, nodeConfig));
    const controlPairPresentation = $derived(
        resolveMagicControlPairNodePresentation(
            { data },
            defaultLabel,
            nodeConfig?.label
        )
    );
    const label = $derived(controlPairPresentation.label);
    const caption = $derived(
        controlPairPresentation.isEnd
            ? undefined
            : resolveMagicNodeCaption(data, nodeConfig)
    );
    const description = $derived(nodeConfig?.description || '');
    const tooltipId = $derived(`canvas-node-tooltip-${id}`);
    const shouldShowTooltip = $derived(
        data.showTooltip !== false &&
        controlPairPresentation.showTooltip
    );
    const isSystemNode = $derived(data.nodeKind === MAGIC_NODE_KINDS.SYSTEM);
    const isCircleSystemNode = $derived(
        isCircleSystemMagicNodeData(data)
    );
    const isSequenceNode = $derived(!isSystemNode || Boolean(parentId));
    const shouldShowSystemHandles = $derived(isSystemNode && !parentId);
    const shouldShowBadges = $derived(
        shouldShowSystemHandles && data.showBadges !== false
    );
    const isSequenceInsertionBefore = $derived(
        graphStore.sequenceDropPreview?.circleId === parentId &&
        graphStore.sequenceDropPreview?.beforeNodeId === id
    );
    const isSequenceInsertionAfter = $derived(
        graphStore.sequenceDropPreview?.circleId === parentId &&
        graphStore.sequenceDropPreview?.afterNodeId === id
    );
    const nodeStatEffects = $derived(
        data.nodeKind === MAGIC_NODE_KINDS.SYSTEM
            ? []
            : graphStore.externalStatEffects.nodeEffects
    );
    const isRoot = $derived(data.isRoot ?? true);
    const isLeaf = $derived(data.isLeaf ?? true);
    const inputHandleCount = $derived(data.inputHandleCount ?? MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT);
    const outputHandleCount = $derived(data.outputHandleCount ?? MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT);
    const cycleInputHandleIndex = $derived(
        typeof data.cycleInputHandleIndex === 'number' ? data.cycleInputHandleIndex : null
    );
    const cycleInputHandleConnected = $derived(data.cycleInputHandleConnected === true);
    const inputHandles = $derived(createHandleIndexes(inputHandleCount));
    const outputHandles = $derived(createHandleIndexes(outputHandleCount));
    const updateNodeInternals = useUpdateNodeInternals();
    const openDetails = useNodeEditorDetails();
    const refreshNodeInternals = createNodeInternalsRefresh(
        () => id,
        updateNodeInternals
    );
    const handleLayoutKey = $derived(createNodeHandleLayoutKey([
        inputHandleCount,
        outputHandleCount,
        cycleInputHandleIndex,
        cycleInputHandleConnected,
    ]));

    $effect(() => {
        refreshNodeInternals(handleLayoutKey);
    });

    function createHandleIndexes(count: number): number[] {
        return Array.from({ length: Math.max(0, count) }, (_, index) => index);
    }

    function isCycleInputHandle(index: number): boolean {
        return cycleInputHandleIndex === index;
    }

    function isInputHandleConnectable(index: number): boolean | undefined {
        return isCycleInputHandle(index) && cycleInputHandleConnected
            ? false
            : isConnectable;
    }

    function openNodeDetails(event: MouseEvent): void {
        event.stopPropagation();
        openDetails?.(id);
    }
</script>

<div
    class="custom-node"
    class:tooltip-host={shouldShowTooltip}
    class:is-root={isSystemNode && isRoot}
    class:is-leaf={isSystemNode && isLeaf}
    class:sequence-node={isSequenceNode}
    class:sequence-insertion-before={isSequenceInsertionBefore}
    class:sequence-insertion-after={isSequenceInsertionAfter}
    class:control-pair-end={controlPairPresentation.isEnd}
    aria-describedby={shouldShowTooltip ? tooltipId : undefined}
    style="--c: {color};"
>
    <!--
        TARGET handle (입력, 상단)
        isRoot = 아직 아무도 연결 안 한 노드 → 상단에 START 배지 표시
        연결이 도착하면 isRoot=false가 되어 이 배지가 사라집니다.
    -->
    {#if shouldShowBadges}
        <div class="badge-wrap top-badge-wrap">
            {#if isRoot}<span class="badge root-badge">{NODE_EDITOR_TEXT.ROOT_BADGE}</span>{/if}
        </div>
    {/if}
    {#if shouldShowSystemHandles}
        {#each inputHandles as index}
            <Handle
                type="target"
                position={Position.Top}
                id={`${MAGIC_NODE_HANDLE_CONFIG.INPUT_PREFIX}-${index}`}
                isConnectable={isInputHandleConnectable(index)}
                class={`node-handle target-handle ${isCycleInputHandle(index) ? 'cycle-input-handle' : ''}`}
                style={`left: ${resolveHandleLeft(index, inputHandleCount)}; --handle-color: ${color};`}
            />
        {/each}
    {/if}

    <div class="node-body" class:has-caption={Boolean(caption)}>
        <div class="icon">{icon}</div>
        <div class="label">{label}</div>
        {#if caption}<div class="caption">{caption}</div>{/if}
    </div>

    {#if draggable && openDetails && controlPairPresentation.showDetails && !isCircleSystemNode}
        <button
            type="button"
            class="node-details-trigger nodrag nopan"
            aria-label={`${label} ${NODE_EDITOR_TEXT.DETAILS_OPEN_ARIA_LABEL}`}
            onpointerdown={(event) => event.stopPropagation()}
            onclick={openNodeDetails}
        >
            {NODE_EDITOR_TEXT.DETAILS_BUTTON_TEXT}
        </button>
    {/if}

    <!--
        SOURCE handle (출력, 하단)
        isLeaf = 아직 아무데도 연결 안 한 노드 → 하단에 END 배지 표시
        연결을 생성하면 isLeaf=false가 되어 이 배지가 사라집니다.
    -->
    {#if shouldShowSystemHandles}
        {#each outputHandles as index}
            <Handle
                type="source"
                position={Position.Bottom}
                id={`${MAGIC_NODE_HANDLE_CONFIG.OUTPUT_PREFIX}-${index}`}
                isConnectable={isConnectable}
                class="node-handle source-handle"
                style={`left: ${resolveHandleLeft(index, outputHandleCount)}; --handle-color: ${color};`}
            />
        {/each}
    {/if}
    {#if shouldShowBadges}
        <div class="badge-wrap bottom-badge-wrap">
            {#if isLeaf}<span class="badge leaf-badge">{NODE_EDITOR_TEXT.LEAF_BADGE}</span>{/if}
        </div>
    {/if}

    {#if nodeConfig && shouldShowTooltip}
        <DescriptionTooltip
            id={tooltipId}
            {description}
        >
            <MagicNodeTooltipStats
                stats={nodeConfig.stats}
                {nodeStatEffects}
                magicType={nodeConfig.type}
                nodeCategory={nodeConfig.category}
                nodeStatBounds={nodeConfig.statBounds}
            />
        </DescriptionTooltip>
    {/if}
</div>

<style>
    .custom-node {
        --c: var(--node-editor-node-fallback-color);
        --node-caption-max-lines: 2;
        background: var(--node-editor-node-bg);
        border: 1px solid color-mix(in srgb, var(--c) 58%, var(--node-editor-node-border));
        border-radius: var(--node-editor-radius-md);
        padding: var(--node-editor-node-padding);
        color: var(--node-editor-node-text);
        text-align: center;
        width: var(--node-editor-node-width);
        height: var(--node-editor-node-height);
        box-sizing: border-box;
        font-family: var(--font-body), Georgia, serif;
        transition:
            border-color var(--node-editor-transition-medium),
            box-shadow var(--node-editor-transition-medium),
            background var(--node-editor-transition-medium),
            transform var(--node-editor-transition-medium);
        position: relative;
        box-shadow:
            var(--node-editor-surface-inset-highlight),
            0 0 16px color-mix(in srgb, var(--c) 22%, transparent),
            var(--node-editor-node-depth-shadow);
        isolation: isolate;
    }

    .custom-node::before {
        content: '';
        position: absolute;
        left: 13px;
        right: 13px;
        top: 6px;
        height: 1px;
        background: var(--node-editor-node-rune-bg);
        opacity: 0.72;
        filter: drop-shadow(0 0 3px rgba(233, 199, 111, 0.38));
    }

    .custom-node::after {
        content: '';
        position: absolute;
        inset: 4px;
        border: 1px solid color-mix(in srgb, var(--c) 16%, transparent);
        border-radius: calc(var(--node-editor-radius-md) - 2px);
        pointer-events: none;
    }

    .custom-node:hover {
        box-shadow: var(--node-editor-node-hover-shadow) !important;
        transform: translateY(-1px);
    }

    .custom-node.sequence-node {
        padding: 0;
        text-align: left;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }

    .custom-node.sequence-node::after {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }

    .custom-node.control-pair-end {
        border-style: dashed;
    }

    .custom-node.sequence-insertion-before {
        border-top: 3px solid var(--node-editor-circle-selected);
    }

    .custom-node.sequence-insertion-after {
        border-bottom: 3px solid var(--node-editor-circle-selected);
    }

    .custom-node.is-root {
        border-top-color: var(--c);
    }

    .custom-node.is-leaf {
        border-bottom-color: var(--c);
    }

    :global(.node-handle) {
        width: var(--node-editor-handle-size);
        height: var(--node-editor-handle-size);
        border: 1px solid color-mix(in srgb, var(--handle-color) 72%, var(--node-editor-starlight));
        background: var(--node-editor-handle-bg);
        box-shadow:
            var(--node-editor-handle-anchor-shadow),
            0 0 10px color-mix(in srgb, var(--handle-color) 62%, transparent);
    }

    :global(.source-handle) {
        bottom: -6px;
    }

    :global(.target-handle) {
        top: -6px;
    }

    :global(.cycle-input-handle) {
        border-color: color-mix(in srgb, var(--handle-color) 80%, var(--node-editor-root-badge-color));
        background: color-mix(in srgb, var(--handle-color) 32%, var(--node-editor-handle-bg));
    }

    .node-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--node-editor-node-body-gap);
        height: 100%;
        position: relative;
        z-index: 1;
    }

    .node-body.has-caption {
        gap: 2px;
    }

    .sequence-node .node-body {
        flex-direction: row;
        justify-content: flex-start;
        gap: 14px;
        padding: 0 40px 0 12px;
        box-sizing: border-box;
    }

    .sequence-node .node-body.has-caption {
        display: flex;
        flex-direction: row;
        gap: 14px;
    }

    .sequence-node .node-body.has-caption .label {
        flex: 0 0 auto;
        white-space: nowrap;
    }

    .sequence-node .node-body.has-caption .caption {
        display: block;
        flex: 1 1 auto;
        min-width: 0;
        width: auto;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .node-details-trigger {
        position: absolute;
        top: 50%;
        right: 6px;
        z-index: 4;
        width: 26px;
        height: 26px;
        padding: 0;
        transform: translateY(-50%);
        border: 1px solid color-mix(in srgb, var(--c) 34%, var(--node-editor-border));
        border-radius: var(--node-editor-radius-sm);
        background: color-mix(in srgb, var(--node-editor-button-bg) 88%, transparent);
        color: var(--node-editor-text-strong);
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
    }

    .node-details-trigger:hover,
    .node-details-trigger:focus-visible {
        border-color: color-mix(in srgb, var(--c) 70%, var(--node-editor-border));
        background: var(--node-editor-button-active-bg);
    }

    .node-details-trigger:focus-visible {
        outline: 2px solid var(--node-editor-starlight);
        outline-offset: 1px;
    }

    .icon {
        color: var(--c);
        font-size: var(--node-editor-node-icon-size);
        line-height: 1;
        filter: drop-shadow(0 0 7px color-mix(in srgb, var(--c) 72%, transparent));
    }

    .label {
        font-size: var(--node-editor-node-label-size);
        font-weight: 700;
        letter-spacing: 0.08em;
        color: color-mix(in srgb, var(--c) 76%, var(--node-editor-text));
        max-width: 100%;
        overflow-wrap: anywhere;
        line-height: var(--node-editor-node-label-line-height);
    }

    .caption {
        display: -webkit-box;
        width: 100%;
        overflow: hidden;
        color: color-mix(in srgb, var(--c) 54%, var(--node-editor-text));
        font-size: var(--node-editor-node-caption-size);
        line-height: var(--node-editor-node-caption-line-height);
        overflow-wrap: anywhere;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: var(--node-caption-max-lines);
        line-clamp: var(--node-caption-max-lines);
        white-space: normal;
    }

    .badge-wrap {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: none;
    }
    .top-badge-wrap { top: -22px; }
    .bottom-badge-wrap { bottom: -22px; }

    .badge {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.06em;
        padding: 2px 6px;
        border-radius: var(--node-editor-radius-sm);
        white-space: nowrap;
        box-shadow: var(--node-editor-badge-shadow);
    }
    .root-badge {
        background: var(--node-editor-root-badge-bg);
        color: var(--node-editor-root-badge-color);
        border: 1px solid var(--node-editor-root-badge-color);
    }

    .leaf-badge {
        background: var(--node-editor-leaf-badge-bg);
        color: var(--node-editor-leaf-badge-color);
        border: 1px solid var(--node-editor-leaf-badge-color);
    }

</style>
