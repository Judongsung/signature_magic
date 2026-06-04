<script lang="ts">
    import { choiceStore } from '../../../stores/choiceStore.svelte';
    import {
        CYOA_REGISTRATION_SUMMARY_TEXT,
        UI_BUTTON_TEXT,
    } from '../../../constants/uiText';
    import {
        buildCyoaRegistrationSummary,
        type InputValues,
        type RowSelections,
        type RowVisibility,
    } from '../../../systems/cyoa/cyoaRegistrationSummary';
    import type { CyoaChoiceRowData } from '../../../types/cyoa';
    import DescriptionTooltip from '../../shared/DescriptionTooltip.svelte';
    import CyoaRegistrationSummaryBody from './CyoaRegistrationSummaryBody.svelte';
    import CyoaRegistrationSummaryFooter from './CyoaRegistrationSummaryFooter.svelte';
    import CyoaRegistrationSummaryHeader from './CyoaRegistrationSummaryHeader.svelte';

    let {
        rows = choiceStore.rows,
        visibleRowIds = choiceStore.visibleRowIds,
        selectedChoiceIds = choiceStore.selectedChoiceIds,
        inputValues = choiceStore.inputValues,
        onSubmit,
        onBack,
        submitLabel = UI_BUTTON_TEXT.SUBMIT_REGISTRATION,
        backLabel = CYOA_REGISTRATION_SUMMARY_TEXT.DEFAULT_BACK_LABEL,
        submitDisabled = false,
    }: {
        rows?: CyoaChoiceRowData[];
        visibleRowIds?: RowVisibility;
        selectedChoiceIds?: RowSelections;
        inputValues?: InputValues;
        onSubmit?: () => void;
        onBack?: () => void;
        submitLabel?: string;
        backLabel?: string;
        submitDisabled?: boolean;
    } = $props();

    const summary = $derived(buildCyoaRegistrationSummary({
        rows,
        visibleRowIds,
        selectedChoiceIds,
        inputValues,
    }));
    const submitTooltipId = 'registration-submit-disabled-tooltip';
</script>

<div class="registration-summary-layout">
    <section class="registration-summary" aria-labelledby="registration-summary-title">
        <CyoaRegistrationSummaryHeader />
        <CyoaRegistrationSummaryBody
            inputItems={summary.inputItems}
            choiceItems={summary.choiceItems}
        />
        <CyoaRegistrationSummaryFooter signatureName={summary.signatureName} />
    </section>

    {#if onBack || onSubmit}
        <div class="summary-actions">
            {#if onBack}
                <button type="button" class="secondary-action" onclick={onBack}>
                    {backLabel}
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

    .registration-summary {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 28px;
        box-sizing: border-box;
        padding: 56px 46px 44px;
        border: 1px solid #d6c6a2;
        border-radius: 3px;
        background:
            radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 42%),
            linear-gradient(150deg, #fcf8ee 0%, #f5ecd8 60%, #eae0c6 100%);
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
        background: linear-gradient(180deg, #882222, #661616);
        color: #fcf8ee;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);
    }

    .secondary-action {
        border: 1px solid rgba(141, 115, 74, 0.55);
        background: rgba(141, 115, 74, 0.08);
        color: #fcf8ee;
    }

    button:hover {
        transform: translateY(-1px);
    }

    .primary-action:hover {
        background: linear-gradient(180deg, #992c2c, #771c1c);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35);
    }

    .secondary-action:hover {
        background: rgba(141, 115, 74, 0.16);
        box-shadow: 0 4px 10px rgba(44, 34, 23, 0.18);
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
