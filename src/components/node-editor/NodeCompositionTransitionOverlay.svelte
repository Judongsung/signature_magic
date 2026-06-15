<script lang="ts">
    import { onMount } from 'svelte';
    import {
        MAGIC_CIRCLE_ANIMATION_MODES,
        NODE_COMPOSITION_TRANSITION_CONFIG,
    } from '../../constants/magicCircleConfigs';
    import type { CirclePath } from '../../types/magic';
    import {
        buildMagicCircleRenderModels,
        type MagicCircleRenderModel,
    } from '../../systems/graph/presentation/magicCircleRenderer';
    import MagicCircleSvg from './MagicCircleSvg.svelte';

    const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';
    const CIRCLE_START_INDEX = 1;
    const FULL_ORBIT_DEGREES = 360;
    const ORBIT_DIRECTION_PATTERN = ['normal', 'reverse'] as const;
    const ORBIT_SCALE_PATTERN = [1, 0.84, 0.92, 0.76] as const;
    const ORBIT_OPACITY_PATTERN = [0.9, 0.72, 0.82, 0.66] as const;
    const totalDurationMs = NODE_COMPOSITION_TRANSITION_CONFIG.FILL_DURATION_MS
        + NODE_COMPOSITION_TRANSITION_CONFIG.SPIN_DURATION_MS
        + NODE_COMPOSITION_TRANSITION_CONFIG.FLASH_DURATION_MS;
    const flashDelayMs = NODE_COMPOSITION_TRANSITION_CONFIG.FILL_DURATION_MS
        + NODE_COMPOSITION_TRANSITION_CONFIG.SPIN_DURATION_MS;

    interface TransitionCircleInstance {
        circle: MagicCircleRenderModel;
        index: number;
        orbitIndex: number;
        angle: number;
        direction: string;
        staggerMs: number;
        scale: number;
        opacity: number;
    }

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

    const transitionCircles = $derived(buildTransitionCircleInstances(circles));
    const centralCircle = $derived(transitionCircles[0]);
    const orbitingCircles = $derived(transitionCircles.slice(CIRCLE_START_INDEX));
    const animationMode = $derived(
        isReducedMotion
            ? MAGIC_CIRCLE_ANIMATION_MODES.STATIC
            : MAGIC_CIRCLE_ANIMATION_MODES.BURST
    );

    function buildTransitionCircleInstances(sourceCircles: CirclePath[]): TransitionCircleInstance[] {
        const renderModels = buildMagicCircleRenderModels(sourceCircles);
        if (renderModels.length === 0) return [];

        const cappedModels = renderModels.slice(0, NODE_COMPOSITION_TRANSITION_CONFIG.MAX_CIRCLE_INSTANCES);
        const orbitingCount = Math.max(cappedModels.length - CIRCLE_START_INDEX, CIRCLE_START_INDEX);

        return renderModels
            .slice(0, NODE_COMPOSITION_TRANSITION_CONFIG.MAX_CIRCLE_INSTANCES)
            .map((circle, index) => ({
                circle,
                index,
                orbitIndex: Math.max(index - CIRCLE_START_INDEX, 0),
                angle: ((index - CIRCLE_START_INDEX) * FULL_ORBIT_DEGREES) / orbitingCount,
                direction: ORBIT_DIRECTION_PATTERN[index % ORBIT_DIRECTION_PATTERN.length],
                staggerMs: index * NODE_COMPOSITION_TRANSITION_CONFIG.CIRCLE_STAGGER_MS,
                scale: index === 0
                    ? 1
                    : ORBIT_SCALE_PATTERN[index % ORBIT_SCALE_PATTERN.length],
                opacity: index === 0
                    ? 1
                    : ORBIT_OPACITY_PATTERN[index % ORBIT_OPACITY_PATTERN.length],
            }));
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
    style:--central-circle-size={NODE_COMPOSITION_TRANSITION_CONFIG.CENTRAL_CIRCLE_SIZE}
    style:--orbiting-circle-size={NODE_COMPOSITION_TRANSITION_CONFIG.ORBITING_CIRCLE_SIZE}
    style:--orbit-radius={NODE_COMPOSITION_TRANSITION_CONFIG.ORBIT_RADIUS}
>
    <div class="orbit-system">
        {#if centralCircle}
            <div
                class="central-circle"
                style:--circle-stagger={`${centralCircle.staggerMs}ms`}
                style:--circle-scale={`${centralCircle.scale}`}
                style:--circle-opacity={`${centralCircle.opacity}`}
            >
                <MagicCircleSvg
                    circle={centralCircle.circle}
                    index={centralCircle.index}
                    {animationMode}
                />
            </div>
        {/if}

        {#each orbitingCircles as item (item.index)}
            <div
                class="orbit-path"
                style:--orbit-angle={`${item.angle}deg`}
                style:--orbit-direction={item.direction}
                style:--circle-stagger={`${item.staggerMs}ms`}
            >
                <div
                    class="orbiting-circle"
                    style:--circle-scale={`${item.scale}`}
                    style:--circle-opacity={`${item.opacity}`}
                >
                    <MagicCircleSvg
                        circle={item.circle}
                        index={item.index}
                        {animationMode}
                    />
                </div>
            </div>
        {/each}
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
            linear-gradient(180deg, rgba(4, 8, 11, 0.92), rgba(0, 0, 0, 0.98));
        animation: transition-fill var(--transition-fill-duration) ease-out both;
    }

    .node-composition-transition-overlay::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
            radial-gradient(circle at center, rgba(255, 255, 255, 0.98), rgba(142, 255, 245, 0.56) 28%, transparent 62%);
        opacity: 0;
        animation: transition-flash var(--transition-flash-duration) ease-in var(--transition-flash-delay) forwards;
    }

    .orbit-system {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
    }

    .central-circle,
    .orbiting-circle {
        opacity: 0;
        filter: saturate(1.28);
        animation: transition-circle-arrive var(--transition-fill-duration) ease-out var(--circle-stagger) both;
    }

    .central-circle {
        position: relative;
        z-index: 2;
        transform: scale(var(--circle-scale));
    }

    .central-circle :global(.magic-svg) {
        width: var(--central-circle-size);
        height: auto;
    }

    .orbit-path {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 0;
        height: 0;
        transform: rotate(var(--orbit-angle));
        animation: orbit-system-spin var(--orbit-duration) linear var(--transition-fill-duration) both;
        animation-direction: var(--orbit-direction);
    }

    .orbiting-circle {
        transform:
            translateX(var(--orbit-radius))
            translate(-50%, -50%)
            scale(var(--circle-scale));
    }

    .orbiting-circle :global(.magic-svg) {
        width: var(--orbiting-circle-size);
        height: auto;
    }

    .reduced-motion {
        animation: reduced-transition var(--transition-reduced-duration) ease-out both;
    }

    .reduced-motion::after {
        animation: reduced-transition-flash var(--transition-reduced-duration) ease-out both;
    }

    .reduced-motion .central-circle,
    .reduced-motion .orbiting-circle {
        opacity: var(--circle-opacity);
        animation: none;
    }

    .reduced-motion .central-circle {
        transform: scale(var(--circle-scale));
    }

    .reduced-motion .orbit-path {
        animation: none;
    }

    .reduced-motion .orbiting-circle {
        transform:
            translateX(var(--orbit-radius))
            translate(-50%, -50%)
            scale(var(--circle-scale));
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

    @keyframes orbit-system-spin {
        from {
            transform: rotate(var(--orbit-angle));
        }

        to {
            transform: rotate(calc(var(--orbit-angle) + 360deg));
        }
    }

    @keyframes transition-flash {
        0% {
            opacity: 0;
        }

        46% {
            opacity: 1;
        }

        100% {
            opacity: 0.92;
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
        .orbit-system {
            transform: scale(0.86);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .node-composition-transition-overlay,
        .node-composition-transition-overlay::after,
        .central-circle,
        .orbit-path,
        .orbiting-circle {
            animation: none;
        }
    }
</style>
