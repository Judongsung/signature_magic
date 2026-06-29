<script lang="ts">
    import { NODE_EDITOR_CANVAS_BACKGROUND } from '../../constants/nodeEditorAssets';
    import { EDITOR_CANVAS } from '../../constants/nodeEditorConfigs';

    const canvasLeft = `${EDITOR_CANVAS.EXTENT[0][0]}px`;
    const canvasTop = `${EDITOR_CANVAS.EXTENT[0][1]}px`;
    const canvasWidth = EDITOR_CANVAS.EXTENT[1][0] - EDITOR_CANVAS.EXTENT[0][0];
    const canvasHeight = EDITOR_CANVAS.EXTENT[1][1] - EDITOR_CANVAS.EXTENT[0][1];
</script>

<div
    class="magic-graph-canvas-background"
    aria-hidden="true"
    style:left={canvasLeft}
    style:top={canvasTop}
    style:width={`${canvasWidth}px`}
    style:height={`${canvasHeight}px`}
    style:--canvas-background-image-layer={NODE_EDITOR_CANVAS_BACKGROUND.IMAGE_LAYER}
></div>

<style>
    .magic-graph-canvas-background {
        position: absolute;
        pointer-events: none;
        background:
            var(--node-editor-canvas-bg),
            var(--canvas-background-image-layer),
            var(--node-editor-canvas-base-bg);
    }
</style>
