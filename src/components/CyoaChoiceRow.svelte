<script lang="ts">
    import CyoaChoiceCard from './CyoaChoiceCard.svelte';
    import type { CyoaChoice } from '../types/cyoa';

    let {
        choices,
        selectedChoiceId,
        disabled = false,
        onSelect,
    }: {
        choices: CyoaChoice[];
        selectedChoiceId?: string | null;
        disabled?: boolean;
        onSelect?: (choiceId: string) => void;
    } = $props();
</script>

<div class="choice-row" role="list">
    {#each choices as choice (choice.id)}
        <div class="choice-row-item" role="listitem">
            <CyoaChoiceCard
                {choice}
                selected={selectedChoiceId === choice.id}
                {disabled}
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
        gap: 14px;
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
