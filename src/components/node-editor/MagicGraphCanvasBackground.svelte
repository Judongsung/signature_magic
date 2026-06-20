<script lang="ts">
    import { EDITOR_CANVAS } from '../../constants/gameConfigs';
    import { MAGIC_STAR_FIELD_CONFIG } from '../../constants/graphConfigs';
    import { createStarField } from '../../systems/graph/presentation/starField';

    const canvasLeft = `${EDITOR_CANVAS.EXTENT[0][0]}px`;
    const canvasTop = `${EDITOR_CANVAS.EXTENT[0][1]}px`;
    const canvasWidth = EDITOR_CANVAS.EXTENT[1][0] - EDITOR_CANVAS.EXTENT[0][0];
    const canvasHeight = EDITOR_CANVAS.EXTENT[1][1] - EDITOR_CANVAS.EXTENT[0][1];
    const canvasStars = createStarField(MAGIC_STAR_FIELD_CONFIG, {
        width: canvasWidth,
        height: canvasHeight,
        unit: 'px',
    });
</script>

<div
    class="magic-graph-canvas-background"
    aria-hidden="true"
    style:left={canvasLeft}
    style:top={canvasTop}
    style:width={`${canvasWidth}px`}
    style:height={`${canvasHeight}px`}
>
    {#each canvasStars as star}
        <span
            class="magic-graph-canvas-star"
            style:left={star.x}
            style:top={star.y}
            style:--star-size={star.size}
            style:--star-color={star.color}
            style:--star-glow={star.glow}
        ></span>
    {/each}
</div>

<style>
    .magic-graph-canvas-background {
        position: absolute;
        pointer-events: none;
        background: var(--node-editor-canvas-bg);
    }

    .magic-graph-canvas-star {
        position: absolute;
        width: var(--star-size);
        height: var(--star-size);
        border-radius: 50%;
        background: var(--star-color);
        box-shadow: var(--star-glow);
        transform: translate(-50%, -50%);
    }
</style>
