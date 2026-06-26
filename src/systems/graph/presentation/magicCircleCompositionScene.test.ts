import { describe, expect, it } from 'vitest';
import { NODE_COMPOSITION_TRANSITION_CONFIG } from '../../../constants/magicCircleConfigs';
import { EMPTY_MAGIC_STATS, type CirclePath, type MagicType } from '../../../types/magic';
import { buildMagicCircleCompositionScene } from './magicCircleCompositionScene';

function circle(id: string, magicType: MagicType = 'ignition'): CirclePath {
    return {
        id,
        stats: { ...EMPTY_MAGIC_STATS },
        statAdjustments: { ...EMPTY_MAGIC_STATS },
        nodes: [
            {
                id: `${id}-node`,
                type: 'magicNode',
                position: { x: 0, y: 0 },
                data: { magicType },
            },
        ],
    };
}

describe('magicCircleCompositionScene', () => {
    it('returns an empty scene with a zero-vertex layout', () => {
        const scene = buildMagicCircleCompositionScene([]);

        expect(scene.circles).toEqual([]);
        expect(scene.centralCircle).toBeUndefined();
        expect(scene.polygonCircles).toEqual([]);
        expect(scene.layout.vertices).toEqual([]);
    });

    it('caps circle instances and separates central and polygon circles', () => {
        const sourceCircles = Array.from(
            { length: NODE_COMPOSITION_TRANSITION_CONFIG.MAX_CIRCLE_INSTANCES + 2 },
            (_, index) => circle(`circle-${index}`)
        );
        const scene = buildMagicCircleCompositionScene(sourceCircles);

        expect(scene.circles).toHaveLength(NODE_COMPOSITION_TRANSITION_CONFIG.MAX_CIRCLE_INSTANCES);
        expect(scene.centralCircle?.index).toBe(0);
        expect(scene.centralCircle?.vertexIndex).toBe(-1);
        expect(scene.centralCircle?.vertexX).toBe('0px');
        expect(scene.polygonCircles).toHaveLength(
            NODE_COMPOSITION_TRANSITION_CONFIG.MAX_CIRCLE_INSTANCES - 1
        );
        expect(scene.polygonCircles[0].vertexIndex).toBe(0);
    });

    it('uses custom layout config for preview scenes', () => {
        const scene = buildMagicCircleCompositionScene([
            circle('circle-1'),
            circle('circle-2', 'stream'),
        ], {
            CENTRAL_CIRCLE_SIZE: { minPx: 100, preferredVmin: 20, maxPx: 200 },
            VERTEX_CIRCLE_SIZE: { minPx: 50, preferredVmin: 10, maxPx: 100 },
            VERTEX_CIRCLE_OPACITY: 0.7,
            CENTER_VERTEX_GAP_RATIO: 0.55,
            POLYGON_START_ANGLE_DEGREES: -90,
        });

        expect(scene.layout.centralCircleSize).toBe('clamp(100px, 20vmin, 200px)');
        expect(scene.layout.vertexCircleSize).toBe('clamp(50px, 10vmin, 100px)');
        expect(scene.polygonCircles[0].opacity).toBe(0.7);
    });
});
