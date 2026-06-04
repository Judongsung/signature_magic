<script lang="ts">
    import { graphStore } from '../../stores/graphStore.svelte';
    import { MAGIC_CIRCLE_TEXT } from '../../constants/uiText';
    import {
        buildMagicCircleRenderModels,
    } from '../../systems/graph/magicCircleRenderer';
    import MagicCircleCard from './MagicCircleCard.svelte';
    import MagicStatsGrid from './MagicStatsGrid.svelte';

    const renderCircles = $derived(buildMagicCircleRenderModels(graphStore.circles));
</script>

<div class="generator-container">
    <div class="header">
        <div class="circle-count">
            {#if graphStore.circles.length === 0}
                <span class="hint">{MAGIC_CIRCLE_TEXT.EMPTY_HINT}</span>
            {:else}
                <span class="count-number">{graphStore.circles.length}</span>
                <span class="count-label">{MAGIC_CIRCLE_TEXT.CIRCLE_COUNT_LABEL}</span>
            {/if}
        </div>
        {#if graphStore.circles.length > 0}
            <section class="total-stats" aria-label={MAGIC_CIRCLE_TEXT.TOTAL_STATS_ARIA_LABEL}>
                <div class="total-stats-label">{MAGIC_CIRCLE_TEXT.TOTAL_STATS_LABEL}</div>
                <MagicStatsGrid
                    stats={graphStore.totalStats}
                    ariaLabel={MAGIC_CIRCLE_TEXT.TOTAL_STATS_ARIA_LABEL}
                    total
                />
            </section>
        {/if}
    </div>

    <div class="circles-grid">
        {#each renderCircles as circle, ci}
            <MagicCircleCard {circle} index={ci} />
        {/each}
    </div>
</div>

<style>
    .generator-container {
        height: 100%;
        width: 100%;
        background: #05060a;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    .header {
        padding: 16px 20px 10px;
        border-bottom: 1px solid #14141e;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .circle-count {
        display: flex;
        align-items: baseline;
        gap: 8px;
        color: #e0e0ff;
    }

    .count-number {
        font-size: 32px;
        font-weight: 800;
        background: linear-gradient(135deg, #b8f4ff, #f0d77e);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .count-label {
        font-size: 14px;
        color: #8b92a4;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .hint {
        font-size: 13px;
        color: #52586b;
    }

    .total-stats {
        display: flex;
        flex-direction: column;
        gap: 7px;
    }

    .total-stats-label {
        color: #7f879b;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.4px;
        text-transform: uppercase;
    }

    .circles-grid {
        padding: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: center;
        align-items: flex-start;
    }

</style>
