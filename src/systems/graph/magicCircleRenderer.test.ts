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
                node('fire', 'fire'),
                node('water', 'water'),
                node('earth', 'earth'),
            ]),
        ]);

        expect(model.rings.map(ring => ring.node.id)).toEqual(['fire', 'water', 'earth']);
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
});
