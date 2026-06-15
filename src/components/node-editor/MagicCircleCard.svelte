<script lang="ts">
    import {
        MAGIC_CIRCLE_ANIMATION_MODES,
        type MagicCircleAnimationMode,
    } from '../../constants/magicCircleConfigs';
    import { MAGIC_CIRCLE_TEXT } from '../../constants/uiText';
    import type { MagicCircleRenderModel } from '../../systems/graph/presentation/magicCircleRenderer';
    import MagicCircleSvg from './MagicCircleSvg.svelte';
    import MagicStatsGrid from './MagicStatsGrid.svelte';

    let {
        circle,
        index,
        animationMode = MAGIC_CIRCLE_ANIMATION_MODES.STATIC,
    }: {
        circle: MagicCircleRenderModel;
        index: number;
        animationMode?: MagicCircleAnimationMode;
    } = $props();
</script>

<div
    class="circle-card"
    class:mode-static={animationMode === MAGIC_CIRCLE_ANIMATION_MODES.STATIC}
    class:mode-burst={animationMode === MAGIC_CIRCLE_ANIMATION_MODES.BURST}
    class:mode-loop={animationMode === MAGIC_CIRCLE_ANIMATION_MODES.LOOP}
    data-animation-mode={animationMode}
>
    <div class="circle-label">{MAGIC_CIRCLE_TEXT.CIRCLE_LABEL} {index + 1}</div>
    <MagicCircleSvg {circle} {index} {animationMode} />
    <MagicStatsGrid
        stats={circle.stats}
        ariaLabel={`${MAGIC_CIRCLE_TEXT.CIRCLE_ARIA_LABEL} ${index + 1} stats`}
    />
</div>

<style>
    .circle-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        width: min-content;
        padding: 12px;
        border: 1px solid var(--node-editor-circle-card-border);
        border-radius: var(--node-editor-radius-md);
        background: var(--node-editor-circle-card-bg);
        box-shadow: var(--node-editor-circle-card-shadow);
        transition:
            border-color var(--node-editor-transition-medium),
            box-shadow var(--node-editor-transition-medium),
            transform var(--node-editor-transition-medium);
        content-visibility: auto;
        contain-intrinsic-size: 360px 430px;
    }

    .circle-card:hover {
        border-color: var(--node-editor-circle-border);
        box-shadow: var(--node-editor-circle-shadow);
        transform: translateY(-1px);
    }

    .circle-label {
        font-size: 11px;
        color: var(--node-editor-circle-label);
        text-transform: uppercase;
        letter-spacing: 0.12em;
    }
</style>
