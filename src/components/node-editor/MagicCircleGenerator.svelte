<script lang="ts">
    import { graphStore } from '../../stores/graphStore.svelte';
    import { MAGIC_CIRCLE_PREVIEW } from '../../constants/gameConfigs';
    import { magicTypeColorMap } from '../../systems/graph/magicTypeRegistry';
    import { MAGIC_STAT_KEYS, MAGIC_STAT_LABELS } from '../../types/magic';
    import {
        DEFAULT_MAGIC_CIRCLE_RENDER_OPTIONS,
        buildMagicCircleRenderModels,
        magicCircleRingStrokeWidth,
    } from '../../systems/graph/magicCircleRenderer';
    import MagicGlyphMark from './MagicGlyphMark.svelte';

    const CIRCLE = DEFAULT_MAGIC_CIRCLE_RENDER_OPTIONS;
    const renderCircles = $derived(buildMagicCircleRenderModels(graphStore.circles));

    function colorFor(magicType: keyof typeof magicTypeColorMap): string {
        return magicTypeColorMap[magicType] ?? '#9aa0a6';
    }
</script>

<div class="generator-container">
    <div class="header">
        <div class="circle-count">
            {#if graphStore.circles.length === 0}
                <span class="hint">노드를 연결하면 마법진이 생성됩니다.</span>
            {:else}
                <span class="count-number">{graphStore.circles.length}</span>
                <span class="count-label">서클 마법</span>
            {/if}
        </div>
        {#if graphStore.circles.length > 0}
            <section class="total-stats" aria-label="Total magic stats">
                <div class="total-stats-label">Total Stats</div>
                <dl class="stats-grid total-stats-grid">
                    {#each MAGIC_STAT_KEYS as statKey}
                        <div class="stat-item total-stat-item">
                            <dt>{MAGIC_STAT_LABELS[statKey]}</dt>
                            <dd>{graphStore.totalStats[statKey]}</dd>
                        </div>
                    {/each}
                </dl>
            </section>
        {/if}
    </div>

    <div class="circles-grid">
        {#each renderCircles as circle, ci}
            <div class="circle-card">
                <div class="circle-label">Circle {ci + 1}</div>
                <svg
                    width={MAGIC_CIRCLE_PREVIEW.VIEWBOX_SIZE}
                    height={MAGIC_CIRCLE_PREVIEW.VIEWBOX_SIZE}
                    viewBox={`0 0 ${MAGIC_CIRCLE_PREVIEW.VIEWBOX_SIZE} ${MAGIC_CIRCLE_PREVIEW.VIEWBOX_SIZE}`}
                    class="magic-svg"
                    aria-label={`Magic circle ${ci + 1}`}
                >
                    <defs>
                        <filter id="glow-{ci}">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="glow-soft-{ci}">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <radialGradient id="circle-core-{ci}" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#f7fbff" stop-opacity="0.9" />
                            <stop offset="48%" stop-color="#7fc7ff" stop-opacity="0.12" />
                            <stop offset="100%" stop-color="#06060c" stop-opacity="0" />
                        </radialGradient>
                    </defs>

                    <circle cx={CIRCLE.center} cy={CIRCLE.center} r={MAGIC_CIRCLE_PREVIEW.CORE_GRADIENT_RADIUS} fill={`url(#circle-core-${ci})`} />
                    <circle cx={CIRCLE.center} cy={CIRCLE.center} r={CIRCLE.outerFrameRadius} class="outer-ring" />
                    <circle cx={CIRCLE.center} cy={CIRCLE.center} r={MAGIC_CIRCLE_PREVIEW.OUTER_GUIDE_RADIUS} class="outer-guide" />
                    <circle cx={CIRCLE.center} cy={CIRCLE.center} r={MAGIC_CIRCLE_PREVIEW.INNER_GUIDE_RADIUS} class="inner-guide" />

                    {#each circle.rings as ring}
                        {@const color = colorFor(ring.node.data.magicType)}
                        <g class="node-ring" style:--node-color={color}>
                            <circle
                                cx={CIRCLE.center}
                                cy={CIRCLE.center}
                                r={ring.radius}
                                fill="none"
                                stroke="var(--node-color)"
                                stroke-width={magicCircleRingStrokeWidth(circle.rings.length)}
                                filter={`url(#glow-${ci})`}
                            />
                            <circle
                                cx={CIRCLE.center}
                                cy={CIRCLE.center}
                                r={ring.radius + MAGIC_CIRCLE_PREVIEW.NODE_RING_ECHO_OFFSET}
                                fill="none"
                                stroke="var(--node-color)"
                                stroke-width="0.45"
                                stroke-opacity="0.45"
                                stroke-dasharray="2 7"
                            />
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
                                    filter={`url(#glow-${ci})`}
                                >
                                    <MagicGlyphMark kind={band.kind} />
                                </g>
                            {/each}
                        </g>
                    {/each}

                    <circle cx={CIRCLE.center} cy={CIRCLE.center} r={MAGIC_CIRCLE_PREVIEW.CORE_GLOW_RADIUS} class="core-glow" filter={`url(#glow-soft-${ci})`} />
                    <circle cx={CIRCLE.center} cy={CIRCLE.center} r={MAGIC_CIRCLE_PREVIEW.CORE_DOT_RADIUS} class="core-dot" />
                </svg>
                <dl class="stats-grid" aria-label={`Magic circle ${ci + 1} stats`}>
                    {#each MAGIC_STAT_KEYS as statKey}
                        <div class="stat-item">
                            <dt>{MAGIC_STAT_LABELS[statKey]}</dt>
                            <dd>{circle.stats[statKey]}</dd>
                        </div>
                    {/each}
                </dl>
            </div>
        {/each}
    </div>
</div>

<style>
    .generator-container {
        height: 100%;
        width: 100%;
        background: #05060a;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    .header {
        padding: 16px 20px 10px;
        border-bottom: 1px solid #14141e;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .circle-count {
        display: flex;
        align-items: baseline;
        gap: 8px;
        color: #e0e0ff;
    }

    .count-number {
        font-size: 32px;
        font-weight: 800;
        background: linear-gradient(135deg, #b8f4ff, #f0d77e);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .count-label {
        font-size: 14px;
        color: #8b92a4;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .hint {
        font-size: 13px;
        color: #52586b;
    }

    .total-stats {
        display: flex;
        flex-direction: column;
        gap: 7px;
    }

    .total-stats-label {
        color: #7f879b;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.4px;
        text-transform: uppercase;
    }

    .circles-grid {
        padding: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: center;
        align-items: flex-start;
    }

    .circle-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: min-content;
    }

    .circle-label {
        font-size: 11px;
        color: #687083;
        text-transform: uppercase;
        letter-spacing: 1.5px;
    }

    .magic-svg {
        background:
            radial-gradient(circle at center, rgba(75, 98, 126, 0.18) 0%, rgba(12, 13, 20, 0.94) 54%, #05060a 100%),
            #05060a;
        border-radius: 50%;
        border: 1px solid #20283a;
        box-shadow:
            inset 0 0 34px rgba(97, 158, 197, 0.08),
            0 0 28px rgba(0, 0, 0, 0.35);
    }

    .stats-grid {
        width: 260px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        margin: 2px 0 0;
    }

    .total-stats-grid {
        width: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: 0;
    }

    .stat-item {
        min-width: 0;
        padding: 7px 8px;
        border: 1px solid #182033;
        border-radius: 6px;
        background: rgba(13, 16, 27, 0.72);
    }

    .total-stat-item {
        background: rgba(18, 24, 39, 0.92);
        border-color: #26314a;
    }

    .stat-item dt {
        color: #737c91;
        font-size: 10px;
        line-height: 1.2;
        white-space: nowrap;
    }

    .stat-item dd {
        margin: 2px 0 0;
        color: #e6edf7;
        font-size: 15px;
        font-weight: 700;
        line-height: 1.15;
    }

    @media (max-width: 520px) {
        .total-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    .outer-ring,
    .outer-guide,
    .inner-guide {
        fill: none;
        stroke: #d9eeff;
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

    .node-ring {
        opacity: 0.9;
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
        fill: #dff7ff;
        opacity: 0.8;
    }

    .core-dot {
        fill: #fffaf0;
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
