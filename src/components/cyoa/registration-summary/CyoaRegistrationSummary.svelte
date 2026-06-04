<script lang="ts">
    import { choiceStore } from '../../../stores/choiceStore.svelte';
    import {
        CYOA_REGISTRATION_SUMMARY_TEXT,
        UI_BUTTON_TEXT,
    } from '../../../constants/uiText';
    import type { CyoaChoice, CyoaChoiceRowData } from '../../../types/cyoa';
    import CyoaRegistrationSummaryBody from './CyoaRegistrationSummaryBody.svelte';
    import CyoaRegistrationSummaryFooter from './CyoaRegistrationSummaryFooter.svelte';
    import CyoaRegistrationSummaryHeader from './CyoaRegistrationSummaryHeader.svelte';

    const SUMMARY_EXCLUDED_ROW_IDS = new Set(['toc']);

    interface SummaryInputItem {
        id: string;
        label: string;
        value: string;
        requiredMissing: boolean;
    }

    interface SummaryChoiceItem {
        id: string;
        title: string;
        choices: CyoaChoice[];
        requiredMissing: boolean;
    }

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
        visibleRowIds?: Record<string, boolean>;
        selectedChoiceIds?: Record<string, string[]>;
        inputValues?: Record<string, string>;
        onSubmit?: () => void;
        onBack?: () => void;
        submitLabel?: string;
        backLabel?: string;
        submitDisabled?: boolean;
    } = $props();

    function isRequiredRow(row: CyoaChoiceRowData): boolean {
        return row.selectable && row.requiredCount > 0;
    }

    const summaryRows = $derived(rows.filter(row =>
        !SUMMARY_EXCLUDED_ROW_IDS.has(row.id) &&
        (visibleRowIds[row.id] || isRequiredRow(row))
    ));

    const inputItems = $derived(summaryRows.flatMap<SummaryInputItem>(row => {
        if (!row.input) return [];

        const value = inputValues[row.input.id]?.trim() ?? '';

        return [{
            id: row.input.id,
            label: row.input.label,
            value: value || CYOA_REGISTRATION_SUMMARY_TEXT.EMPTY_VALUE_LABEL,
            requiredMissing: isRequiredRow(row) && value.length === 0,
        }];
    }));

    const choiceItems = $derived(summaryRows.flatMap<SummaryChoiceItem>(row => {
        if (row.input) return [];

        const selectedIds = selectedChoiceIds[row.id] ?? [];
        const selectedChoices = row.choices.filter(choice => selectedIds.includes(choice.id));

        return [{
            id: row.id,
            title: row.title,
            choices: selectedChoices,
            requiredMissing: isRequiredRow(row) && selectedChoices.length < row.requiredCount,
        }];
    }));
</script>

<section class="registration-summary" aria-labelledby="registration-summary-title">
    <CyoaRegistrationSummaryHeader />
    <CyoaRegistrationSummaryBody
        {inputItems}
        {choiceItems}
    />
    <CyoaRegistrationSummaryFooter
        {onBack}
        {onSubmit}
        {backLabel}
        {submitLabel}
        {submitDisabled}
    />
</section>

<style>
    .registration-summary {
        width: min(900px, 100%);
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

    @media (max-width: 720px) {
        .registration-summary {
            padding: 42px 24px 30px;
        }

        .registration-summary::before {
            inset: 8px;
        }
    }
</style>
