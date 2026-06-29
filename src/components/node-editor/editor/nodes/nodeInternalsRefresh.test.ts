import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import {
    createNodeHandleLayoutKey,
    createNodeInternalsRefresh,
} from './nodeInternalsRefresh';

async function flushRefresh(): Promise<void> {
    await tick();
    await Promise.resolve();
}

describe('node internals refresh', () => {
    it('creates stable and distinct keys from handle layout values', () => {
        expect(createNodeHandleLayoutKey([1, 2, null, false]))
            .toBe(createNodeHandleLayoutKey([1, 2, null, false]));
        expect(createNodeHandleLayoutKey([1, 2, null, false]))
            .not.toBe(createNodeHandleLayoutKey([1, 2, 0, false]));
    });

    it('ignores an already applied layout key', async () => {
        const updateNodeInternals = vi.fn();
        const refresh = createNodeInternalsRefresh(
            () => 'circle-a',
            updateNodeInternals
        );

        refresh('1:1');
        refresh('1:1');
        await flushRefresh();
        refresh('1:1');
        await flushRefresh();

        expect(updateNodeInternals).toHaveBeenCalledTimes(1);
        expect(updateNodeInternals).toHaveBeenCalledWith('circle-a');
    });

    it('coalesces multiple layout changes in the same tick', async () => {
        const updateNodeInternals = vi.fn();
        const refresh = createNodeInternalsRefresh(
            () => 'circle-b',
            updateNodeInternals
        );

        refresh('1:1');
        refresh('2:1');
        refresh('3:2');
        await flushRefresh();

        expect(updateNodeInternals).toHaveBeenCalledTimes(1);

        refresh('4:2');
        await flushRefresh();

        expect(updateNodeInternals).toHaveBeenCalledTimes(2);
    });

    it('cancels a pending refresh when the layout returns to the applied key', async () => {
        const updateNodeInternals = vi.fn();
        const refresh = createNodeInternalsRefresh(
            () => 'circle-c',
            updateNodeInternals
        );

        refresh('1:1');
        await flushRefresh();
        refresh('2:1');
        refresh('1:1');
        await flushRefresh();

        expect(updateNodeInternals).toHaveBeenCalledTimes(1);
    });
});
