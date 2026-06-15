import { describe, expect, it } from 'vitest';
import { buildNodeCompositionTransitionLayout } from './nodeCompositionTransitionLayout';

describe('nodeCompositionTransitionLayout', () => {
    it('places vertex circles on a regular polygon around the center circle', () => {
        const layout = buildNodeCompositionTransitionLayout(3, {
            CENTRAL_CIRCLE_SIZE: {
                minPx: 100,
                preferredVmin: 20,
                maxPx: 200,
            },
            VERTEX_CIRCLE_SIZE: {
                minPx: 50,
                preferredVmin: 10,
                maxPx: 100,
            },
            VERTEX_CIRCLE_OPACITY: 0.8,
            CENTER_VERTEX_GAP_RATIO: 0.55,
            POLYGON_START_ANGLE_DEGREES: -90,
        });

        expect(layout.centralCircleSize).toBe('clamp(100px, 20vmin, 200px)');
        expect(layout.vertexCircleSize).toBe('clamp(50px, 10vmin, 100px)');
        expect(layout.stageSize).toBe('clamp(242.3846px, 48.4769vmin, 484.7692px)');
        expect(layout.vertices).toHaveLength(3);
        expect(layout.vertices[0]).toEqual({
            angle: -90,
            offsetX: 'calc(clamp(96.1923px, 19.2385vmin, 192.3846px) * 0)',
            offsetY: 'calc(clamp(96.1923px, 19.2385vmin, 192.3846px) * -1)',
            opacity: 0.8,
        });
    });

    it('uses the central circle size as the stage size when there are no vertices', () => {
        const layout = buildNodeCompositionTransitionLayout(0, {
            CENTRAL_CIRCLE_SIZE: {
                minPx: 100,
                preferredVmin: 20,
                maxPx: 200,
            },
            VERTEX_CIRCLE_SIZE: {
                minPx: 50,
                preferredVmin: 10,
                maxPx: 100,
            },
            VERTEX_CIRCLE_OPACITY: 0.8,
            CENTER_VERTEX_GAP_RATIO: 0.55,
            POLYGON_START_ANGLE_DEGREES: -90,
        });

        expect(layout.stageSize).toBe('clamp(100px, 20vmin, 200px)');
        expect(layout.vertices).toEqual([]);
    });
});
