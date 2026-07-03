<script lang="ts">
    import {
        MAGIC_CIRCLE_ANIMATION_MODES,
        NODE_COMPOSITION_TRANSITION_CONFIG,
    } from '../../../constants/magicCircleConfigs';
    import { CYOA_REGISTRATION_RESULT_TEXT } from '../../../constants/uiText';
    import {
        buildMagicCircleCompositionScene,
    } from '../../../systems/graph/presentation/magicCircleCompositionScene';
    import {
        type CirclePath,
    } from '../../../systems/graph/calculation/magicCalculationTypes';
    import { BUILD_RESULT_EXPORT_ROLES } from '../../../systems/export/buildResultExportContract';
    import MagicCircleSvg from '../magic-circle/MagicCircleSvg.svelte';

    const COMPOSITION_STAGE_PADDING_PX = 24;
    const DEFAULT_COMPOSITION_SCALE = 1;
    const COMPOSITION_PREVIEW_LAYOUT_CONFIG = {
        CENTRAL_CIRCLE_SIZE: { minPx: 150, preferredVmin: 22, maxPx: 240 },
        VERTEX_CIRCLE_SIZE: { minPx: 92, preferredVmin: 13.5, maxPx: 150 },
        VERTEX_CIRCLE_OPACITY: NODE_COMPOSITION_TRANSITION_CONFIG.VERTEX_CIRCLE_OPACITY,
        CENTER_VERTEX_GAP_RATIO: NODE_COMPOSITION_TRANSITION_CONFIG.CENTER_VERTEX_GAP_RATIO,
        POLYGON_START_ANGLE_DEGREES: NODE_COMPOSITION_TRANSITION_CONFIG.POLYGON_START_ANGLE_DEGREES,
    };

    let {
        circles,
        terminalCircleId,
    }: {
        circles: CirclePath[];
        terminalCircleId?: string;
    } = $props();

    const compositionScene = $derived(buildMagicCircleCompositionScene(
        circles,
        {
            centralCircleId: terminalCircleId,
            layoutConfig: COMPOSITION_PREVIEW_LAYOUT_CONFIG,
        }
    ));
    const compositionLayout = $derived(compositionScene.layout);
    const centralCircle = $derived(compositionScene.centralCircle);
    const polygonCircles = $derived(compositionScene.polygonCircles);

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
