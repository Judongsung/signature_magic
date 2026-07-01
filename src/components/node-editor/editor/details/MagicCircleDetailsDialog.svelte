<script lang="ts">
    import { untrack } from 'svelte';
    import { MAGIC_CIRCLE_METADATA_CONFIG } from '../../../../constants/nodeEditorConfigs';
    import { NODE_EDITOR_TEXT } from '../../../../constants/uiText';
    import {
        EMPTY_MAGIC_STATS,
    } from '../../../../types/magicStats';
    import {
        type CirclePath,
    } from '../../../../systems/graph/calculation/magicCalculationTypes';
    import {
        type MagicCircleMetadata,
        type MagicCircleNode,
    } from '../../../../systems/graph/magicGraphTypes';
    import DialogShell from '../../../shared/DialogShell.svelte';
    import MagicStatsGrid from '../../magic-circle/MagicStatsGrid.svelte';

    const dialogId = $props.id();
    const dialogTitleId = `${dialogId}-circle-details-title`;
    const dialogDescriptionId = `${dialogId}-circle-details-caption`;
    const formId = `${dialogId}-circle-details-form`;

    let {
        circle,
        circlePath,
        displayOrder,
        onSave,
        onDelete,
        onClose,
    }: {
        circle: MagicCircleNode;
        circlePath?: CirclePath;
        displayOrder?: number;
        onSave: (metadata: MagicCircleMetadata) => void;
        onDelete: () => void;
        onClose: () => void;
    } = $props();

    let name = $state(untrack(() => circle.data.name ?? ''));
    let caption = $state(untrack(() => circle.data.caption ?? ''));
    const fallbackTitle = $derived(
        `${NODE_EDITOR_TEXT.CIRCLE_TITLE} ${displayOrder ?? '—'}`
    );
    const displayTitle = $derived(circle.data.name || fallbackTitle);

    function saveMetadata(event: SubmitEvent): void {
        event.preventDefault();
        onSave({ name, caption });
    }
</script>

<DialogShell
    titleId={dialogTitleId}
    descriptionId={dialogDescriptionId}
    closeLabel={NODE_EDITOR_TEXT.CIRCLE_DETAILS_DIALOG_CLOSE_ARIA_LABEL}
    {onClose}
    overlayClass="circle-details-overlay"
    backdropClass="circle-details-backdrop"
    surfaceClass="circle-details-dialog"
>
        <header class="circle-details-header">
            <div>
                <p>{NODE_EDITOR_TEXT.CIRCLE_DETAILS_DIALOG_TITLE}</p>
                <h2 id={dialogTitleId}>{displayTitle}</h2>
            </div>
        </header>

        <form
            id={formId}
            class="circle-details-form"
            onsubmit={saveMetadata}
        >
            <label>
                <span>{NODE_EDITOR_TEXT.CIRCLE_DETAILS_NAME_LABEL}</span>
                <input
                    type="text"
                    maxlength={MAGIC_CIRCLE_METADATA_CONFIG.NAME_MAX_LENGTH}
                    placeholder={NODE_EDITOR_TEXT.CIRCLE_DETAILS_NAME_PLACEHOLDER}
                    bind:value={name}
                />
            </label>

            <label>
                <span>{NODE_EDITOR_TEXT.CIRCLE_DETAILS_CAPTION_LABEL}</span>
                <textarea
                    id={dialogDescriptionId}
                    maxlength={MAGIC_CIRCLE_METADATA_CONFIG.CAPTION_MAX_LENGTH}
                    placeholder={NODE_EDITOR_TEXT.CIRCLE_DETAILS_CAPTION_PLACEHOLDER}
                    bind:value={caption}
                ></textarea>
            </label>

            <section class="circle-details-stats">
                <h3>{NODE_EDITOR_TEXT.CIRCLE_DETAILS_STATS_LABEL}</h3>
                <MagicStatsGrid
                    stats={circlePath?.stats ?? EMPTY_MAGIC_STATS}
                    adjustments={circlePath?.statAdjustments ?? EMPTY_MAGIC_STATS}
                    ariaLabel={NODE_EDITOR_TEXT.CIRCLE_DETAILS_STATS_ARIA_LABEL}
                />
            </section>
        </form>

        <footer class="circle-details-actions">
            <button
                type="button"
                class="circle-details-delete node-editor-action-btn node-editor-action-btn--danger"
                onclick={onDelete}
            >
                {NODE_EDITOR_TEXT.DETAILS_DELETE}
            </button>
            <button
                type="button"
                class="node-editor-action-btn node-editor-action-btn--secondary"
                onclick={onClose}
            >
                {NODE_EDITOR_TEXT.NODE_DETAILS_CANCEL}
            </button>
            <button
                type="submit"
                form={formId}
                class="node-editor-action-btn node-editor-action-btn--primary"
            >
                {NODE_EDITOR_TEXT.NODE_DETAILS_SAVE}
            </button>
        </footer>
</DialogShell>

<style>
    :global(.circle-details-overlay) {
        z-index: 140;
        align-items: center;
        padding: 18px;
    }

    :global(.circle-details-backdrop) {
        background: rgba(2, 3, 10, 0.78);
        backdrop-filter: blur(5px);
    }

    :global(.circle-details-dialog) {
        width: min(460px, 100%);
        max-height: calc(100vh - 36px);
        overflow-y: auto;
        border: 1px solid var(--node-editor-border);
        border-radius: var(--node-editor-radius-md);
        background: var(--node-editor-panel-bg);
        color: var(--node-editor-text);
        box-shadow: var(--node-editor-panel-shadow);
    }

    .circle-details-header {
        padding: 18px 20px;
        border-bottom: 1px solid var(--node-editor-divider);
    }

    .circle-details-header p,
    .circle-details-header h2,
    .circle-details-stats h3 {
        margin: 0;
    }

    .circle-details-header p {
        color: var(--node-editor-preview-section-label);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .circle-details-header h2 {
        margin-top: 4px;
        color: var(--node-editor-text-strong);
        font-family: var(--font-title);
        font-size: 20px;
    }

    .circle-details-form {
        display: grid;
        gap: 16px;
        padding: 18px 20px;
    }

    .circle-details-form label,
    .circle-details-stats {
        display: grid;
        gap: 7px;
    }

    .circle-details-form label > span,
    .circle-details-stats h3 {
        color: var(--node-editor-stats-label);
        font-size: 11px;
        font-weight: 800;
    }

    .circle-details-form input,
    .circle-details-form textarea {
        width: 100%;
        min-width: 0;
        padding: 9px 10px;
        border: 1px solid var(--node-editor-button-border);
        border-radius: var(--node-editor-radius-sm);
        background: var(--node-editor-button-bg);
        color: var(--node-editor-text-strong);
        font: inherit;
        box-sizing: border-box;
    }

    .circle-details-form textarea {
        min-height: 88px;
        resize: vertical;
    }

    .circle-details-form input:focus-visible,
    .circle-details-form textarea:focus-visible {
        outline: 2px solid var(--node-editor-starlight);
        outline-offset: 2px;
    }

    .circle-details-stats :global(.stats-grid) {
        width: 100%;
    }

    .circle-details-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 14px 20px 18px;
        border-top: 1px solid var(--node-editor-divider);
    }

    .circle-details-actions button {
        min-width: 76px;
        min-height: 38px;
        padding: 8px 14px;
    }

    .circle-details-delete {
        margin-right: auto;
    }
</style>
