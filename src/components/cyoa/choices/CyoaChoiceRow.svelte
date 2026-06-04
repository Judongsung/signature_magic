<script lang="ts">
    import CyoaChoiceCard from './CyoaChoiceCard.svelte';
    import type { CyoaChoice } from '../../../types/cyoa';

    let {
        choices,
        layoutColumns = 3,
        selectedChoiceIds = [],
        disabled = false,
        onSelect,
    }: {
        choices: CyoaChoice[];
        layoutColumns?: number;
        selectedChoiceIds?: string[];
        disabled?: boolean;
        onSelect?: (choiceId: string) => void;
    } = $props();
</script>

<div class="choice-row" style={`--layout-columns: ${layoutColumns};`} role="list">
    {#each choices as choice (choice.id)}
        <div
            class="choice-row-item"
            style={`--layout-span: ${choice.layoutSpan ?? 1};`}
            role="listitem"
        >
            <CyoaChoiceCard
                {choice}
                selected={selectedChoiceIds.includes(choice.id)}
                disabled={disabled || choice.disabled}
                {onSelect}
            />
        </div>
    {/each}
</div>

<style>
    .choice-row {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(var(--layout-columns), minmax(0, 1fr));
        gap: 12px;
        align-items: stretch;
    }

    .choice-row-item {
        min-width: 0;
        display: flex;
        grid-column: span var(--layout-span);
    }

    .choice-row-item :global(.choice-card) {
        height: 100%;
    }

    @media (max-width: 640px) {
        .choice-row {
            grid-template-columns: 1fr;
        }

        .choice-row-item {
            grid-column: 1 / -1;
        }
    }
</style>
