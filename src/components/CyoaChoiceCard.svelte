<script lang="ts">
    import type { CyoaChoice } from '../types/cyoa';

    let {
        choice,
        selected = false,
        disabled = false,
        onSelect,
    }: {
        choice: CyoaChoice;
        selected?: boolean;
        disabled?: boolean;
        onSelect?: (choiceId: string) => void;
    } = $props();

    function selectChoice() {
        if (disabled) return;
        onSelect?.(choice.id);
    }
</script>

<button
    type="button"
    class="choice-card"
    class:selected
    {disabled}
    aria-pressed={selected}
    onclick={selectChoice}
>
    <span class="image-frame">
        <img src={choice.imageSrc} alt={choice.imageAlt} loading="lazy" />
    </span>

    <span class="choice-body">
        <span class="choice-title">{choice.title}</span>
        <span class="choice-description">{choice.description}</span>
    </span>
</button>

<style>
    .choice-card {
        width: 100%;
        min-height: 128px;
        display: grid;
        grid-template-columns: 112px minmax(0, 1fr);
        gap: 14px;
        align-items: stretch;
        padding: 12px;
        border: 1px solid #2a2a3a;
        border-radius: 8px;
        background: #101018;
        color: #e8e8f5;
        text-align: left;
        cursor: pointer;
        transition:
            border-color 0.16s ease,
            background 0.16s ease,
            box-shadow 0.16s ease,
            transform 0.16s ease;
    }

    .choice-card:hover:not(:disabled) {
        transform: translateY(-1px);
        border-color: #6d5dfc;
        background: #151525;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    }

    .choice-card:focus-visible {
        outline: 2px solid #9b59b6;
        outline-offset: 3px;
    }

    .choice-card.selected {
        border-color: #9b59b6;
        background: #181226;
        box-shadow:
            0 0 0 1px rgba(155, 89, 182, 0.55),
            0 0 26px rgba(155, 89, 182, 0.24);
    }

    .choice-card:disabled {
        cursor: not-allowed;
        opacity: 0.55;
    }

    .image-frame {
        display: block;
        overflow: hidden;
        border-radius: 6px;
        background: #06060c;
        border: 1px solid #202030;
        aspect-ratio: 1;
    }

    .image-frame img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    .choice-body {
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
    }

    .choice-title {
        color: #f3f0ff;
        font-size: 18px;
        font-weight: 750;
        line-height: 1.2;
    }

    .choice-description {
        color: #aaa8ba;
        font-size: 13px;
        line-height: 1.5;
    }

    @media (max-width: 560px) {
        .choice-card {
            grid-template-columns: 88px minmax(0, 1fr);
            min-height: 108px;
            gap: 12px;
        }

        .choice-title {
            font-size: 16px;
        }
    }
</style>
