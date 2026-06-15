import { describe, expect, it } from 'vitest';
import {
    NODE_COMPOSITION_PANE_RESIZE_CONFIG,
    clampPanePercent,
    resolvePanePercentFromKey,
    resolvePanePercentFromPointer,
} from './paneResize';

describe('paneResize', () => {
    it('clamps pane percentage to configured bounds', () => {
        expect(clampPanePercent(10)).toBe(NODE_COMPOSITION_PANE_RESIZE_CONFIG.MIN_PERCENT);
        expect(clampPanePercent(60)).toBe(60);
        expect(clampPanePercent(90)).toBe(NODE_COMPOSITION_PANE_RESIZE_CONFIG.MAX_PERCENT);
    });

    it('resolves pane percentage from horizontal and compact pointer positions', () => {
        const rect = { left: 10, top: 20, width: 200, height: 100 };

        expect(resolvePanePercentFromPointer({ clientX: 110, clientY: 0 }, rect, false)).toBe(50);
        expect(resolvePanePercentFromPointer({ clientX: 0, clientY: 70 }, rect, true)).toBe(50);
    });

    it('ignores pointer updates when the container has no size', () => {
        expect(resolvePanePercentFromPointer(
            { clientX: 10, clientY: 10 },
            { left: 0, top: 0, width: 0, height: 0 },
            false
        )).toBeUndefined();
    });

    it('resolves keyboard resize actions', () => {
        expect(resolvePanePercentFromKey(50, 'ArrowLeft')).toBe(45);
        expect(resolvePanePercentFromKey(50, 'ArrowRight')).toBe(55);
        expect(resolvePanePercentFromKey(50, 'Home')).toBe(NODE_COMPOSITION_PANE_RESIZE_CONFIG.MIN_PERCENT);
        expect(resolvePanePercentFromKey(50, 'End')).toBe(NODE_COMPOSITION_PANE_RESIZE_CONFIG.MAX_PERCENT);
        expect(resolvePanePercentFromKey(65, 'Enter')).toBe(NODE_COMPOSITION_PANE_RESIZE_CONFIG.DEFAULT_PERCENT);
        expect(resolvePanePercentFromKey(50, 'Escape')).toBeUndefined();
    });
});
