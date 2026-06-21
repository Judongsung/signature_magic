<script lang="ts">
    import type {
        CyoaChoiceRowData,
        CyoaRowSelections,
        CyoaSubChoiceGroupData,
    } from '../../../types/cyoa';
    import CyoaChoiceRow from './CyoaChoiceRow.svelte';
    import CyoaTextInputRow from './CyoaTextInputRow.svelte';

    let {
        row,
        selectedChoiceIds,
        allSelectedChoiceIds,
        inputValues,
        onSelect,
        onSubChoiceSelect,
        onInputValueChange,
    }: {
        row: CyoaChoiceRowData;
        selectedChoiceIds?: string[];
        allSelectedChoiceIds?: CyoaRowSelections;
        inputValues?: Record<string, string>;
        onSelect?: (choiceId: string) => void;
        onSubChoiceSelect?: (group: CyoaSubChoiceGroupData, choiceId: string) => void;
        onInputValueChange?: (inputId: string, value: string) => void;
    } = $props();
</script>

<section class="choice-section" aria-labelledby={`choice-row-${row.id}`}>
    <div class="section-heading">
        <h2 id={`choice-row-${row.id}`}>{row.title}</h2>
        {#if row.description}
            <p class="row-description">{row.description}</p>
        {/if}
    </div>
    {#if row.input}
        <CyoaTextInputRow
            input={row.input}
            value={inputValues?.[row.input.id]}
            onValueChange={onInputValueChange}
        />
    {:else}
        <CyoaChoiceRow
            choices={row.choices}
            layoutColumns={row.layoutColumns}
            {selectedChoiceIds}
            subChoiceSelections={allSelectedChoiceIds}
            {onSelect}
            {onSubChoiceSelect}
        />
    {/if}
</section>

<style>
    .choice-section {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 20px 0 0;
        border-top: 1px solid rgba(103, 77, 48, 0.16);
        background: transparent;
        box-shadow: none;
        position: relative;
        z-index: 3;
    }

    h2 {
        margin: 0;
        color: #3b2c1d;
        font-family: var(--font-title);
        font-size: 17px;
        font-weight: 800;
        letter-spacing: 0.2px;
        border-bottom: 0;
        padding-bottom: 0;
    }

    .section-heading {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .row-description {
        margin: 0;
        color: rgba(59, 44, 29, 0.72);
        font-size: 13px;
        line-height: 1.55;
        white-space: pre-line;
        word-break: keep-all;
    }
</style>
