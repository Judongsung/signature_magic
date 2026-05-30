<script lang="ts">
    import type { CyoaChoiceRowData } from '../types/cyoa';
    import CyoaChoiceRow from './CyoaChoiceRow.svelte';
    import CyoaTextInputRow from './CyoaTextInputRow.svelte';

    let {
        row,
        selectedChoiceIds,
        inputValues,
        onSelect,
        onInputValueChange,
    }: {
        row: CyoaChoiceRowData;
        selectedChoiceIds?: string[];
        inputValues?: Record<string, string>;
        onSelect?: (choiceId: string) => void;
        onInputValueChange?: (inputId: string, value: string) => void;
    } = $props();
</script>

<section class="choice-section" aria-labelledby={`choice-row-${row.id}`}>
    <h2 id={`choice-row-${row.id}`}>{row.title}</h2>
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
            {onSelect}
        />
    {/if}
</section>

<style>
    .choice-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 18px;
        border: 1px solid rgba(139, 101, 47, 0.44);
        border-radius: 8px;
        background:
            linear-gradient(180deg, rgba(17, 22, 18, 0.82), rgba(14, 11, 8, 0.9));
        box-shadow: inset 0 0 0 1px rgba(232, 197, 125, 0.06);
    }

    h2 {
        margin: 0;
        color: #d8ba72;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 18px;
        font-weight: 800;
        text-shadow: 0 1px 0 #130d06;
    }
</style>
