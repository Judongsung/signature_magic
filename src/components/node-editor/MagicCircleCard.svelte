<script lang="ts">
    import { MAGIC_CIRCLE_RENDERING_CONFIG } from '../../constants/magicCircleConfigs';
    import { MAGIC_CIRCLE_TEXT } from '../../constants/uiText';
    import {
        DEFAULT_MAGIC_CIRCLE_RENDER_OPTIONS,
        magicCircleRingStrokeWidth,
        type MagicCircleRenderModel,
    } from '../../systems/graph/presentation/magicCircleRenderer';
    import { magicTypeColorMap } from '../../systems/graph/registry/magicTypeRegistry';
    import MagicGlyphMark from './MagicGlyphMark.svelte';
    import MagicStatsGrid from './MagicStatsGrid.svelte';

    const CIRCLE = DEFAULT_MAGIC_CIRCLE_RENDER_OPTIONS;

    let {
        circle,
        index,
    }: {
        circle: MagicCircleRenderModel;
        index: number;
    } = $props();

    function colorFor(magicType: keyof typeof magicTypeColorMap): string {
        return magicTypeColorMap[magicType] ?? 'var(--node-editor-circle-fallback-color)';
    }
</script>

<div class="circle-card">
    <div class="circle-label">{MAGIC_CIRCLE_TEXT.CIRCLE_LABEL} {index + 1}</div>
    <svg
        width={MAGIC_CIRCLE_RENDERING_CONFIG.VIEWBOX_SIZE}
        height={MAGIC_CIRCLE_RENDERING_CONFIG.VIEWBOX_SIZE}
        viewBox={`0 0 ${MAGIC_CIRCLE_RENDERING_CONFIG.VIEWBOX_SIZE} ${MAGIC_CIRCLE_RENDERING_CONFIG.VIEWBOX_SIZE}`}
        class="magic-svg"
        aria-label={`${MAGIC_CIRCLE_TEXT.CIRCLE_ARIA_LABEL} ${index + 1}`}
    >
        <defs>
            <filter id="glow-{index}">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <filter id="glow-soft-{index}">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <radialGradient id="circle-core-{index}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="var(--node-editor-circle-core-start)" stop-opacity="0.9" />
                <stop offset="48%" stop-color="var(--node-editor-circle-core-mid)" stop-opacity="0.12" />
                <stop offset="100%" stop-color="var(--node-editor-circle-core-end)" stop-opacity="0" />
            </radialGradient>
        </defs>

        <circle cx={CIRCLE.center} cy={CIRCLE.center} r={MAGIC_CIRCLE_RENDERING_CONFIG.CORE_GRADIENT_RADIUS} fill={`url(#circle-core-${index})`} />
        <circle cx={CIRCLE.center} cy={CIRCLE.center} r={CIRCLE.outerFrameRadius} class="outer-ring" />
        <circle cx={CIRCLE.center} cy={CIRCLE.center} r={MAGIC_CIRCLE_RENDERING_CONFIG.OUTER_GUIDE_RADIUS} class="outer-guide" />
        <circle cx={CIRCLE.center} cy={CIRCLE.center} r={MAGIC_CIRCLE_RENDERING_CONFIG.INNER_GUIDE_RADIUS} class="inner-guide" />

        {#if circle.nodeStar}
            {#each circle.nodeStar.polygons as points}
                <polygon {points} class="node-star" filter={`url(#glow-${index})`} />
            {/each}
        {/if}

        {#each circle.rings as ring, ringIndex}
            {@const color = colorFor(ring.node.data.magicType)}
            <g class="node-ring" style:--node-color={color}>
                <circle
                    cx={CIRCLE.center}
                    cy={CIRCLE.center}
                    r={ring.radius}
                    fill="none"
                    stroke="var(--node-color)"
                    stroke-width={magicCircleRingStrokeWidth(circle.rings.length)}
                    filter={`url(#glow-${index})`}
                />
                {#if ringIndex < circle.rings.length - 1}
                    <circle
                        cx={CIRCLE.center}
                        cy={CIRCLE.center}
                        r={ring.radius + MAGIC_CIRCLE_RENDERING_CONFIG.NODE_RING_ECHO_OFFSET}
                        fill="none"
                        stroke="var(--node-color)"
                        stroke-width="0.45"
                        stroke-dasharray="2 7"
                    />
                {/if}
            </g>
        {/each}

        {#each circle.bands as band}
            {@const color = colorFor(band.node.data.magicType)}
            <g
                class="glyph-band"
                style:--glyph-color={color}
                style:animation-duration={`${band.spinDuration}s`}
                style:animation-direction={band.spinDirection}
            >
                {#each band.marks as mark}
                    <g
                        class="glyph-mark"
                        transform={`translate(${mark.x} ${mark.y}) rotate(${mark.rotation}) scale(${mark.scale})`}
                        filter={`url(#glow-${index})`}
                    >
                        <MagicGlyphMark kind={mark.kind} />
                    </g>
                {/each}
            </g>
        {/each}

        <circle cx={CIRCLE.center} cy={CIRCLE.center} r={MAGIC_CIRCLE_RENDERING_CONFIG.CORE_GLOW_RADIUS} class="core-glow" filter={`url(#glow-soft-${index})`} />
        <circle cx={CIRCLE.center} cy={CIRCLE.center} r={MAGIC_CIRCLE_RENDERING_CONFIG.CORE_DOT_RADIUS} class="core-dot" />
    </svg>
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
        gap: 8px;
        width: min-content;
    }

    .circle-label {
        font-size: 11px;
        color: var(--node-editor-circle-label);
        text-transform: uppercase;
        letter-spacing: 1.5px;
    }

    .magic-svg {
        background: var(--node-editor-circle-bg);
        border-radius: 50%;
        border: 1px solid var(--node-editor-circle-border);
        box-shadow: var(--node-editor-circle-shadow);
    }

    .outer-ring,
    .outer-guide,
    .inner-guide,
    .node-star {
        fill: none;
        stroke: var(--node-editor-circle-stroke);
    }

    .outer-ring {
        stroke-width: 1.45;
        stroke-opacity: 0.42;
    }

    .outer-guide {
        stroke-width: 0.55;
        stroke-opacity: 0.28;
        stroke-dasharray: 4 7;
    }

    .inner-guide {
        stroke-width: 0.8;
        stroke-opacity: 0.22;
    }

    .node-star {
        stroke-width: 0.72;
        stroke-opacity: 0.28;
        stroke-linejoin: round;
    }

    .node-ring {
        opacity: 0.55;
    }

    .node-ring circle:first-child {
        stroke-opacity: 0.42;
    }

    .node-ring circle:last-child {
        stroke-opacity: 0.24;
    }

    .glyph-band {
        transform-origin: 130px 130px;
        animation-name: spin;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
    }

    .glyph-mark {
        fill: none;
        stroke: var(--glyph-color);
        stroke-width: 1.55;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    .glyph-mark :global(path:not(.glyph-cut)),
    .glyph-mark :global(rect),
    .glyph-mark :global(circle) {
        vector-effect: non-scaling-stroke;
    }

    .glyph-mark :global(.glyph-faint) {
        opacity: 0.52;
        stroke-width: 1;
    }

    .glyph-mark :global(.glyph-cut) {
        opacity: 0.72;
        stroke-width: 1;
    }

    .core-glow {
        fill: var(--node-editor-circle-core-glow);
        opacity: 0.8;
    }

    .core-dot {
        fill: var(--node-editor-circle-core-dot);
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(360deg);
        }
    }
</style>
