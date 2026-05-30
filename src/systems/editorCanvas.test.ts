import { describe, expect, it } from 'vitest';
import { clampPointToExtent, resolveDropPosition, snapPointToGrid } from './editorCanvas';

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

    it('snaps then clamps drop positions', () => {
        expect(resolveDropPosition({ x: 1191, y: 821 }, grid, extent)).toEqual({
            x: 1200,
            y: 800,
        });
    });
});

