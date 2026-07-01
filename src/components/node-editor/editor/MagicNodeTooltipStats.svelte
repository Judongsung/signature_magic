<script lang="ts">
    import { MAGIC_STAT_LABELS, NODE_EDITOR_TEXT } from '../../../constants/uiText';
    import {
        EMPTY_MAGIC_STATS,
        MAGIC_STAT_KEYS,
        type MagicNodeStatBoundsConfig,
        type MagicStatsConfig,
    } from '../../../types/magicStats';
    import {
        type MagicNodeKind,
    } from '../../../systems/graph/magicGraphTypes';
    import {
        type MagicStatEffectConfig,
    } from '../../../types/magicStatEffects';
    import {
        type MagicNodeSettings,
        type MagicType,
    } from '../../../types/magicTypeConfig';
    import type { MagicNodeCategory } from '../../../constants/nodeEditorConfigs';
    import {
        applyMagicStatEffects,
        filterMagicStatEffectsForNode,
    } from '../../../systems/graph/calculation/magicStatEffects';
    import { MAGIC_STAT_RULES } from '../../../systems/graph/calculation/magicStatRules';
    import {
        formatMagicStat,
        formatMagicStatAdjustment,
    } from '../../../systems/graph/presentation/magicStatFormatting';
    import { applyMagicNodeWeightToStat } from '../../../systems/graph/model/magicNodeWeight';

    let {
        stats,
        nodeStatEffects = [],
        magicType,
        nodeCategory,
        nodeStatBounds,
        nodeData,
    }: {
        stats?: MagicStatsConfig;
        nodeStatEffects?: readonly MagicStatEffectConfig[];
        magicType?: MagicType;
        nodeCategory?: MagicNodeCategory;
        nodeStatBounds?: MagicNodeStatBoundsConfig;
        nodeData?: {
            settings?: Readonly<MagicNodeSettings>;
            nodeKind?: MagicNodeKind;
        };
    } = $props();

    const applicableNodeStatEffects = $derived(filterMagicStatEffectsForNode(
        nodeStatEffects,
        magicType && nodeCategory
            ? {
                magicType,
                category: nodeCategory,
                stats,
            }
            : undefined
    ));
    const tooltipStats = $derived(MAGIC_STAT_KEYS.map((statKey) => {
        const baseValue = stats?.[statKey] ?? EMPTY_MAGIC_STATS[statKey];
        const boundedValue = MAGIC_STAT_RULES[statKey].clampNodeValue(
            applyMagicStatEffects(baseValue, statKey, applicableNodeStatEffects),
            nodeStatBounds
        );
        const adjustedValue = nodeData
            ? applyMagicNodeWeightToStat(
                boundedValue,
                statKey,
                nodeData,
                magicType && nodeCategory
                    ? { type: magicType, category: nodeCategory }
                    : undefined
            )
            : boundedValue;

        return {
            key: statKey,
            label: MAGIC_STAT_LABELS[statKey],
            value: formatMagicStat(adjustedValue),
            adjustment: formatMagicStatAdjustment(adjustedValue - baseValue),
        };
    }));
</script>

<span class="node-tooltip-stats" aria-label={NODE_EDITOR_TEXT.NODE_STATS_ARIA_LABEL}>
    {#each tooltipStats as stat}
        <span class="node-tooltip-stat">
            <span class="node-tooltip-stat-label">{stat.label}</span>
            <span class="node-tooltip-stat-value">
                {stat.value}{#if stat.adjustment}<span class="stat-adjustment">({stat.adjustment})</span>{/if}
            </span>
        </span>
    {/each}
</span>

<style>
    .node-tooltip-stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 5px;
        min-width: 218px;
    }

    .node-tooltip-stat {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-width: 0;
        padding: 5px 6px;
        border: 1px solid var(--node-editor-stats-border);
        border-radius: var(--node-editor-radius-sm);
        background: var(--node-editor-stats-bg);
        box-shadow: var(--node-editor-stat-inset-highlight);
    }

    .node-tooltip-stat-label {
        min-width: 0;
        color: var(--node-editor-stats-label);
        font-size: 9px;
        line-height: 1.15;
        white-space: nowrap;
    }

    .node-tooltip-stat-value {
        color: var(--node-editor-text-strong);
        font-size: 11px;
        font-weight: 800;
        line-height: 1;
        font-variant-numeric: tabular-nums;
    }

    .stat-adjustment {
        color: var(--node-editor-accent);
        font-size: 9px;
    }
</style>
