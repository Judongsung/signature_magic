<script lang="ts">
    import { CYOA_REGISTRATION_RESULT_TEXT } from '../../../constants/uiText';
    import { graphStore } from '../../../stores/graphStore.svelte';
    import MagicCircleCompositionPreview from '../../node-editor/MagicCircleCompositionPreview.svelte';
    import MagicGraphResultPreview from '../../node-editor/MagicGraphResultPreview.svelte';
    import MagicStatsGrid from '../../node-editor/MagicStatsGrid.svelte';
</script>

<section class="registration-result-details" aria-label={CYOA_REGISTRATION_RESULT_TEXT.ARIA_LABEL}>
    <article class="result-section">
        <h3>{CYOA_REGISTRATION_RESULT_TEXT.GRAPH_TITLE}</h3>
        <MagicGraphResultPreview nodes={graphStore.nodes} edges={graphStore.edges} />
    </article>

    <article class="result-section">
        <h3>{CYOA_REGISTRATION_RESULT_TEXT.CIRCLES_TITLE}</h3>
        <MagicCircleCompositionPreview circles={graphStore.circles} />
    </article>

    <article class="result-section">
        <h3>{CYOA_REGISTRATION_RESULT_TEXT.TOTAL_STATS_TITLE}</h3>
        {#if graphStore.circles.length > 0}
            <MagicStatsGrid
                stats={graphStore.totalStats}
                ariaLabel={CYOA_REGISTRATION_RESULT_TEXT.TOTAL_STATS_ARIA_LABEL}
                total
            />
        {:else}
            <p class="result-empty">{CYOA_REGISTRATION_RESULT_TEXT.EMPTY_STATS}</p>
        {/if}
    </article>
</section>

<style>
    .registration-result-details {
        width: min(900px, 100%);
        display: flex;
        flex-direction: column;
        gap: 18px;
        color: var(--node-editor-text);
    }

    .result-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 18px;
        border: 1px solid var(--node-editor-border);
        border-radius: var(--node-editor-radius-md);
        background: var(--node-editor-panel-bg);
        box-shadow: var(--node-editor-panel-shadow);
        box-sizing: border-box;
    }

    .result-section h3 {
        margin: 0;
        color: var(--node-editor-text-strong);
        font-family: var(--font-title);
        font-size: 15px;
        line-height: 1.25;
        letter-spacing: 0;
    }

    .result-empty {
        margin: 0;
        padding: 14px;
        border: 1px solid var(--node-editor-stats-border);
        border-radius: var(--node-editor-radius-sm);
        background: var(--node-editor-stats-bg);
        color: var(--node-editor-muted-strong);
        font-size: 13px;
        line-height: 1.45;
    }

    @media (max-width: 720px) {
        .result-section {
            padding: 12px;
        }
    }
</style>
