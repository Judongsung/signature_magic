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
        min-height: 120px;
        display: grid;
        grid-template-columns: 100px minmax(0, 1fr);
        gap: 16px;
        align-items: center;
        padding: 14px;
        border: 1px solid rgba(141, 115, 74, 0.35);
        border-radius: 2px;
        background: rgba(141, 115, 74, 0.02);
        color: var(--guild-ink-black);
        text-align: left;
        cursor: pointer;
        box-sizing: border-box;
        transition: all 0.18s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .choice-card.without-image {
        grid-template-columns: 1fr;
        min-height: 86px;
    }

    .choice-card:hover:not(:disabled) {
        transform: translateY(-1px);
        border-color: rgba(141, 115, 74, 0.7);
        background: rgba(141, 115, 74, 0.06);
        box-shadow: 0 4px 10px rgba(44, 34, 23, 0.06);
    }

    .choice-card:focus-visible {
        outline: 2px solid var(--guild-brass);
        outline-offset: 2px;
    }

    /* Selected state: Stamped in guild signature red-brown ink */
    .choice-card.selected {
        border: 2px solid var(--guild-ink-seal);
        background: 
            repeating-linear-gradient(45deg, rgba(136, 34, 34, 0.01) 0 1px, transparent 1px 4px),
            rgba(136, 34, 34, 0.03);
        box-shadow:
            inset 0 0 12px rgba(136, 34, 34, 0.05),
            0 3px 8px rgba(136, 34, 34, 0.08);
    }

    .choice-card.selected .choice-title {
        color: var(--guild-ink-seal);
    }

    .choice-card:disabled {
        cursor: not-allowed;
        opacity: 0.35;
        filter: grayscale(1);
    }

    /* Antique sketch / woodcut illustration frame style */
    .image-frame {
        display: block;
        overflow: hidden;
        border-radius: 2px;
        background: rgba(141, 115, 74, 0.04);
        border: 1px solid rgba(141, 115, 74, 0.45);
        aspect-ratio: 1;
        box-shadow: inset 0 1px 4px rgba(44, 34, 23, 0.08);
        transition: border-color 0.18s ease;
    }

    .choice-card.selected .image-frame {
        border-color: var(--guild-ink-seal);
    }

    .image-frame img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        /* Make illustrations look like old printed sketches on the paper */
        filter: sepia(0.65) saturate(0.7) contrast(1.2) brightness(0.92);
        mix-blend-mode: multiply;
        opacity: 0.88;
        transition: filter 0.18s ease, opacity 0.18s ease;
    }

    .choice-card:hover:not(:disabled) .image-frame img {
        opacity: 1;
        filter: sepia(0.55) saturate(0.85) contrast(1.15) brightness(0.95);
    }

    .choice-body {
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 6px;
    }

    .choice-title {
        color: var(--guild-ink-black);
        font-family: var(--font-title);
        font-size: 17px;
        font-weight: 800;
        line-height: 1.25;
        transition: color 0.18s ease;
    }

    .choice-description {
        color: var(--guild-ink-muted);
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
