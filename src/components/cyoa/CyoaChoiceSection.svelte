<script lang="ts">
    import type { CyoaChoiceRowData } from '../../types/cyoa';
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
        gap: 16px;
        padding: 24px;
        border: 1px solid rgba(141, 115, 74, 0.25);
        border-radius: 2px;
        background: rgba(141, 115, 74, 0.04);
        box-shadow: 
            inset 0 1px 4px rgba(44, 34, 23, 0.04),
            0 1px 0 rgba(255, 255, 255, 0.6);
        position: relative;
        z-index: 2;
    }

    h2 {
        margin: 0;
        color: var(--guild-ink-black);
        font-family: var(--font-title);
        font-size: 17px;
        font-weight: 800;
        letter-spacing: 0.5px;
        border-bottom: 1px solid rgba(141, 115, 74, 0.3);
        padding-bottom: 8px;
    }
</style>
