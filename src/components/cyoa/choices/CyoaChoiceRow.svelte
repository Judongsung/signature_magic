<script lang="ts">
    import CyoaChoiceCard from './CyoaChoiceCard.svelte';
    import type {
        CyoaChoice,
        CyoaRowSelections,
        CyoaSubChoiceGroupData,
    } from '../../../types/cyoa';

    let {
        choices,
        layoutColumns = 3,
        selectedChoiceIds = [],
        subChoiceSelections = {},
        disabled = false,
        onSelect,
        onSubChoiceSelect,
    }: {
        choices: CyoaChoice[];
        layoutColumns?: number;
        selectedChoiceIds?: string[];
        subChoiceSelections?: CyoaRowSelections;
        disabled?: boolean;
        onSelect?: (choiceId: string) => void;
        onSubChoiceSelect?: (group: CyoaSubChoiceGroupData, choiceId: string) => void;
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
        {@const subChoiceGroup = choice.subChoiceGroup}
        {#if selectedChoiceIds.includes(choice.id) && subChoiceGroup}
            {#each subChoiceGroup.choices as subChoice (subChoice.id)}
                <div
                    class="choice-row-item sub-choice-row-item"
                    style={`--layout-span: ${subChoice.layoutSpan ?? 1};`}
                    role="listitem"
                >
                    <CyoaChoiceCard
                        choice={subChoice}
                        selected={(subChoiceSelections[subChoiceGroup.id] ?? []).includes(subChoice.id)}
                        disabled={disabled || subChoice.disabled}
                        subChoice
                        ariaLabel={`${subChoiceGroup.title}: ${subChoice.title}`}
                        onSelect={(choiceId) => onSubChoiceSelect?.(subChoiceGroup, choiceId)}
                    />
                </div>
            {/each}
        {/if}
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

    .sub-choice-row-item {
        position: relative;
    }

    .sub-choice-row-item::before {
        content: '';
        position: absolute;
        top: 10px;
        bottom: 10px;
        left: -7px;
        width: 2px;
        border-radius: 999px;
        background: var(--guild-sub-choice-marker);
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
