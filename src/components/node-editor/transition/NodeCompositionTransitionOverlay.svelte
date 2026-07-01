<script lang="ts">
    import { onMount } from 'svelte';
    import { NODE_EDITOR_CANVAS_BACKGROUND } from '../../../constants/nodeEditorAssets';
    import {
        MAGIC_CIRCLE_ANIMATION_MODES,
        NODE_COMPOSITION_TRANSITION_CONFIG,
    } from '../../../constants/magicCircleConfigs';
    import {
        type CirclePath,
    } from '../../../systems/graph/calculation/magicCalculationTypes';
    import {
        buildMagicCircleCompositionScene,
        type MagicCircleCompositionSceneCircle,
    } from '../../../systems/graph/presentation/magicCircleCompositionScene';
    import MagicCircleSvg from '../magic-circle/MagicCircleSvg.svelte';

    const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';
    const totalDurationMs = NODE_COMPOSITION_TRANSITION_CONFIG.FILL_DURATION_MS
        + NODE_COMPOSITION_TRANSITION_CONFIG.SPIN_DURATION_MS
        + NODE_COMPOSITION_TRANSITION_CONFIG.FLASH_DURATION_MS;
    const flashDelayMs = NODE_COMPOSITION_TRANSITION_CONFIG.FILL_DURATION_MS
        + NODE_COMPOSITION_TRANSITION_CONFIG.SPIN_DURATION_MS;

    let {
        circles,
        onComplete,
    }: {
        circles: CirclePath[];
        onComplete: () => void;
    } = $props();

    let isReducedMotion = $state(false);
    let completionTimer: ReturnType<typeof setTimeout> | undefined;
    let didComplete = false;

    const transitionScene = $derived(buildMagicCircleCompositionScene(circles));
    const transitionLayout = $derived(transitionScene.layout);
    const centralCircle = $derived(transitionScene.centralCircle);
    const polygonCircles = $derived(transitionScene.polygonCircles);
    const centralAnimationMode = $derived(
        isReducedMotion
            ? MAGIC_CIRCLE_ANIMATION_MODES.STATIC
            : MAGIC_CIRCLE_ANIMATION_MODES.BURST
    );
    const vertexAnimationMode = $derived(
        isReducedMotion
            ? MAGIC_CIRCLE_ANIMATION_MODES.STATIC
            : MAGIC_CIRCLE_ANIMATION_MODES.LOOP
    );

    function getCircleStaggerMs(circle: MagicCircleCompositionSceneCircle): number {
        return circle.index * NODE_COMPOSITION_TRANSITION_CONFIG.CIRCLE_STAGGER_MS;
    }

    function prefersReducedMotion(): boolean {
        return window.matchMedia?.(REDUCED_MOTION_MEDIA_QUERY).matches ?? false;
    }

    function completeTransition() {
        if (didComplete) return;

        didComplete = true;
        onComplete();
    }

    onMount(() => {
        isReducedMotion = prefersReducedMotion();
        completionTimer = window.setTimeout(
            completeTransition,
            isReducedMotion
                ? NODE_COMPOSITION_TRANSITION_CONFIG.REDUCED_MOTION_DURATION_MS
                : totalDurationMs
        );

        return () => {
            if (completionTimer === undefined) return;

            clearTimeout(completionTimer);
            completionTimer = undefined;
        };
    });
</script>

<div
    class="node-composition-transition-overlay"
    class:reduced-motion={isReducedMotion}
    aria-hidden="true"
    style:--transition-fill-duration={`${NODE_COMPOSITION_TRANSITION_CONFIG.FILL_DURATION_MS}ms`}
    style:--transition-flash-duration={`${NODE_COMPOSITION_TRANSITION_CONFIG.FLASH_DURATION_MS}ms`}
    style:--transition-flash-delay={`${flashDelayMs}ms`}
    style:--transition-reduced-duration={`${NODE_COMPOSITION_TRANSITION_CONFIG.REDUCED_MOTION_DURATION_MS}ms`}
    style:--orbit-duration={`${NODE_COMPOSITION_TRANSITION_CONFIG.ORBIT_DURATION_MS}ms`}
    style:--orbit-turns={`${NODE_COMPOSITION_TRANSITION_CONFIG.ORBIT_TURNS}`}
    style:--orbit-easing={NODE_COMPOSITION_TRANSITION_CONFIG.ORBIT_ACCELERATION_EASING}
    style:--central-circle-size={transitionLayout.centralCircleSize}
    style:--vertex-circle-size={transitionLayout.vertexCircleSize}
    style:--canvas-background-image-layer={NODE_EDITOR_CANVAS_BACKGROUND.IMAGE_LAYER}
>
    <div class="circle-system">
        {#if centralCircle}
            <div
                class="central-circle"
                style:--circle-stagger={`${getCircleStaggerMs(centralCircle)}ms`}
                style:--circle-opacity={`${centralCircle.opacity}`}
            >
                <MagicCircleSvg
                    circle={centralCircle.circle}
                    index={centralCircle.index}
                    animationMode={centralAnimationMode}
                />
            </div>
        {/if}

        <div class="polygon-system">
            {#each polygonCircles as item (item.index)}
                <div
                    class="polygon-vertex"
                    style:--vertex-x={item.vertexX}
                    style:--vertex-y={item.vertexY}
                    style:--circle-stagger={`${getCircleStaggerMs(item)}ms`}
                >
                    <div class="polygon-counter-rotation">
                        <div
                            class="polygon-circle"
                            style:--circle-opacity={`${item.opacity}`}
                        >
                            <MagicCircleSvg
                                circle={item.circle}
                                index={item.index}
                                animationMode={vertexAnimationMode}
                            />
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .node-composition-transition-overlay {
        position: fixed;
        inset: 0;
        z-index: 140;
        overflow: hidden;
        pointer-events: auto;
        background:
            radial-gradient(circle at center, rgba(128, 243, 236, 0.16), transparent 42%),
            var(--canvas-background-image-layer),
            linear-gradient(180deg, rgba(4, 8, 11, 0.92), rgba(0, 0, 0, 0.98));
        animation: transition-fill var(--transition-fill-duration) ease-out both;
        isolation: isolate;
    }

    .node-composition-transition-overlay::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
            radial-gradient(circle at center, rgb(255, 255, 255), rgba(245, 255, 254, 0.98) 34%, rgba(255, 255, 255, 0.96) 100%);
        opacity: 0;
        z-index: 4;
        animation: transition-flash var(--transition-flash-duration) ease-in var(--transition-flash-delay) forwards;
    }

    .circle-system {
        position: absolute;
        inset: 0;
        z-index: 1;
        display: grid;
        place-items: center;
    }

    .central-circle,
    .polygon-circle {
        opacity: 0;
        filter: saturate(1.28);
        animation: transition-circle-arrive var(--transition-fill-duration) ease-out var(--circle-stagger) both;
    }

    .central-circle {
        position: relative;
        z-index: 2;
    }

    .central-circle :global(.magic-svg) {
        width: var(--central-circle-size);
        height: auto;
    }

    .polygon-system {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 0;
        height: 0;
        animation: polygon-system-orbit var(--orbit-duration) var(--orbit-easing) var(--transition-fill-duration) both;
    }

    .polygon-vertex {
        position: absolute;
        left: var(--vertex-x);
        top: var(--vertex-y);
        width: var(--vertex-circle-size);
        height: var(--vertex-circle-size);
        display: grid;
        place-items: center;
        transform: translate(-50%, -50%);
    }

    .polygon-counter-rotation {
        width: 100%;
        height: 100%;
        animation: polygon-counter-rotation var(--orbit-duration) var(--orbit-easing) var(--transition-fill-duration) both;
    }

    .polygon-circle {
        width: 100%;
        height: 100%;
    }

    .polygon-circle :global(.magic-svg) {
        width: 100%;
        height: 100%;
    }

    .reduced-motion {
        animation: reduced-transition var(--transition-reduced-duration) ease-out both;
    }

    .reduced-motion::after {
        animation: reduced-transition-flash var(--transition-reduced-duration) ease-out both;
    }

    .reduced-motion .central-circle,
    .reduced-motion .polygon-circle {
        opacity: var(--circle-opacity);
        animation: none;
    }

    .reduced-motion .polygon-system,
    .reduced-motion .polygon-counter-rotation {
        animation: none;
    }

    @keyframes transition-fill {
        from {
            opacity: 0;
            transform: scale(1.04);
        }

        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @keyframes transition-circle-arrive {
        from {
            opacity: 0;
        }

        to {
            opacity: var(--circle-opacity);
        }
    }

    @keyframes polygon-system-orbit {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(calc(360deg * var(--orbit-turns)));
        }
    }

    @keyframes polygon-counter-rotation {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(calc(-360deg * var(--orbit-turns)));
        }
    }

    @keyframes transition-flash {
        0% {
            opacity: 0;
        }

        44% {
            opacity: 0.18;
        }

        100% {
            opacity: 1;
        }
    }

    @keyframes reduced-transition {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }

    @keyframes reduced-transition-flash {
        0%,
        100% {
            opacity: 0;
        }

        68% {
            opacity: 0.7;
        }
    }

    @media (max-width: 760px) {
        .circle-system {
            transform: scale(0.86);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .node-composition-transition-overlay,
        .node-composition-transition-overlay::after,
        .central-circle,
        .polygon-system,
        .polygon-counter-rotation,
        .polygon-circle {
            animation: none;
        }
    }
</style>
