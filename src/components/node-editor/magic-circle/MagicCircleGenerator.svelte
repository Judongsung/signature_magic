<script lang="ts">
    import { graphStore } from '../../../stores/graphStore.svelte';
    import {
        MAGIC_CIRCLE_ANIMATION_MODES,
        type MagicCircleAnimationMode,
    } from '../../../constants/magicCircleConfigs';
    import { MAGIC_CIRCLE_TEXT } from '../../../constants/uiText';
    import {
        buildMagicCircleRenderModels,
    } from '../../../systems/graph/presentation/magicCircleRenderer';
    import MagicCircleCard from './MagicCircleCard.svelte';
    import MagicStatsGrid from './MagicStatsGrid.svelte';

    let {
        animationMode = MAGIC_CIRCLE_ANIMATION_MODES.STATIC,
    }: {
        animationMode?: MagicCircleAnimationMode;
    } = $props();

    let renderCircles = $state(buildMagicCircleRenderModels(graphStore.circles));
    let renderModelFrame: number | undefined;

    $effect(() => {
        const circles = graphStore.circles;

        if (typeof requestAnimationFrame !== 'function') {
            renderCircles = buildMagicCircleRenderModels(circles);
            return;
        }

        if (renderModelFrame !== undefined) cancelAnimationFrame(renderModelFrame);
        renderModelFrame = requestAnimationFrame(() => {
            renderModelFrame = undefined;
            renderCircles = buildMagicCircleRenderModels(circles);
        });

        return () => {
            if (renderModelFrame === undefined) return;

            cancelAnimationFrame(renderModelFrame);
            renderModelFrame = undefined;
        };
    });
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
            <MagicCircleCard {circle} index={ci} {animationMode} />
        {/each}
    </div>
</div>

<style>
    .generator-container {
        height: 100%;
        width: 100%;
        background: var(--node-editor-preview-bg);
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        position: relative;
    }

    .header {
        padding: 18px 20px 12px;
        border-bottom: 1px solid var(--node-editor-preview-border);
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: var(--node-editor-panel-bg);
        box-shadow: var(--node-editor-toolbar-shadow);
    }

    .circle-count {
        display: flex;
        align-items: baseline;
        gap: 8px;
        color: var(--node-editor-text);
    }

    .count-number {
        font-size: 32px;
        font-weight: 800;
        background: var(--node-editor-preview-count-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .count-label {
        font-size: 14px;
        color: var(--node-editor-preview-label);
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .hint {
        font-size: 13px;
        color: var(--node-editor-preview-empty);
        line-height: 1.45;
    }

    .total-stats {
        display: flex;
        flex-direction: column;
        gap: 7px;
    }

    .total-stats-label {
        color: var(--node-editor-preview-section-label);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .circles-grid {
        padding: 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: center;
        align-items: flex-start;
    }

    @media (max-width: 900px) {
        .circles-grid {
            justify-content: flex-start;
            overflow-x: auto;
            flex-wrap: nowrap;
        }
    }

</style>
