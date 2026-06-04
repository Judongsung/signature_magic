<script lang="ts">
    import { MAGIC_STAT_KEYS, MAGIC_STAT_LABELS, type MagicStats } from '../../types/magic';
    import { formatMagicStat } from '../../systems/graph/magicStatFormatting';

    let {
        stats,
        ariaLabel,
        total = false,
    }: {
        stats: MagicStats;
        ariaLabel: string;
        total?: boolean;
    } = $props();
</script>

<dl class="stats-grid" class:total-stats-grid={total} aria-label={ariaLabel}>
    {#each MAGIC_STAT_KEYS as statKey}
        <div class="stat-item" class:total-stat-item={total}>
            <dt>{MAGIC_STAT_LABELS[statKey]}</dt>
            <dd>{formatMagicStat(stats[statKey])}</dd>
        </div>
    {/each}
</dl>

<style>
    .stats-grid {
        width: 260px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        margin: 2px 0 0;
    }

    .total-stats-grid {
        width: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: 0;
    }

    .stat-item {
        min-width: 0;
        padding: 7px 8px;
        border: 1px solid #182033;
        border-radius: 6px;
        background: rgba(13, 16, 27, 0.72);
    }

    .total-stat-item {
        background: rgba(18, 24, 39, 0.92);
        border-color: #26314a;
    }

    .stat-item dt {
        color: #737c91;
        font-size: 10px;
        line-height: 1.2;
        white-space: nowrap;
    }

    .stat-item dd {
        margin: 2px 0 0;
        color: #e6edf7;
        font-size: 15px;
        font-weight: 700;
        line-height: 1.15;
    }

    @media (max-width: 520px) {
        .total-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }
</style>
