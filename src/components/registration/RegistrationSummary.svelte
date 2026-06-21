<script lang="ts">
    import type { Snippet } from 'svelte';
    import { choiceStore } from '../../stores/choiceStore.svelte';
    import {
        CYOA_REGISTRATION_SUMMARY_TEXT,
        UI_BUTTON_TEXT,
    } from '../../constants/uiText';
    import {
        buildCyoaRegistrationSummary,
    } from '../../systems/cyoa/cyoaRegistrationSummary';
    import type {
        CyoaChoiceRowData,
        CyoaInputValues,
        CyoaRowSelections,
        CyoaRowVisibility,
    } from '../../types/cyoa';
    import DescriptionTooltip from '../shared/DescriptionTooltip.svelte';
    import RegistrationSummaryBody from './RegistrationSummaryBody.svelte';
    import RegistrationSummaryFooter from './RegistrationSummaryFooter.svelte';
    import RegistrationSummaryHeader from './RegistrationSummaryHeader.svelte';

    const defaultSummaryId = $props.id();
    const defaultTitleId = `${defaultSummaryId}-registration-summary-title`;

    let {
        rows = choiceStore.rows,
        visibleRowIds = choiceStore.visibleRowIds,
        selectedChoiceIds = choiceStore.selectedChoiceIds,
        inputValues = choiceStore.inputValues,
        onSubmit,
        onBack,
        onExport,
        actionLeadIn,
        supplementalContent,
        submitLabel = UI_BUTTON_TEXT.SUBMIT_REGISTRATION,
        backLabel = CYOA_REGISTRATION_SUMMARY_TEXT.DEFAULT_BACK_LABEL,
        submitDisabled = false,
        titleId = defaultTitleId,
    }: {
        rows?: CyoaChoiceRowData[];
        visibleRowIds?: CyoaRowVisibility;
        selectedChoiceIds?: CyoaRowSelections;
        inputValues?: CyoaInputValues;
        onSubmit?: () => void;
        onBack?: () => void;
        onExport?: (element: HTMLElement) => Promise<void>;
        actionLeadIn?: Snippet;
        supplementalContent?: Snippet;
        submitLabel?: string;
        backLabel?: string;
        submitDisabled?: boolean;
        titleId?: string;
    } = $props();

    let exportContentElement: HTMLDivElement | undefined;
    let isExporting = $state(false);
    let exportFailed = $state(false);

    const summary = $derived(buildCyoaRegistrationSummary({
        rows,
        visibleRowIds,
        selectedChoiceIds,
        inputValues,
    }));
    const submitTooltipId = 'registration-submit-disabled-tooltip';

    async function handleExport() {
        if (!onExport || !exportContentElement || isExporting) return;

        isExporting = true;
        exportFailed = false;

        try {
            await onExport(exportContentElement);
        } catch {
            exportFailed = true;
        } finally {
            isExporting = false;
        }
    }
</script>

<div class="registration-summary-layout">
    <div bind:this={exportContentElement} class="registration-summary-export-content">
        <section class="registration-summary" aria-labelledby={titleId}>
            <RegistrationSummaryHeader {titleId} />
            <RegistrationSummaryBody
                inputItems={summary.inputItems}
                choiceItems={summary.choiceItems}
            />
            <RegistrationSummaryFooter signatureName={summary.signatureName} />
        </section>

        {#if supplementalContent}
            <div class="summary-supplemental">
                {@render supplementalContent()}
            </div>
        {/if}
    </div>

    {#if onBack || onExport || onSubmit}
        {#if actionLeadIn}
            {@render actionLeadIn()}
        {/if}

        {#if exportFailed}
            <p class="export-error" role="alert">
                {CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_ERROR}
            </p>
        {/if}

        <div class="summary-actions">
            {#if onBack}
                <button type="button" class="secondary-action" onclick={onBack}>
                    {backLabel}
                </button>
            {/if}
            {#if onExport}
                <button
                    type="button"
                    class="primary-action export-action"
                    disabled={isExporting}
                    aria-busy={isExporting}
                    onclick={handleExport}
                >
                    {isExporting
                        ? CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_PENDING_LABEL
                        : CYOA_REGISTRATION_SUMMARY_TEXT.EXPORT_PNG_LABEL}
                </button>
            {/if}
            {#if onSubmit}
                <span
                    class="disabled-submit-tooltip-host"
                    class:tooltip-host={submitDisabled}
                >
                    <button
                        type="button"
                        class="primary-action"
                        disabled={submitDisabled}
                        aria-describedby={submitDisabled ? submitTooltipId : undefined}
                        onclick={onSubmit}
                    >
                        {submitLabel}
                    </button>
                    {#if submitDisabled}
                        <DescriptionTooltip
                            id={submitTooltipId}
                            description={UI_BUTTON_TEXT.COMPLETE_REQUIRED_FIELDS_TOOLTIP}
                        />
                    {/if}
                </span>
            {/if}
        </div>
    {/if}
</div>

<style>
    .registration-summary-layout {
        width: min(900px, 100%);
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 18px;
    }

    .registration-summary-export-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 18px;
    }

    .registration-summary {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 28px;
        box-sizing: border-box;
        padding: 56px 46px 44px;
        border: 1px solid var(--guild-paper-border);
        border-radius: 3px;
        background: var(--guild-paper-bg);
        box-shadow: var(--paper-shadow);
        color: var(--guild-ink-black);
        position: relative;
    }

    .registration-summary::before {
        content: '';
        position: absolute;
        inset: 14px;
        border: 1px solid var(--guild-brass);
        outline: 3px double var(--guild-brass);
        outline-offset: -5px;
        pointer-events: none;
        opacity: 0.65;
    }

    .summary-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        flex-wrap: wrap;
    }

    .summary-supplemental {
        width: 100%;
    }

    .export-error {
        margin: 0;
        color: #a32727;
        font-size: 13px;
        font-weight: 700;
        text-align: right;
    }

    .disabled-submit-tooltip-host {
        position: relative;
        display: inline-flex;
    }

    .disabled-submit-tooltip-host:focus-visible {
        outline: 2px solid var(--guild-brass);
        outline-offset: 2px;
    }

    .disabled-submit-tooltip-host.tooltip-host button:disabled {
        pointer-events: none;
    }

    button {
        min-width: 142px;
        height: 44px;
        border-radius: 2px;
        font-family: var(--font-title);
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.4px;
        cursor: pointer;
        transition:
            background 0.16s ease,
            box-shadow 0.16s ease,
            transform 0.16s ease;
    }

    .primary-action {
        border: 1px solid var(--guild-leather);
        background: var(--guild-action-primary-bg);
        color: var(--guild-action-text);
        box-shadow: var(--guild-action-primary-shadow);
    }

    .secondary-action {
        border: 1px solid var(--guild-action-secondary-border);
        background: var(--guild-action-secondary-bg);
        color: var(--guild-action-secondary-text);
        box-shadow: var(--guild-action-secondary-shadow);
    }

    button:hover {
        transform: translateY(-1px);
    }

    .primary-action:hover {
        background: var(--guild-action-primary-hover-bg);
        box-shadow: var(--guild-action-primary-hover-shadow);
    }

    .secondary-action:hover {
        background: var(--guild-action-secondary-hover-bg);
        box-shadow: var(--guild-action-secondary-hover-shadow);
    }

    button:focus-visible {
        outline: 2px solid var(--guild-brass);
        outline-offset: 2px;
    }

    button:disabled {
        cursor: not-allowed;
        opacity: 0.42;
        filter: grayscale(0.65);
        box-shadow: none;
        transform: none;
    }

    .primary-action:disabled:hover,
    .secondary-action:disabled:hover {
        box-shadow: none;
        transform: none;
    }

    @media (max-width: 720px) {
        .registration-summary {
            padding: 42px 24px 30px;
        }

        .registration-summary::before {
            inset: 8px;
        }

        .summary-actions {
            flex-direction: column;
        }

        .disabled-submit-tooltip-host {
            width: 100%;
        }

        button {
            width: 100%;
        }
    }
</style>
