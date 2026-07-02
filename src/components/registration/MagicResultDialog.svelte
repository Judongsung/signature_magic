<script lang="ts">
    import { MAGIC_RESULT_TEXT } from '../../constants/uiText';
    import { graphStore } from '../../stores/graphStore.svelte';
    import { exportBuildResultImage } from '../../systems/export/buildResultImageExport';
    import {
        buildMagicGraphResultPreview,
    } from '../../systems/graph/presentation/magicGraphResultPreview';
    import DialogShell from '../shared/DialogShell.svelte';
    import RegistrationResultDetails from './RegistrationResultDetails.svelte';

    const dialogId = $props.id();
    const dialogTitleId = `${dialogId}-magic-result-title`;

    let {
        onClose,
    }: {
        onClose: () => void;
    } = $props();

    let resultElement: HTMLDivElement | undefined;
    let isExporting = $state(false);
    let exportFailed = $state(false);

    async function exportMagicResult(): Promise<void> {
        if (!resultElement || isExporting) return;

        isExporting = true;
        exportFailed = false;

        try {
            const graphPreview = buildMagicGraphResultPreview(
                graphStore.nodes,
                graphStore.edges
            );
            await exportBuildResultImage(resultElement, graphPreview);
        } catch {
            exportFailed = true;
        } finally {
            isExporting = false;
        }
    }
</script>

<DialogShell
    titleId={dialogTitleId}
    closeLabel={MAGIC_RESULT_TEXT.CLOSE_ARIA_LABEL}
    {onClose}
    overlayClass="magic-result-dialog-overlay"
    backdropClass="magic-result-dialog-backdrop"
    surfaceClass="magic-result-dialog"
>
    <h2 id={dialogTitleId} class="dialog-accessible-title">
        {MAGIC_RESULT_TEXT.TITLE}
    </h2>

    <div bind:this={resultElement} class="magic-result-export-content">
        <RegistrationResultDetails />
    </div>

    {#if exportFailed}
        <p class="export-error" role="alert">{MAGIC_RESULT_TEXT.EXPORT_PNG_ERROR}</p>
    {/if}

    <div class="result-actions">
        <button
            type="button"
            class="result-action result-action--secondary"
            onclick={onClose}
        >
            {MAGIC_RESULT_TEXT.CLOSE_LABEL}
        </button>
        <button
            type="button"
            class="result-action result-action--primary"
            disabled={isExporting}
            aria-busy={isExporting}
            onclick={exportMagicResult}
        >
            {isExporting
                ? MAGIC_RESULT_TEXT.EXPORT_PNG_PENDING_LABEL
                : MAGIC_RESULT_TEXT.EXPORT_PNG_LABEL}
        </button>
    </div>
</DialogShell>

<style>
    :global(.magic-result-dialog-overlay) {
        z-index: 125;
        align-items: flex-start;
        padding: 32px 18px 42px;
        overflow-y: auto;
    }

    :global(.magic-result-dialog-backdrop) {
        background: rgba(2, 4, 10, 0.82);
        backdrop-filter: blur(5px);
    }

    :global(.magic-result-dialog) {
        width: min(948px, 100%);
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-sizing: border-box;
    }

    .dialog-accessible-title {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
    }

    .magic-result-export-content {
        width: 100%;
        padding: 24px;
        border-radius: var(--node-editor-radius-md);
        background: var(--node-editor-app-bg);
        box-sizing: border-box;
    }

    .result-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }

    .result-action {
        min-width: 148px;
        min-height: 44px;
        border-radius: 3px;
        font-family: var(--font-title);
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
    }

    .result-action--primary {
        border: 1px solid var(--guild-leather);
        background: var(--guild-action-primary-bg);
        color: var(--guild-action-text);
        box-shadow: var(--guild-action-primary-shadow);
    }

    .result-action--secondary {
        border: 1px solid var(--guild-action-secondary-border);
        background: var(--guild-action-secondary-bg);
        color: var(--guild-action-secondary-text);
        box-shadow: var(--guild-action-secondary-shadow);
    }

    .result-action:hover:not(:disabled) {
        transform: translateY(-1px);
    }

    .result-action--primary:hover:not(:disabled) {
        background: var(--guild-action-primary-hover-bg);
        box-shadow: var(--guild-action-primary-hover-shadow);
    }

    .result-action--secondary:hover:not(:disabled) {
        background: var(--guild-action-secondary-hover-bg);
        box-shadow: var(--guild-action-secondary-hover-shadow);
    }

    .result-action:focus-visible {
        outline: 2px solid var(--guild-brass);
        outline-offset: 2px;
    }

    .result-action:disabled {
        cursor: wait;
        opacity: 0.58;
    }

    .export-error {
        margin: 0;
        color: #ffb0b0;
        font-size: 13px;
        font-weight: 800;
        text-align: right;
    }

    @media (max-width: 720px) {
        :global(.magic-result-dialog-overlay) {
            padding: 16px 10px 24px;
        }

        .magic-result-export-content {
            padding: 12px;
        }

        .result-actions {
            flex-direction: column-reverse;
        }

        .result-action {
            width: 100%;
        }
    }
</style>
