<script lang="ts">
    import {
        MAGIC_STAT_CALCULATION_DESCRIPTIONS,
        MAGIC_STAT_LABELS,
    } from '../../../constants/uiText';
    import { MAGIC_STAT_KEYS, type MagicStats } from '../../../types/magic';
    import { formatMagicStat } from '../../../systems/graph/presentation/magicStatFormatting';
    import DescriptionTooltip from '../../shared/DescriptionTooltip.svelte';

    let {
        stats,
        ariaLabel,
        total = false,
    }: {
        stats: MagicStats;
        ariaLabel: string;
        total?: boolean;
    } = $props();

    const statsGridId = $props.id();
</script>

<dl class="stats-grid" class:total-stats-grid={total} aria-label={ariaLabel}>
    {#each MAGIC_STAT_KEYS as statKey}
        {@const tooltipId = `${statsGridId}-${statKey}-calculation-tooltip`}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex (계산식 툴팁에 키보드로 접근할 수 있게 한다.) -->
        <div
            class="stat-item tooltip-host"
            class:total-stat-item={total}
            tabindex="0"
            aria-describedby={tooltipId}
        >
            <dt>
                {MAGIC_STAT_LABELS[statKey]}
                <DescriptionTooltip
                    id={tooltipId}
                    description={MAGIC_STAT_CALCULATION_DESCRIPTIONS[total ? 'total' : 'circle'][statKey]}
                    placement="bottom"
                />
            </dt>
            <dd>{formatMagicStat(stats[statKey])}</dd>
        </div>
    {/each}
</dl>

<style>
    .stats-grid {
        width: var(--node-editor-stats-grid-width);
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
        position: relative;
        min-width: 0;
        padding: 7px 8px;
        border: 1px solid var(--node-editor-stats-border);
        border-radius: var(--node-editor-radius-sm);
        background: var(--node-editor-stats-bg);
        box-shadow: var(--node-editor-stat-inset-highlight);
    }

    .stat-item:focus-visible {
        outline: 2px solid var(--node-editor-starlight);
        outline-offset: 2px;
    }

    .total-stat-item {
        background: var(--node-editor-stats-total-bg);
        border-color: var(--node-editor-stats-total-border);
    }

    .stat-item dt {
        color: var(--node-editor-stats-label);
        font-size: 10px;
        line-height: 1.2;
        white-space: nowrap;
        letter-spacing: 0.03em;
    }

    .stat-item dd {
        margin: 2px 0 0;
        color: var(--node-editor-text-strong);
        font-size: 15px;
        font-weight: 700;
        line-height: 1.15;
        font-variant-numeric: tabular-nums;
    }

    @media (max-width: 520px) {
        .total-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }
</style>
