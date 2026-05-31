import type { CirclePath, MagicNode, MagicStats, MagicType } from '../../types/magic';
import { MAGIC_CIRCLE_PREVIEW } from '../../constants/gameConfigs';
import { magicGlyphMap, type MagicGlyphConfig } from './magicGlyphRegistry';
import type { GlyphKind } from './magicGlyphShapes';

export type SpinDirection = 'normal' | 'reverse';

export interface MagicCircleRenderOptions {
    center: number;
    innerRadius: number;
    outerRadius: number;
    outerFrameRadius: number;
}

export interface NodeRingLayout {
    id: string;
    node: MagicNode;
    radius: number;
}

export interface GlyphMarkLayout {
    id: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
}

export interface GlyphBandLayout {
    id: string;
    node: MagicNode;
    kind: GlyphKind;
    spinDuration: number;
    spinDirection: SpinDirection;
    marks: GlyphMarkLayout[];
}

export interface MagicCircleRenderModel {
    id: string;
    stats: MagicStats;
    rings: NodeRingLayout[];
    bands: GlyphBandLayout[];
}

export const DEFAULT_MAGIC_CIRCLE_RENDER_OPTIONS: MagicCircleRenderOptions = {
    center: MAGIC_CIRCLE_PREVIEW.CENTER,
    innerRadius: MAGIC_CIRCLE_PREVIEW.INNER_RADIUS,
    outerRadius: MAGIC_CIRCLE_PREVIEW.OUTER_RADIUS,
    outerFrameRadius: MAGIC_CIRCLE_PREVIEW.OUTER_FRAME_RADIUS,
};

export function buildMagicCircleRenderModels(
    circles: CirclePath[],
    options: MagicCircleRenderOptions = DEFAULT_MAGIC_CIRCLE_RENDER_OPTIONS,
    glyphs: ReadonlyMap<MagicType, MagicGlyphConfig> = magicGlyphMap
): MagicCircleRenderModel[] {
    return circles.map(circle => {
        const total = circle.nodes.length;

        return {
            id: circle.id,
            stats: circle.stats,
            rings: circle.nodes.map((node, index) => ({
                id: `${circle.id}-ring-${node.id}`,
                node,
                radius: nodeRadius(total, index, options),
            })),
            bands: circle.nodes.map((node, index) => buildGlyphBand(circle.id, node, total, index, options, glyphs)),
        };
    });
}

function buildGlyphBand(
    circleId: string,
    node: MagicNode,
    total: number,
    index: number,
    options: MagicCircleRenderOptions,
    glyphs: ReadonlyMap<MagicType, MagicGlyphConfig>
): GlyphBandLayout {
    const definition = glyphs.get(node.data.magicType);
    if (!definition) {
        throw new Error(`Missing magic glyph config: ${node.data.magicType}`);
    }

    const count = definition.baseCount
        + Math.min(index, MAGIC_CIRCLE_PREVIEW.GLYPH_INDEX_COUNT_STEP_LIMIT)
        * MAGIC_CIRCLE_PREVIEW.GLYPH_INDEX_COUNT_STEP;

    return {
        id: `${circleId}-band-${node.id}`,
        node,
        kind: definition.kind,
        spinDuration: MAGIC_CIRCLE_PREVIEW.BASE_SPIN_SECONDS + index * MAGIC_CIRCLE_PREVIEW.SPIN_STEP_SECONDS,
        spinDirection: index % 2 === 0 ? 'normal' : 'reverse',
        marks: glyphMarks(count, bandRadius(total, index, options), index, options.center),
    };
}

function nodeRadius(total: number, index: number, options: MagicCircleRenderOptions): number {
    if (total <= 1) return MAGIC_CIRCLE_PREVIEW.SINGLE_NODE_RADIUS;
    return options.innerRadius + ((options.outerRadius - options.innerRadius) * index) / (total - 1);
}

function bandRadius(total: number, index: number, options: MagicCircleRenderOptions): number {
    const current = nodeRadius(total, index, options);
    if (index < total - 1) return (current + nodeRadius(total, index + 1, options)) / 2;

    const previous = index > 0 ? nodeRadius(total, index - 1, options) : options.innerRadius;
    const spacing = Math.max(MAGIC_CIRCLE_PREVIEW.MIN_OUTER_BAND_SPACING, current - previous);
    return Math.min(options.outerFrameRadius - MAGIC_CIRCLE_PREVIEW.OUTER_BAND_PADDING, current + spacing / 2);
}

function glyphMarks(count: number, radius: number, bandIndex: number, center: number): GlyphMarkLayout[] {
    const phase = (bandIndex % 2) * (MAGIC_CIRCLE_PREVIEW.HALF_TURN_DEGREES / count);
    const scale = Math.max(
        MAGIC_CIRCLE_PREVIEW.MIN_GLYPH_SCALE,
        Math.min(MAGIC_CIRCLE_PREVIEW.MAX_GLYPH_SCALE, radius / MAGIC_CIRCLE_PREVIEW.GLYPH_SCALE_RADIUS)
    );

    return Array.from({ length: count }, (_, index) => {
        const angle = phase + (MAGIC_CIRCLE_PREVIEW.FULL_TURN_DEGREES / count) * index;
        const radians = ((angle - MAGIC_CIRCLE_PREVIEW.SVG_UP_DEGREES) * Math.PI) / MAGIC_CIRCLE_PREVIEW.HALF_TURN_DEGREES;

        return {
            id: `glyph-${bandIndex}-${index}`,
            x: center + radius * Math.cos(radians),
            y: center + radius * Math.sin(radians),
            rotation: angle,
            scale,
        };
    });
}

export function magicCircleRingStrokeWidth(total: number): number {
    return total > MAGIC_CIRCLE_PREVIEW.DENSE_RING_THRESHOLD
        ? MAGIC_CIRCLE_PREVIEW.DENSE_RING_STROKE_WIDTH
        : MAGIC_CIRCLE_PREVIEW.RING_STROKE_WIDTH;
}
