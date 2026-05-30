<script lang="ts">
    import CyoaChoiceCard from './CyoaChoiceCard.svelte';
    import type { CyoaChoice } from '../types/cyoa';

    let {
        choices,
        selectedChoiceIds = [],
        disabled = false,
        onSelect,
    }: {
        choices: CyoaChoice[];
        selectedChoiceIds?: string[];
        disabled?: boolean;
        onSelect?: (choiceId: string) => void;
    } = $props();
</script>

<div class="choice-row" role="list">
    {#each choices as choice (choice.id)}
        <div class="choice-row-item" role="listitem">
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
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 12px;
        align-items: stretch;
    }

    .choice-row-item {
        min-width: 0;
        display: flex;
    }

    .choice-row-item :global(.choice-card) {
        height: 100%;
    }

    @media (max-width: 640px) {
        .choice-row {
            grid-template-columns: 1fr;
        }
    }
</style>
