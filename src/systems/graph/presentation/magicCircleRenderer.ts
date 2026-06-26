import type { CirclePath, MagicStats, MagicType } from '../../../types/magic';
import { MAGIC_CIRCLE_RENDERING_CONFIG } from '../../../constants/magicCircleConfigs';
import {
    DEFAULT_MAGIC_GLYPH_CONFIG,
    magicGlyphMap,
    type MagicGlyphConfig,
} from './magicGlyphRegistry';
import type { GlyphKind } from './magicGlyphShapes';
import {
    GRAPH_PERFORMANCE_OPERATION_IDS,
    measureGraphOperation,
} from '../diagnostics/graphPerformance';

export type SpinDirection = 'normal' | 'reverse';

export interface MagicCircleRenderOptions {
    center: number;
    innerRadius: number;
    outerRadius: number;
    outerFrameRadius: number;
}

export interface NodeRingLayout {
    id: string;
    node: CirclePath['nodes'][number];
    radius: number;
}

export interface GlyphMarkLayout {
    id: string;
    kind: GlyphKind;
    x: number;
    y: number;
    rotation: number;
    scale: number;
}

export interface GlyphBandLayout {
    id: string;
    node: CirclePath['nodes'][number];
    spinDuration: number;
    spinDirection: SpinDirection;
    marks: GlyphMarkLayout[];
}

export interface NodeStarLayout {
    id: string;
    polygons: string[];
    pointCount: number;
    step: number;
}

export interface MagicCircleRenderModel {
    id: string;
    stats: MagicStats;
    statAdjustments: MagicStats;
    lightweight: boolean;
    nodeStar?: NodeStarLayout;
    rings: NodeRingLayout[];
    bands: GlyphBandLayout[];
}

export const DEFAULT_MAGIC_CIRCLE_RENDER_OPTIONS: MagicCircleRenderOptions = {
    center: MAGIC_CIRCLE_RENDERING_CONFIG.CENTER,
    innerRadius: MAGIC_CIRCLE_RENDERING_CONFIG.INNER_RADIUS,
    outerRadius: MAGIC_CIRCLE_RENDERING_CONFIG.OUTER_RADIUS,
    outerFrameRadius: MAGIC_CIRCLE_RENDERING_CONFIG.OUTER_FRAME_RADIUS,
};

export function buildMagicCircleRenderModels(
    circles: CirclePath[],
    options: MagicCircleRenderOptions = DEFAULT_MAGIC_CIRCLE_RENDER_OPTIONS,
    glyphs: ReadonlyMap<MagicType, MagicGlyphConfig> = magicGlyphMap
): MagicCircleRenderModel[] {
    return measureGraphOperation(
        GRAPH_PERFORMANCE_OPERATION_IDS.BUILD_MAGIC_CIRCLE_RENDER_MODELS,
        {
            circleCount: circles.length,
            nodeCount: countCircleNodes(circles),
        },
        () => buildMagicCircleRenderModelsNow(circles, options, glyphs)
    );
}

function buildMagicCircleRenderModelsNow(
    circles: CirclePath[],
    options: MagicCircleRenderOptions,
    glyphs: ReadonlyMap<MagicType, MagicGlyphConfig>
): MagicCircleRenderModel[] {
    const lightweight = countCircleNodes(circles) >= MAGIC_CIRCLE_RENDERING_CONFIG.LIGHTWEIGHT_NODE_THRESHOLD;

    return circles.map(circle => {
        const total = circle.nodes.length;

        return {
            id: circle.id,
            stats: circle.stats,
            statAdjustments: circle.statAdjustments,
            lightweight,
            nodeStar: buildNodeStar(circle.id, total, options),
            rings: circle.nodes.map((node, index) => ({
                id: `${circle.id}-ring-${node.id}`,
                node,
                radius: nodeRadius(total, index, options),
            })),
            bands: circle.nodes.map((node, index) =>
                buildGlyphBand(circle.id, node, total, index, options, glyphs, lightweight)
            ),
        };
    });
}

function countCircleNodes(circles: readonly CirclePath[]): number {
    return circles.reduce((total, circle) => total + circle.nodes.length, 0);
}

function buildNodeStar(
    circleId: string,
    pointCount: number,
    options: MagicCircleRenderOptions
): NodeStarLayout | undefined {
    if (pointCount < MAGIC_CIRCLE_RENDERING_CONFIG.NODE_STAR_MIN_POINTS) return undefined;

    const radius = MAGIC_CIRCLE_RENDERING_CONFIG.OUTER_GUIDE_RADIUS;
    const step = nodeStarStep(pointCount);
    const polygons = nodeStarIndexCycles(pointCount, step).map(indexes =>
        indexes
            .map(index => {
                const angle = (MAGIC_CIRCLE_RENDERING_CONFIG.FULL_TURN_DEGREES / pointCount) * index;
                const radians = ((angle - MAGIC_CIRCLE_RENDERING_CONFIG.SVG_UP_DEGREES) * Math.PI) / MAGIC_CIRCLE_RENDERING_CONFIG.HALF_TURN_DEGREES;
                const x = options.center + radius * Math.cos(radians);
                const y = options.center + radius * Math.sin(radians);

                return `${roundPoint(x)},${roundPoint(y)}`;
            })
            .join(' ')
    );

    return {
        id: `${circleId}-node-star`,
        polygons,
        pointCount,
        step,
    };
}

function nodeStarStep(pointCount: number): number {
    if (pointCount <= 4) return 1;

    const preferred = Math.floor(pointCount / 2);
    for (let step = preferred; step >= 2; step -= 1) {
        const divisor = greatestCommonDivisor(pointCount, step);
        if (pointCount / divisor >= MAGIC_CIRCLE_RENDERING_CONFIG.NODE_STAR_MIN_POINTS) return step;
    }

    return 1;
}

function nodeStarIndexCycles(pointCount: number, step: number): number[][] {
    const visited = new Set<number>();
    const cycles: number[][] = [];

    for (let start = 0; start < pointCount; start += 1) {
        if (visited.has(start)) continue;

        const indexes: number[] = [];
        let current = start;

        do {
            indexes.push(current);
            visited.add(current);
            current = (current + step) % pointCount;
        } while (current !== start && indexes.length <= pointCount);

        cycles.push(indexes);
    }

    return cycles;
}

function greatestCommonDivisor(a: number, b: number): number {
    let left = a;
    let right = b;

    while (right !== 0) {
        const next = left % right;
        left = right;
        right = next;
    }

    return left;
}

function roundPoint(value: number): number {
    return Math.round(value * 100) / 100;
}

function buildGlyphBand(
    circleId: string,
    node: CirclePath['nodes'][number],
    total: number,
    index: number,
    options: MagicCircleRenderOptions,
    glyphs: ReadonlyMap<MagicType, MagicGlyphConfig>,
    lightweight: boolean
): GlyphBandLayout {
    const definition = glyphs.get(node.data.magicType) ?? DEFAULT_MAGIC_GLYPH_CONFIG;

    const fullCount = definition.baseCount
        + Math.min(index, MAGIC_CIRCLE_RENDERING_CONFIG.GLYPH_INDEX_COUNT_STEP_LIMIT)
        * MAGIC_CIRCLE_RENDERING_CONFIG.GLYPH_INDEX_COUNT_STEP;
    const count = lightweight
        ? Math.min(fullCount, MAGIC_CIRCLE_RENDERING_CONFIG.LIGHTWEIGHT_GLYPH_MARK_LIMIT)
        : fullCount;

    return {
        id: `${circleId}-band-${node.id}`,
        node,
        spinDuration: MAGIC_CIRCLE_RENDERING_CONFIG.BASE_SPIN_SECONDS + index * MAGIC_CIRCLE_RENDERING_CONFIG.SPIN_STEP_SECONDS,
        spinDirection: index % 2 === 0 ? 'normal' : 'reverse',
        marks: glyphMarks(definition, count, bandRadius(total, index, options), index, options.center),
    };
}

function nodeRadius(total: number, index: number, options: MagicCircleRenderOptions): number {
    if (total <= 1) return MAGIC_CIRCLE_RENDERING_CONFIG.SINGLE_NODE_RADIUS;
    return options.innerRadius + ((options.outerRadius - options.innerRadius) * index) / (total - 1);
}

function bandRadius(total: number, index: number, options: MagicCircleRenderOptions): number {
    const current = nodeRadius(total, index, options);
    if (index < total - 1) return (current + nodeRadius(total, index + 1, options)) / 2;
    if (total > 1) return outerGlyphBandRadius();

    const previous = index > 0 ? nodeRadius(total, index - 1, options) : options.innerRadius;
    const spacing = Math.max(MAGIC_CIRCLE_RENDERING_CONFIG.MIN_OUTER_BAND_SPACING, current - previous);
    return Math.min(outerGlyphBandRadius(), current + spacing / 2);
}

function outerGlyphBandRadius(): number {
    return MAGIC_CIRCLE_RENDERING_CONFIG.OUTER_GUIDE_RADIUS
        - MAGIC_CIRCLE_RENDERING_CONFIG.GLYPH_DESIGN_RADIUS * MAGIC_CIRCLE_RENDERING_CONFIG.MAX_GLYPH_SCALE
        - MAGIC_CIRCLE_RENDERING_CONFIG.OUTER_GLYPH_CLEARANCE;
}

function glyphMarks(
    definition: MagicGlyphConfig,
    count: number,
    radius: number,
    bandIndex: number,
    center: number
): GlyphMarkLayout[] {
    const phase = (bandIndex % 2) * (MAGIC_CIRCLE_RENDERING_CONFIG.HALF_TURN_DEGREES / count);
    const scale = Math.max(
        MAGIC_CIRCLE_RENDERING_CONFIG.MIN_GLYPH_SCALE,
        Math.min(MAGIC_CIRCLE_RENDERING_CONFIG.MAX_GLYPH_SCALE, radius / MAGIC_CIRCLE_RENDERING_CONFIG.GLYPH_SCALE_RADIUS)
    );

    return Array.from({ length: count }, (_, index) => {
        const angle = phase + (MAGIC_CIRCLE_RENDERING_CONFIG.FULL_TURN_DEGREES / count) * index;
        const radians = ((angle - MAGIC_CIRCLE_RENDERING_CONFIG.SVG_UP_DEGREES) * Math.PI) / MAGIC_CIRCLE_RENDERING_CONFIG.HALF_TURN_DEGREES;

        return {
            id: `glyph-${bandIndex}-${index}`,
            kind: glyphMarkKind(definition, index, bandIndex),
            x: center + radius * Math.cos(radians),
            y: center + radius * Math.sin(radians),
            rotation: angle,
            scale,
        };
    });
}

function glyphMarkKind(definition: MagicGlyphConfig, index: number, bandIndex: number): GlyphKind {
    const sequence = definition.runeKinds?.length
        ? definition.runeKinds
        : DEFAULT_MAGIC_GLYPH_CONFIG.runeKinds;

    // runeKinds는 밴드마다 시작 위치를 밀어, 한 문양 반복보다 문장처럼 보이게 한다.
    return sequence[(index + bandIndex) % sequence.length];
}

export function magicCircleRingStrokeWidth(total: number): number {
    return total > MAGIC_CIRCLE_RENDERING_CONFIG.DENSE_RING_THRESHOLD
        ? MAGIC_CIRCLE_RENDERING_CONFIG.DENSE_RING_STROKE_WIDTH
        : MAGIC_CIRCLE_RENDERING_CONFIG.RING_STROKE_WIDTH;
}
