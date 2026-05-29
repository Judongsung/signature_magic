<script lang="ts">
    import type { CyoaChoiceRowData } from '../types/cyoa';
    import CyoaChoiceRow from './CyoaChoiceRow.svelte';

    let {
        row,
        selectedChoiceIds,
        onSelect,
    }: {
        row: CyoaChoiceRowData;
        selectedChoiceIds?: string[];
        onSelect?: (choiceId: string) => void;
    } = $props();
</script>

<section class="choice-section" aria-labelledby={`choice-row-${row.id}`}>
    <h2 id={`choice-row-${row.id}`}>{row.title}</h2>
    <CyoaChoiceRow
        choices={row.choices}
        {selectedChoiceIds}
        {onSelect}
    />
</section>

<style>
    .choice-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    h2 {
        margin: 0;
        color: #e8e4f5;
        font-size: 18px;
        font-weight: 800;
    }
</style>
