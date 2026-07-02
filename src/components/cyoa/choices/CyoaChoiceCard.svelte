<script lang="ts">
    import { CYOA_CHOICE_IMAGE_PLACEMENTS, CYOA_CHOICE_IMAGE_SIZES } from '../../../constants/cyoaConfigs';
    import DescriptionTooltip from '../../shared/DescriptionTooltip.svelte';
    import type { CyoaChoice } from '../../../types/cyoa';
    import { CYOA_STAT_EFFECT_TEXT } from '../../../constants/uiText';

    const TOOLTIP_ID_SUFFIX = 'tooltip';

    let {
        choice,
        selected = false,
        disabled = false,
        locked = false,
        subChoice = false,
        ariaLabel,
        effectLabels = [],
        onSelect,
    }: {
        choice: CyoaChoice;
        selected?: boolean;
        disabled?: boolean;
        locked?: boolean;
        subChoice?: boolean;
        ariaLabel?: string;
        effectLabels?: readonly string[];
        onSelect?: (choiceId: string) => void;
    } = $props();

    function selectChoice() {
        if (disabled || locked) return;
        onSelect?.(choice.id);
    }

    const tooltipId = $derived(`${choice.id}-${TOOLTIP_ID_SUFFIX}`);
    const imageSize = $derived(choice.imageSize ?? CYOA_CHOICE_IMAGE_SIZES.DEFAULT);
    const imagePlacement = $derived(choice.imagePlacement ?? CYOA_CHOICE_IMAGE_PLACEMENTS.TOP);
</script>

<button
    type="button"
    class={`choice-card tooltip-host image-size-${imageSize} image-placement-${imagePlacement}`}
    class:without-image={!choice.imageSrc}
    class:without-description={!choice.description}
    class:selected
    class:locked
    class:sub-choice={subChoice}
    {disabled}
    aria-label={ariaLabel}
    aria-pressed={selected}
    aria-disabled={locked ? 'true' : undefined}
    aria-describedby={choice.tooltip ? tooltipId : undefined}
    onclick={selectChoice}
>
    {#if choice.imageSrc}
        <span class="image-frame">
            <img src={choice.imageSrc} alt={choice.imageAlt} loading="lazy" />
        </span>
    {/if}

    <span class="choice-body">
        <span class="choice-title">{choice.title}</span>
        {#if choice.description}
            <span class="choice-description">{choice.description}</span>
        {/if}
        {#if effectLabels.length > 0}
            <span class="choice-stat-effects" aria-label={CYOA_STAT_EFFECT_TEXT.ARIA_LABEL}>
                {#each effectLabels as label}
                    <span class="choice-stat-effect">{label}</span>
                {/each}
            </span>
        {/if}
    </span>

    {#if choice.tooltip}
        <DescriptionTooltip id={tooltipId} description={choice.tooltip} placement="bottom" />
    {/if}
</button>

<style>
    .choice-card {
        --choice-image-inline-size: clamp(88px, 28%, 120px);
        --choice-image-aspect-ratio: 1;
        --choice-card-min-height: calc(var(--choice-image-inline-size) + 28px);

        width: 100%;
        min-height: var(--choice-card-min-height);
        display: grid;
        grid-template-columns: var(--choice-image-inline-size) minmax(0, 1fr);
        grid-template-areas: "image body";
        gap: 16px;
        align-items: center;
        padding: 14px;
        border: 1px solid var(--guild-surface-border-subtle);
        border-radius: 6px;
        background: var(--guild-surface-card-bg);
        color: var(--guild-text-primary);
        text-align: left;
        cursor: pointer;
        box-sizing: border-box;
        position: relative;
        transition: all 0.18s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .choice-card.image-size-large {
        --choice-image-inline-size: clamp(112px, 34%, 164px);
    }

    .choice-card.image-size-wide {
        --choice-image-inline-size: clamp(128px, 42%, 196px);
    }

    .choice-card.image-placement-right {
        grid-template-columns: minmax(0, 1fr) var(--choice-image-inline-size);
        grid-template-areas: "body image";
    }

    .choice-card.image-placement-top {
        grid-template-columns: 1fr;
        grid-template-rows: max-content auto;
        grid-template-areas:
            "image"
            "body";
        align-items: stretch;
        align-content: start;
    }

    .choice-card.image-placement-top .image-frame {
        width: 100%;
        justify-self: stretch;
        align-self: start;
    }

    .choice-card.without-image {
        grid-template-columns: 1fr;
        grid-template-areas: "body";
        min-height: 98px;
    }

    .choice-card.without-description {
        min-height: 92px;
    }

    .choice-card.without-image.without-description {
        min-height: 64px;
    }

    .choice-card:hover:not(:disabled):not(.locked) {
        transform: translateY(-1px);
        border-color: var(--guild-surface-border-hover);
        background: var(--guild-surface-card-hover-bg);
        box-shadow: var(--guild-surface-hover-shadow);
    }

    .choice-card:focus-visible {
        outline: 2px solid var(--guild-selection-color);
        outline-offset: 2px;
    }

    .choice-card.selected {
        border: 1px solid var(--guild-selection-border);
        background: var(--guild-selection-bg);
        box-shadow: var(--guild-selection-shadow);
    }

    .choice-card.selected .choice-title {
        color: var(--guild-selection-text);
    }

    .choice-card.selected:hover:not(:disabled):not(.locked) {
        border-color: var(--guild-selection-border-hover);
        background: var(--guild-selection-hover-bg);
        box-shadow: var(--guild-selection-hover-shadow);
    }

    .choice-card.sub-choice {
        border-color: var(--guild-sub-choice-border);
        background: var(--guild-sub-choice-bg);
        box-shadow: var(--guild-sub-choice-shadow);
    }

    .choice-card.sub-choice:hover:not(:disabled):not(.locked) {
        border-color: var(--guild-sub-choice-border-hover);
        background: var(--guild-sub-choice-hover-bg);
    }

    .choice-card.sub-choice.selected {
        border-color: var(--guild-sub-choice-selected-border);
        background: var(--guild-sub-choice-selected-bg);
    }

    .choice-card.sub-choice.selected:hover:not(:disabled):not(.locked) {
        border-color: var(--guild-selection-border-hover);
        background: var(--guild-selection-hover-bg);
        box-shadow: var(--guild-selection-hover-shadow);
    }

    .choice-card:disabled {
        cursor: not-allowed;
        opacity: 0.35;
        filter: grayscale(1);
    }

    .choice-card.locked {
        cursor: default;
    }

    .image-frame {
        grid-area: image;
        display: block;
        overflow: hidden;
        border-radius: 6px;
        background: var(--guild-surface-image-bg);
        border: 1px solid var(--guild-surface-image-border);
        aspect-ratio: var(--choice-image-aspect-ratio);
        box-shadow: var(--guild-surface-image-shadow);
        transition: border-color 0.18s ease;
    }

    .choice-card.selected .image-frame {
        border-color: var(--guild-selection-image-border);
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

    .choice-card:hover:not(:disabled):not(.locked) .image-frame img {
        opacity: 1;
        filter: saturate(1) contrast(1.04) brightness(1.04);
    }

    .choice-body {
        grid-area: body;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 6px;
    }

    .choice-title {
        color: var(--guild-text-title);
        font-family: var(--font-title);
        font-size: 19px;
        font-weight: 800;
        line-height: 1.25;
        text-align: center;
        transition: color 0.18s ease;
    }

    .choice-description {
        color: var(--guild-text-muted);
        font-family: var(--font-body);
        font-size: 15px;
        line-height: 1.5;
        font-weight: 400;
        white-space: pre-line;
    }

    .choice-stat-effects {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        margin-top: 4px;
    }

    .choice-stat-effect {
        padding: 4px 7px;
        border: 1px solid var(--guild-selection-border);
        border-radius: 999px;
        background: color-mix(in srgb, var(--guild-selection-bg) 72%, transparent);
        color: var(--guild-selection-text);
        font-family: var(--font-body);
        font-size: 11px;
        font-weight: 700;
        line-height: 1.25;
    }

    @media (max-width: 560px) {
        .choice-card {
            --choice-image-inline-size: clamp(72px, 28%, 92px);

            gap: 12px;
            padding: 10px;
        }

        .choice-card.image-size-large {
            --choice-image-inline-size: clamp(88px, 34%, 116px);
        }

        .choice-card.image-size-wide {
            --choice-image-inline-size: clamp(96px, 42%, 132px);
        }

        .choice-title {
            font-size: 17px;
        }
    }
</style>
