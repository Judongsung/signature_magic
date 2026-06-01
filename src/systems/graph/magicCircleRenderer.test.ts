import { describe, expect, it } from 'vitest';
import { MAGIC_CIRCLE_PREVIEW } from '../../constants/gameConfigs';
import { buildMagicCircleRenderModels } from './magicCircleRenderer';
import { EMPTY_MAGIC_STATS, type CirclePath, type MagicNode, type MagicType } from '../../types/magic';

function node(id: string, magicType: MagicType): MagicNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: { magicType },
    };
}

function circle(nodes: MagicNode[]): CirclePath {
    return { id: 'circle-0', nodes, stats: EMPTY_MAGIC_STATS };
}

describe('buildMagicCircleRenderModels', () => {
    it('creates ring and glyph band layouts for each node', () => {
        const [model] = buildMagicCircleRenderModels([
            circle([
                node('ignition', 'ignition'),
                node('stream', 'stream'),
                node('soil', 'soil'),
            ]),
        ]);

        expect(model.rings.map(ring => ring.node.id)).toEqual(['ignition', 'stream', 'soil']);
        expect(model.stats).toEqual(EMPTY_MAGIC_STATS);
        expect(model.rings.map(ring => ring.radius)).toEqual([
            MAGIC_CIRCLE_PREVIEW.INNER_RADIUS,
            (MAGIC_CIRCLE_PREVIEW.INNER_RADIUS + MAGIC_CIRCLE_PREVIEW.OUTER_RADIUS) / 2,
            MAGIC_CIRCLE_PREVIEW.OUTER_RADIUS,
        ]);
        expect(model.bands.map(band => band.kind)).toEqual(['flame', 'wave', 'stone']);
        expect(model.bands.map(band => band.marks.length)).toEqual([
            12,
            16 + MAGIC_CIRCLE_PREVIEW.GLYPH_INDEX_COUNT_STEP,
            12 + MAGIC_CIRCLE_PREVIEW.GLYPH_INDEX_COUNT_STEP * 2,
        ]);
    });

    it('maps control and graph operation nodes to stable glyph families', () => {
        const [model] = buildMagicCircleRenderModels([
            circle([
                node('move', 'move'),
                node('split', 'split'),
                node('merge', 'merge'),
                node('stabilize', 'stabilize'),
            ]),
        ]);

        expect(model.bands.map(band => band.kind)).toEqual(['arrow', 'split', 'merge', 'seal']);
        expect(model.bands.map(band => band.spinDirection)).toEqual(['normal', 'reverse', 'normal', 'reverse']);
    });

    it('uses rune sequences instead of repeating one mark shape', () => {
        const [model] = buildMagicCircleRenderModels([
            circle([node('ignition', 'ignition')]),
        ]);

        expect(model.bands[0].marks.slice(0, 4).map(mark => mark.kind)).toEqual([
            'rune-ember',
            'rune-rise',
            'rune-force',
            'rune-bind',
        ]);
    });

    it('creates a node-count star polygon for multi-node circles', () => {
        const [fourPointModel] = buildMagicCircleRenderModels([
            circle([
                node('soil-1', 'soil'),
                node('soil-2', 'soil'),
                node('soil-3', 'soil'),
                node('soil-4', 'soil'),
            ]),
        ]);
        const [sixPointModel] = buildMagicCircleRenderModels([
            circle([
                node('ignition-1', 'ignition'),
                node('ignition-2', 'ignition'),
                node('ignition-3', 'ignition'),
                node('ignition-4', 'ignition'),
                node('ignition-5', 'ignition'),
                node('ignition-6', 'ignition'),
            ]),
        ]);
        const [sevenPointModel] = buildMagicCircleRenderModels([
            circle([
                node('stream-1', 'stream'),
                node('stream-2', 'stream'),
                node('stream-3', 'stream'),
                node('stream-4', 'stream'),
                node('stream-5', 'stream'),
                node('stream-6', 'stream'),
                node('stream-7', 'stream'),
            ]),
        ]);

        expect(fourPointModel.nodeStar?.pointCount).toBe(4);
        expect(fourPointModel.nodeStar?.step).toBe(1);
        expect(fourPointModel.nodeStar?.polygons).toHaveLength(1);
        expect(fourPointModel.nodeStar?.polygons[0].split(' ')).toHaveLength(4);
        expect(sixPointModel.nodeStar?.pointCount).toBe(6);
        expect(sixPointModel.nodeStar?.step).toBe(2);
        expect(sixPointModel.nodeStar?.polygons).toHaveLength(2);
        expect(sixPointModel.nodeStar?.polygons[0].split(' ')).toHaveLength(3);
        expect(sixPointModel.nodeStar?.polygons[1].split(' ')).toHaveLength(3);
        expect(sevenPointModel.nodeStar?.pointCount).toBe(7);
        expect(sevenPointModel.nodeStar?.step).toBe(3);
        expect(sevenPointModel.nodeStar?.polygons).toHaveLength(1);
        expect(sevenPointModel.nodeStar?.polygons[0].split(' ')).toHaveLength(7);

        const [x, y] = sevenPointModel.nodeStar!.polygons[0].split(' ')[0].split(',').map(Number);
        const vertexRadius = Math.hypot(x - MAGIC_CIRCLE_PREVIEW.CENTER, y - MAGIC_CIRCLE_PREVIEW.CENTER);
        expect(vertexRadius).toBe(MAGIC_CIRCLE_PREVIEW.OUTER_GUIDE_RADIUS);
    });

    it('keeps the outer glyph band inside the visible guide circle', () => {
        const [model] = buildMagicCircleRenderModels([
            circle([
                node('ignition', 'ignition'),
                node('stream', 'stream'),
                node('air', 'air'),
                node('soil', 'soil'),
                node('force', 'force'),
            ]),
        ]);
        const outerBandRadii = model.bands.map(band => {
            const mark = band.marks[0];
            return Math.hypot(mark.x - MAGIC_CIRCLE_PREVIEW.CENTER, mark.y - MAGIC_CIRCLE_PREVIEW.CENTER);
        });
        const maxGlyphRadius = Math.max(...outerBandRadii)
            + MAGIC_CIRCLE_PREVIEW.GLYPH_DESIGN_RADIUS * MAGIC_CIRCLE_PREVIEW.MAX_GLYPH_SCALE
            + MAGIC_CIRCLE_PREVIEW.OUTER_GLYPH_CLEARANCE;
        const outerGlyphInnerRadius = Math.max(...outerBandRadii)
            - MAGIC_CIRCLE_PREVIEW.GLYPH_DESIGN_RADIUS * MAGIC_CIRCLE_PREVIEW.MAX_GLYPH_SCALE;
        const outerRingRadius = Math.max(...model.rings.map(ring => ring.radius));

        expect(maxGlyphRadius).toBeLessThanOrEqual(MAGIC_CIRCLE_PREVIEW.OUTER_GUIDE_RADIUS);
        expect(outerRingRadius).toBeLessThan(outerGlyphInnerRadius);
    });
});
