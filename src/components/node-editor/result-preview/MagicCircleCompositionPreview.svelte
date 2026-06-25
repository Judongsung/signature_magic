<script lang="ts">
    import {
        MAGIC_CIRCLE_ANIMATION_MODES,
        NODE_COMPOSITION_TRANSITION_CONFIG,
    } from '../../../constants/magicCircleConfigs';
    import { CYOA_REGISTRATION_RESULT_TEXT } from '../../../constants/uiText';
    import {
        buildMagicCircleRenderModels,
        type MagicCircleRenderModel,
    } from '../../../systems/graph/presentation/magicCircleRenderer';
    import {
        buildNodeCompositionTransitionLayout,
        type NodeCompositionTransitionLayout,
    } from '../../../systems/graph/presentation/nodeCompositionTransitionLayout';
    import type { CirclePath } from '../../../types/magic';
    import { BUILD_RESULT_EXPORT_ROLES } from '../../../systems/export/buildResultExportContract';
    import MagicCircleSvg from '../magic-circle/MagicCircleSvg.svelte';

    const CIRCLE_START_INDEX = 1;
    const COMPOSITION_STAGE_PADDING_PX = 24;
    const DEFAULT_COMPOSITION_SCALE = 1;
    const COMPOSITION_PREVIEW_LAYOUT_CONFIG = {
        CENTRAL_CIRCLE_SIZE: { minPx: 150, preferredVmin: 22, maxPx: 240 },
        VERTEX_CIRCLE_SIZE: { minPx: 92, preferredVmin: 13.5, maxPx: 150 },
        VERTEX_CIRCLE_OPACITY: NODE_COMPOSITION_TRANSITION_CONFIG.VERTEX_CIRCLE_OPACITY,
        CENTER_VERTEX_GAP_RATIO: NODE_COMPOSITION_TRANSITION_CONFIG.CENTER_VERTEX_GAP_RATIO,
        POLYGON_START_ANGLE_DEGREES: NODE_COMPOSITION_TRANSITION_CONFIG.POLYGON_START_ANGLE_DEGREES,
    };

    interface CompositionCircleInstance {
        circle: MagicCircleRenderModel;
        index: number;
        opacity: number;
        vertexX: string;
        vertexY: string;
    }

    interface CompositionScene {
        circles: CompositionCircleInstance[];
        layout: NodeCompositionTransitionLayout;
    }

    let {
        circles,
    }: {
        circles: CirclePath[];
    } = $props();

    const compositionScene = $derived(buildCompositionScene(circles));
    const compositionCircles = $derived(compositionScene.circles);
    const compositionLayout = $derived(compositionScene.layout);
    const centralCircle = $derived(compositionCircles[0]);
    const polygonCircles = $derived(compositionCircles.slice(CIRCLE_START_INDEX));

    function buildCompositionScene(sourceCircles: CirclePath[]): CompositionScene {
        const renderModels = buildMagicCircleRenderModels(sourceCircles)
            .slice(0, NODE_COMPOSITION_TRANSITION_CONFIG.MAX_CIRCLE_INSTANCES);
        const vertexCount = Math.max(renderModels.length - CIRCLE_START_INDEX, 0);
        const layout = buildNodeCompositionTransitionLayout(
            vertexCount,
            COMPOSITION_PREVIEW_LAYOUT_CONFIG
        );
        const circles = renderModels.map((circle, index) => {
            const vertex = layout.vertices[index - CIRCLE_START_INDEX];

            return {
                circle,
                index,
                opacity: vertex?.opacity ?? 1,
                vertexX: vertex?.offsetX ?? '0px',
                vertexY: vertex?.offsetY ?? '0px',
            };
        });

        return { circles, layout };
    }

    function fitCompositionStage(frameElement: HTMLDivElement) {
        const stageElement = frameElement.querySelector<HTMLDivElement>('.composition-stage');
        if (!stageElement) return {};

        const updateScale = () => {
            const availableWidth = frameElement.clientWidth;
            const stageWidth = stageElement.offsetWidth;
            const scale = availableWidth > 0 && stageWidth > 0
                ? Math.min(DEFAULT_COMPOSITION_SCALE, availableWidth / stageWidth)
                : DEFAULT_COMPOSITION_SCALE;

            frameElement.style.setProperty('--composition-scale', scale.toString());
        };
        const scheduleUpdate = () => requestAnimationFrame(updateScale);

        scheduleUpdate();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', scheduleUpdate);

            return {
                destroy() {
                    window.removeEventListener('resize', scheduleUpdate);
                },
            };
        }

        const resizeObserver = new ResizeObserver(scheduleUpdate);
        resizeObserver.observe(frameElement);
        resizeObserver.observe(stageElement);

        return {
            destroy() {
                resizeObserver.disconnect();
            },
        };
    }
</script>

<div
    class="circle-composition-preview"
    aria-label={CYOA_REGISTRATION_RESULT_TEXT.CIRCLES_ARIA_LABEL}
    style:--central-circle-size={compositionLayout.centralCircleSize}
    style:--vertex-circle-size={compositionLayout.vertexCircleSize}
    style:--composition-stage-size={compositionLayout.stageSize}
    style:--composition-stage-padding={`${COMPOSITION_STAGE_PADDING_PX}px`}
>
    {#if centralCircle}
        <div
            class="composition-stage-frame"
            data-build-export-role={BUILD_RESULT_EXPORT_ROLES.COMPOSITION_STAGE_FRAME}
            use:fitCompositionStage
        >
            <div class="composition-stage">
                <div class="composition-central-circle">
                    <MagicCircleSvg
                        circle={centralCircle.circle}
                        index={centralCircle.index}
                        animationMode={MAGIC_CIRCLE_ANIMATION_MODES.STATIC}
                    />
                </div>
                <div class="composition-polygon">
                    {#each polygonCircles as item (item.index)}
                        <div
                            class="composition-polygon-vertex"
                            style:--vertex-x={item.vertexX}
                            style:--vertex-y={item.vertexY}
                            style:--circle-opacity={`${item.opacity}`}
                        >
                            <MagicCircleSvg
                                circle={item.circle}
                                index={item.index}
                                animationMode={MAGIC_CIRCLE_ANIMATION_MODES.STATIC}
                            />
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {:else}
        <p class="composition-empty">{CYOA_REGISTRATION_RESULT_TEXT.EMPTY_CIRCLES}</p>
    {/if}
</div>

<style>
    .circle-composition-preview {
        width: 100%;
        min-height: 380px;
        display: grid;
        place-items: center;
        position: relative;
        overflow: hidden;
        padding: var(--composition-stage-padding);
        border: 1px solid var(--node-editor-preview-border);
        border-radius: var(--node-editor-radius-md);
        background: var(--node-editor-preview-bg);
        box-shadow: var(--node-editor-circle-card-shadow);
        box-sizing: border-box;
    }

    .composition-stage-frame {
        --composition-scale: 1;
        width: 100%;
        height: calc(var(--composition-stage-size) * var(--composition-scale));
        display: grid;
        place-items: center;
        position: relative;
    }

    .composition-stage {
        width: var(--composition-stage-size);
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        position: relative;
        flex: 0 0 auto;
        transform: scale(var(--composition-scale));
        transform-origin: center;
    }

    .composition-central-circle {
        position: relative;
        z-index: 2;
    }

    .composition-central-circle :global(.magic-svg) {
        width: var(--central-circle-size);
        height: auto;
    }

    .composition-polygon {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 0;
        height: 0;
    }

    .composition-polygon-vertex {
        position: absolute;
        left: var(--vertex-x);
        top: var(--vertex-y);
        width: var(--vertex-circle-size);
        height: var(--vertex-circle-size);
        display: grid;
        place-items: center;
        opacity: var(--circle-opacity);
        transform: translate(-50%, -50%);
    }

    .composition-polygon-vertex :global(.magic-svg) {
        width: 100%;
        height: 100%;
    }

    .composition-empty {
        margin: 0;
        color: var(--node-editor-preview-empty);
        font-size: 13px;
        line-height: 1.45;
        text-align: center;
    }

    @media (max-width: 720px) {
        .circle-composition-preview {
            min-height: 320px;
        }
    }
</style>
