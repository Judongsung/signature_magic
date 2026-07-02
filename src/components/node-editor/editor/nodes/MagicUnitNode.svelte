<script lang="ts">
    import {
        type MagicNodeData,
    } from '../../../../systems/graph/magicGraphTypes';
    import {
        MAGIC_NODE_KINDS,
        MAGIC_NODE_RENDERING_CONFIG,
    } from '../../../../constants/graphConfigs';
    import { NODE_EDITOR_TEXT } from '../../../../constants/uiText';
    import { getMagicTypeConfig } from '../../../../systems/graph/registry/magicTypeRegistry';
    import {
        resolveMagicNodeCaption,
        resolveMagicNodeLabel,
    } from '../../../../systems/graph/model/magicNodeData';
    import { resolveMagicControlPairNodePresentation } from '../../../../systems/graph/presentation/magicControlPairPresentation';
    import { isCircleSystemMagicNodeData } from '../../../../systems/graph/model/circleSystemMagicNodes';
    import {
        isMagicCircleConnectionJoinData,
    } from '../../../../systems/graph/model/magicCircleConnectionNodes';
    import DescriptionTooltip from '../../../shared/DescriptionTooltip.svelte';
    import MagicNodeTooltipStats from '../MagicNodeTooltipStats.svelte';
    import { useNodeEditorDetails } from '../details/nodeDetailsContext';
    import {
        useMagicGraphRenderContext,
    } from '../../rendering/magicGraphRenderContext';

    let {
        id,
        data,
        parentId,
        draggable = true,
    }: {
        id: string;
        data: MagicNodeData;
        parentId?: string;
        draggable?: boolean;
    } = $props();

    const nodeConfig = $derived(getMagicTypeConfig(data.magicType));

    const color = $derived(nodeConfig?.color || MAGIC_NODE_RENDERING_CONFIG.FALLBACK_COLOR);
    const icon = $derived(nodeConfig?.icon || MAGIC_NODE_RENDERING_CONFIG.FALLBACK_ICON);
    const renderContext = useMagicGraphRenderContext();
    const isConnectionJoin = $derived(
        isMagicCircleConnectionJoinData(data)
    );
    const connectionJoinSourceCircleId = $derived.by(() => {
        if (!isMagicCircleConnectionJoinData(data)) return undefined;
        return data.connectionJoin.sourceCircleId;
    });
    const defaultLabel = $derived(
        connectionJoinSourceCircleId
            ? renderContext.getCircleTitle(
                connectionJoinSourceCircleId
            ) ?? resolveMagicNodeLabel(data, nodeConfig)
            : resolveMagicNodeLabel(data, nodeConfig)
    );
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
    const isCircleSystemNode = $derived(
        isCircleSystemMagicNodeData(data)
    );
    const isSequenceInsertionBefore = $derived(
        renderContext.sequenceDropPreview?.targetCircleId === parentId &&
        renderContext.sequenceDropPreview?.beforeNodeId === id
    );
    const isSequenceInsertionAfter = $derived(
        renderContext.sequenceDropPreview?.targetCircleId === parentId &&
        renderContext.sequenceDropPreview?.afterNodeId === id
    );
    const nodeStatEffects = $derived(
        data.nodeKind === MAGIC_NODE_KINDS.SYSTEM
            ? []
            : renderContext.nodeStatEffects
    );
    const openDetails = useNodeEditorDetails();

    function openNodeDetails(event: MouseEvent): void {
        event.stopPropagation();
        openDetails?.(id);
    }
</script>

    <div
    class="custom-node sequence-node"
    class:tooltip-host={shouldShowTooltip}
    class:sequence-insertion-before={isSequenceInsertionBefore}
    class:sequence-insertion-after={isSequenceInsertionAfter}
    class:control-pair-end={controlPairPresentation.isEnd}
    class:circle-system-node={isCircleSystemNode && !isConnectionJoin}
    class:connection-join-node={isConnectionJoin}
    aria-describedby={shouldShowTooltip ? tooltipId : undefined}
    style="--c: {color};"
>
    <div class="node-body" class:has-caption={Boolean(caption)}>
        <div class="icon">{icon}</div>
        <div class="label">{label}</div>
        {#if caption}<div class="caption">{caption}</div>{/if}
    </div>

    {#if draggable && openDetails && controlPairPresentation.showDetails && !isConnectionJoin}
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

    {#if nodeConfig && shouldShowTooltip}
        <DescriptionTooltip
            id={tooltipId}
            {description}
        >
            {#if nodeConfig.stats && !isConnectionJoin}
                <MagicNodeTooltipStats
                    stats={nodeConfig.stats}
                    {nodeStatEffects}
                    magicType={nodeConfig.type}
                    nodeCategory={nodeConfig.category}
                    nodeStatBounds={nodeConfig.statBounds}
                    nodeData={data}
                />
            {/if}
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

    .custom-node.circle-system-node {
        border: 2px solid var(--node-editor-manifestation-border);
        box-shadow: var(--node-editor-manifestation-shadow);
    }

    .custom-node.circle-system-node::after {
        border-color: var(--node-editor-manifestation-inner-border);
    }

    .custom-node.connection-join-node {
        border-width: 2px;
        border-style: dashed;
    }

    .custom-node.sequence-insertion-before {
        border-top: 3px solid var(--node-editor-circle-selected);
    }

    .custom-node.sequence-insertion-after {
        border-bottom: 3px solid var(--node-editor-circle-selected);
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

</style>
