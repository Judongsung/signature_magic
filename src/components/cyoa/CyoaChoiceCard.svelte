<script lang="ts">
    import type { CyoaChoice } from '../../types/cyoa';

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
        min-height: 126px;
        display: grid;
        grid-template-columns: 100px minmax(0, 1fr);
        gap: 16px;
        align-items: center;
        padding: 14px;
        border: 1px solid rgba(115, 88, 53, 0.22);
        border-radius: 6px;
        background:
            linear-gradient(180deg, rgba(255, 253, 247, 0.96), rgba(244, 236, 219, 0.98)),
            repeating-linear-gradient(0deg, rgba(130, 95, 55, 0.035) 0 1px, transparent 1px 12px);
        color: #332619;
        text-align: left;
        cursor: pointer;
        box-sizing: border-box;
        transition: all 0.18s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .choice-card.without-image {
        grid-template-columns: 1fr;
        min-height: 98px;
    }

    .choice-card:hover:not(:disabled) {
        transform: translateY(-1px);
        border-color: rgba(103, 77, 48, 0.44);
        background:
            linear-gradient(180deg, rgba(255, 255, 252, 0.98), rgba(248, 240, 223, 0.98)),
            repeating-linear-gradient(0deg, rgba(130, 95, 55, 0.045) 0 1px, transparent 1px 12px);
        box-shadow: 0 10px 22px rgba(88, 65, 38, 0.14);
    }

    .choice-card:focus-visible {
        outline: 2px solid #3e6f67;
        outline-offset: 2px;
    }

    .choice-card.selected {
        border: 1px solid rgba(62, 111, 103, 0.72);
        background:
            linear-gradient(180deg, rgba(246, 252, 247, 0.98), rgba(225, 239, 226, 0.98)),
            repeating-linear-gradient(0deg, rgba(62, 111, 103, 0.05) 0 1px, transparent 1px 10px);
        box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.42),
            0 0 0 1px rgba(62, 111, 103, 0.18),
            0 12px 28px rgba(42, 93, 84, 0.16);
    }

    .choice-card.selected .choice-title {
        color: #1f4f47;
    }

    .choice-card:disabled {
        cursor: not-allowed;
        opacity: 0.35;
        filter: grayscale(1);
    }

    .image-frame {
        display: block;
        overflow: hidden;
        border-radius: 6px;
        background: rgba(230, 219, 198, 0.8);
        border: 1px solid rgba(103, 77, 48, 0.22);
        aspect-ratio: 1;
        box-shadow: inset 0 0 12px rgba(93, 68, 38, 0.12);
        transition: border-color 0.18s ease;
    }

    .choice-card.selected .image-frame {
        border-color: rgba(62, 111, 103, 0.62);
    }

    .image-frame img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        filter: saturate(0.92) contrast(1.02) brightness(1.02);
        opacity: 0.94;
        transition: filter 0.18s ease, opacity 0.18s ease;
    }

    .choice-card:hover:not(:disabled) .image-frame img {
        opacity: 1;
        filter: saturate(1) contrast(1.04) brightness(1.04);
    }

    .choice-body {
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 6px;
    }

    .choice-title {
        color: #382819;
        font-family: var(--font-title);
        font-size: 17px;
        font-weight: 800;
        line-height: 1.25;
        transition: color 0.18s ease;
    }

    .choice-description {
        color: #6b5a45;
        font-family: var(--font-body);
        font-size: 13.5px;
        line-height: 1.5;
        font-weight: 500;
    }

    @media (max-width: 560px) {
        .choice-card {
            grid-template-columns: 80px minmax(0, 1fr);
            min-height: 100px;
            gap: 12px;
            padding: 10px;
        }

        .choice-title {
            font-size: 15px;
        }
    }
</style>
