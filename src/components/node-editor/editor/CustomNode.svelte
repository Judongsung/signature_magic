<script lang="ts">
    import { tick } from 'svelte';
    import { Handle, Position, useUpdateNodeInternals } from '@xyflow/svelte';
    import {
        type MagicNodeData,
    } from '../../../types/magic';
    import {
        MAGIC_NODE_HANDLE_CONFIG,
        MAGIC_NODE_RENDERING_CONFIG,
    } from '../../../constants/graphConfigs';
    import { NODE_EDITOR_TEXT } from '../../../constants/uiText';
    import { getMagicTypeConfig } from '../../../systems/graph/registry/magicTypeRegistry';
    import DescriptionTooltip from '../../shared/DescriptionTooltip.svelte';
    import MagicNodeTooltipStats from './MagicNodeTooltipStats.svelte';

    let {
        id,
        data,
        isConnectable,
    }: {
        id: string;
        data: MagicNodeData;
        isConnectable?: boolean;
    } = $props();

    const nodeConfig = $derived(getMagicTypeConfig(data.magicType));

    const color = $derived(nodeConfig?.color || MAGIC_NODE_RENDERING_CONFIG.FALLBACK_COLOR);
    const icon = $derived(nodeConfig?.icon || MAGIC_NODE_RENDERING_CONFIG.FALLBACK_ICON);
    const label  = $derived(nodeConfig?.label || data.magicType);
    const description = $derived(nodeConfig?.description || '');
    const tooltipId = $derived(`canvas-node-tooltip-${id}`);
    const shouldShowTooltip = $derived(data.showTooltip !== false);
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

    $effect(() => {
        inputHandleCount;
        outputHandleCount;
        cycleInputHandleIndex;
        cycleInputHandleConnected;
        void tick().then(() => updateNodeInternals(id));
    });

    function createHandleIndexes(count: number): number[] {
        return Array.from({ length: Math.max(0, count) }, (_, index) => index);
    }

    function handleLeft(index: number, count: number): string {
        if (count <= 1) return MAGIC_NODE_RENDERING_CONFIG.SINGLE_HANDLE_LEFT;
        const offset = index * (
            MAGIC_NODE_RENDERING_CONFIG.HANDLE_SPREAD_PERCENT / (count - 1)
        );

        return `${MAGIC_NODE_RENDERING_CONFIG.HANDLE_SPREAD_START_PERCENT + offset}%`;
    }

    function isCycleInputHandle(index: number): boolean {
        return cycleInputHandleIndex === index;
    }

    function isInputHandleConnectable(index: number): boolean | undefined {
        return isCycleInputHandle(index) && cycleInputHandleConnected
            ? false
            : isConnectable;
    }
</script>

<div
    class="custom-node"
    class:tooltip-host={shouldShowTooltip}
    class:is-root={isRoot}
    class:is-leaf={isLeaf}
    aria-describedby={shouldShowTooltip ? tooltipId : undefined}
    style="--c: {color};"
>
    <!--
        SOURCE handle (출력, 상단)
        isLeaf = 아직 아무데도 연결 안 한 노드 → 상단에 END 배지 표시
        연결을 생성하면 isLeaf=false가 되어 이 배지가 사라집니다.
    -->
    <div class="badge-wrap top-badge-wrap">
        {#if isLeaf}<span class="badge leaf-badge">{NODE_EDITOR_TEXT.LEAF_BADGE}</span>{/if}
    </div>
    {#each outputHandles as index}
        <Handle
            type="source"
            position={Position.Top}
            id={`${MAGIC_NODE_HANDLE_CONFIG.OUTPUT_PREFIX}-${index}`}
            isConnectable={isConnectable}
            class="node-handle source-handle"
            style={`left: ${handleLeft(index, outputHandleCount)}; --handle-color: ${color};`}
        />
    {/each}

    <div class="node-body">
        <div class="icon">{icon}</div>
        <div class="label">{label}</div>
    </div>

    <!--
        TARGET handle (입력, 하단)
        isRoot = 아직 아무도 연결 안 한 노드 → 하단에 START 배지 표시
        연결이 도착하면 isRoot=false가 되어 이 배지가 사라집니다.
    -->
    {#each inputHandles as index}
        <Handle
            type="target"
            position={Position.Bottom}
            id={`${MAGIC_NODE_HANDLE_CONFIG.INPUT_PREFIX}-${index}`}
            isConnectable={isInputHandleConnectable(index)}
            class={`node-handle target-handle ${isCycleInputHandle(index) ? 'cycle-input-handle' : ''}`}
            style={`left: ${handleLeft(index, inputHandleCount)}; --handle-color: ${color};`}
        />
        {#if isCycleInputHandle(index)}
            <span
                class="badge cycle-badge"
                style={`left: ${handleLeft(index, inputHandleCount)}; --handle-color: ${color};`}
            >
                {NODE_EDITOR_TEXT.CYCLE_BADGE}
            </span>
        {/if}
    {/each}
    <div class="badge-wrap bottom-badge-wrap">
        {#if isRoot}<span class="badge root-badge">{NODE_EDITOR_TEXT.ROOT_BADGE}</span>{/if}
    </div>

    {#if nodeConfig && shouldShowTooltip}
        <DescriptionTooltip
            id={tooltipId}
            {description}
        >
            <MagicNodeTooltipStats stats={nodeConfig.stats} />
        </DescriptionTooltip>
    {/if}
</div>

<style>
    .custom-node {
        --c: var(--node-editor-node-fallback-color);
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

    .custom-node.is-root {
        border-bottom-color: var(--c);
    }

    .custom-node.is-leaf {
        border-top-color: var(--c);
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
        top: -6px;
    }

    :global(.target-handle) {
        bottom: -6px;
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

    .cycle-badge {
        position: absolute;
        bottom: -28px;
        transform: translateX(-50%);
        z-index: 2;
        background: color-mix(in srgb, var(--handle-color) 18%, var(--node-editor-root-badge-bg));
        color: color-mix(in srgb, var(--handle-color) 72%, var(--node-editor-text-strong));
        border: 1px solid color-mix(in srgb, var(--handle-color) 74%, var(--node-editor-root-badge-color));
        pointer-events: none;
    }

</style>
