<script lang="ts">
    import { CYOA_REGISTRATION_RESULT_TEXT } from '../../constants/uiText';
    import { graphStore } from '../../stores/graphStore.svelte';
    import MagicCircleCompositionPreview from '../node-editor/result-preview/MagicCircleCompositionPreview.svelte';
    import MagicGraphResultPreview from '../node-editor/result-preview/MagicGraphResultPreview.svelte';
    import MagicStatsGrid from '../node-editor/magic-circle/MagicStatsGrid.svelte';

    const signatureName = $derived(
        graphStore.signatureMetadata.name.trim() || CYOA_REGISTRATION_RESULT_TEXT.EMPTY_SIGNATURE_NAME
    );
    const signatureDescription = $derived(
        graphStore.signatureMetadata.description.trim() ||
            CYOA_REGISTRATION_RESULT_TEXT.EMPTY_SIGNATURE_DESCRIPTION
    );
</script>

<section class="registration-result-details" aria-label={CYOA_REGISTRATION_RESULT_TEXT.ARIA_LABEL}>
    <article class="result-section">
        <h3>{CYOA_REGISTRATION_RESULT_TEXT.SIGNATURE_TITLE}</h3>
        <dl class="signature-metadata">
            <div>
                <dt>{CYOA_REGISTRATION_RESULT_TEXT.SIGNATURE_NAME_LABEL}</dt>
                <dd>{signatureName}</dd>
            </div>
            <div>
                <dt>{CYOA_REGISTRATION_RESULT_TEXT.SIGNATURE_DESCRIPTION_LABEL}</dt>
                <dd class="signature-description">{signatureDescription}</dd>
            </div>
        </dl>
    </article>

    <article class="result-section">
        <h3>{CYOA_REGISTRATION_RESULT_TEXT.GRAPH_TITLE}</h3>
        <MagicGraphResultPreview
            nodes={graphStore.nodes}
            edges={graphStore.edges}
            circleStates={graphStore.circleStates}
        />
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
                adjustments={graphStore.totalStatAdjustments}
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

    .signature-metadata {
        margin: 0;
        display: grid;
        gap: 10px;
    }

    .signature-metadata div {
        display: grid;
        gap: 5px;
        padding: 12px;
        border: 1px solid var(--node-editor-stats-border);
        border-radius: var(--node-editor-radius-sm);
        background: var(--node-editor-stats-bg);
    }

    .signature-metadata dt,
    .signature-metadata dd {
        margin: 0;
    }

    .signature-metadata dt {
        color: var(--node-editor-preview-section-label);
        font-size: 11px;
        font-weight: 800;
    }

    .signature-metadata dd {
        color: var(--node-editor-text);
        font-size: 13px;
        line-height: 1.45;
    }

    .signature-description {
        white-space: pre-wrap;
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
