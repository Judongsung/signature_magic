import { describe, expect, it } from 'vitest';
import { EDITOR_CANVAS } from '../../../constants/nodeEditorConfigs';
import {
    clampPointToExtent,
    getExtentCenter,
    resolveCenteredDropPosition,
    resolveCenteredViewport,
    resolveDropPosition,
    resolveNearestAvailableRectPosition,
    snapPointToGrid,
} from './editorCanvas';

const grid = [40, 40] as const;
const extent = EDITOR_CANVAS.EXTENT;

describe('editorCanvas', () => {
    it('snaps points to the nearest grid cell', () => {
        expect(snapPointToGrid({ x: 63, y: 101 }, grid)).toEqual({ x: 80, y: 120 });
        expect(snapPointToGrid({ x: -63, y: -101 }, grid)).toEqual({ x: -80, y: -120 });
    });

    it('clamps points to the canvas extent', () => {
        expect(clampPointToExtent({ x: 2000, y: -2000 }, extent)).toEqual({
            x: 1200,
            y: -1600,
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
        expect(resolveDropPosition({ x: 1191, y: 1621 }, grid, extent)).toEqual({
            x: 1200,
            y: 1600,
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

    it('finds the nearest non-overlapping snapped position for a new circle', () => {
        const position = resolveNearestAvailableRectPosition(
            { x: 0, y: 0 },
            { width: 480, height: 640 },
            [{ x: 0, y: 0, width: 480, height: 640 }],
            grid,
            extent,
            40
        );

        expect(position).toEqual({ x: -520, y: 0 });
    });

    it('keeps searching when every immediately adjacent circle position is occupied', () => {
        const occupiedRects = [
            { x: 0, y: 0, width: 480, height: 640 },
            { x: -520, y: 0, width: 480, height: 640 },
            { x: 520, y: 0, width: 480, height: 640 },
        ];
        const position = resolveNearestAvailableRectPosition(
            { x: 0, y: 0 },
            { width: 480, height: 640 },
            occupiedRects,
            grid,
            extent,
            40
        );

        expect(occupiedRects.some(rect =>
            position.x < rect.x + rect.width + 40 &&
            position.x + 480 + 40 > rect.x &&
            position.y < rect.y + rect.height + 40 &&
            position.y + 640 + 40 > rect.y
        )).toBe(false);
        expect(position.x).toBeGreaterThanOrEqual(extent[0][0]);
        expect(position.x + 480).toBeLessThanOrEqual(extent[1][0]);
        expect(position.y).toBeGreaterThanOrEqual(extent[0][1]);
        expect(position.y + 640).toBeLessThanOrEqual(extent[1][1]);
    });
});
