<script lang="ts">
    import { MAGIC_STAT_LABELS, NODE_EDITOR_TEXT } from '../../constants/uiText';
    import {
        EMPTY_MAGIC_STATS,
        MAGIC_STAT_KEYS,
        type MagicStatsConfig,
    } from '../../types/magic';
    import { formatMagicStat } from '../../systems/graph/presentation/magicStatFormatting';

    let {
        stats,
    }: {
        stats?: MagicStatsConfig;
    } = $props();

    const tooltipStats = $derived(MAGIC_STAT_KEYS.map((statKey) => ({
        key: statKey,
        label: MAGIC_STAT_LABELS[statKey],
        value: formatMagicStat(stats?.[statKey] ?? EMPTY_MAGIC_STATS[statKey]),
    })));
</script>

<span class="node-tooltip-stats" aria-label={NODE_EDITOR_TEXT.NODE_STATS_ARIA_LABEL}>
    {#each tooltipStats as stat}
        <span class="node-tooltip-stat">
            <span class="node-tooltip-stat-label">{stat.label}</span>
            <span class="node-tooltip-stat-value">{stat.value}</span>
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
</style>
