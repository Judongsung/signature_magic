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
    class:without-image={!choice.imageSrc}
    class:selected
    {disabled}
    aria-pressed={selected}
    onclick={selectChoice}
>
    {#if choice.imageSrc}
        <span class="image-frame">
            <img src={choice.imageSrc} alt={choice.imageAlt} loading="lazy" />
        </span>
    {/if}

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
        border: 1px solid #4d3821;
        border-radius: 8px;
        background:
            linear-gradient(135deg, rgba(42, 30, 18, 0.96), rgba(18, 25, 20, 0.98)),
            repeating-linear-gradient(45deg, rgba(230, 190, 112, 0.04) 0 1px, transparent 1px 8px);
        color: #ead9b7;
        text-align: left;
        cursor: pointer;
        transition:
            border-color 0.16s ease,
            background 0.16s ease,
            box-shadow 0.16s ease,
            transform 0.16s ease;
    }

    .choice-card.without-image {
        grid-template-columns: 1fr;
        min-height: 96px;
    }

    .choice-card:hover:not(:disabled) {
        transform: translateY(-1px);
        border-color: #9f7738;
        background:
            linear-gradient(135deg, rgba(55, 38, 20, 0.98), rgba(21, 35, 27, 0.98)),
            repeating-linear-gradient(45deg, rgba(230, 190, 112, 0.05) 0 1px, transparent 1px 8px);
        box-shadow: 0 9px 22px rgba(0, 0, 0, 0.34);
    }

    .choice-card:focus-visible {
        outline: 2px solid #d1a653;
        outline-offset: 3px;
    }

    .choice-card.selected {
        border-color: #d4a84f;
        background:
            linear-gradient(135deg, rgba(77, 47, 20, 0.98), rgba(19, 47, 34, 0.98));
        box-shadow:
            inset 0 0 0 1px rgba(255, 223, 139, 0.22),
            0 0 0 1px rgba(212, 168, 79, 0.58),
            0 10px 26px rgba(0, 0, 0, 0.36);
    }

    .choice-card:disabled {
        cursor: not-allowed;
        opacity: 0.48;
        filter: grayscale(0.55);
    }

    .image-frame {
        display: block;
        overflow: hidden;
        border-radius: 6px;
        background: #110d08;
        border: 1px solid #6e4a25;
        aspect-ratio: 1;
        box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.45);
    }

    .image-frame img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        filter: sepia(0.24) saturate(0.82) contrast(1.08);
    }

    .choice-body {
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
    }

    .choice-title {
        color: #f2dfb0;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 18px;
        font-weight: 800;
        line-height: 1.2;
    }

    .choice-description {
        color: #c7b58b;
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
