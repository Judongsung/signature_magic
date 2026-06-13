import { describe, expect, it } from 'vitest';
import {
    clampPointToExtent,
    getExtentCenter,
    resolveCenteredDropPosition,
    resolveCenteredViewport,
    resolveDropPosition,
    snapPointToGrid,
} from './editorCanvas';

const grid = [40, 40] as const;
const extent = [[-1200, -800], [1200, 800]] as const;

describe('editorCanvas', () => {
    it('snaps points to the nearest grid cell', () => {
        expect(snapPointToGrid({ x: 63, y: 101 }, grid)).toEqual({ x: 80, y: 120 });
        expect(snapPointToGrid({ x: -63, y: -101 }, grid)).toEqual({ x: -80, y: -120 });
    });

    it('clamps points to the canvas extent', () => {
        expect(clampPointToExtent({ x: 2000, y: -1000 }, extent)).toEqual({
            x: 1200,
            y: -800,
        });
    });

    it('calculates the center of a canvas extent', () => {
        expect(getExtentCenter(extent)).toEqual({ x: 0, y: 0 });
        expect(getExtentCenter([[40, 80], [120, 240]])).toEqual({ x: 80, y: 160 });
    });

    it('calculates a viewport transform that centers a flow point', () => {
        expect(resolveCenteredViewport(
            { x: 0, y: 0 },
            { width: 1000, height: 600 },
            1
        )).toEqual({ x: 500, y: 300, zoom: 1 });

        expect(resolveCenteredViewport(
            { x: 80, y: 160 },
            { width: 1000, height: 600 },
            0.5
        )).toEqual({ x: 460, y: 220, zoom: 0.5 });
    });

    it('snaps then clamps drop positions', () => {
        expect(resolveDropPosition({ x: 1191, y: 821 }, grid, extent)).toEqual({
            x: 1200,
            y: 800,
        });
    });

    it('converts a desired node center to a snapped top-left position', () => {
        expect(resolveCenteredDropPosition(
            { x: 0, y: 0 },
            { width: 160, height: 80 },
            grid,
            extent
        )).toEqual({ x: -80, y: -40 });
    });
});
