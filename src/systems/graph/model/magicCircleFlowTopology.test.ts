import { describe, expect, it } from 'vitest';
import { analyzeMagicCircleFlowTopology } from './magicCircleFlowTopology';

describe('magicCircleFlowTopology', () => {
    it('orders a converging graph and exposes its single terminal', () => {
        const analysis = analyzeMagicCircleFlowTopology(
            ['left', 'right', 'target'],
            [
                { source: 'left', target: 'target' },
                { source: 'right', target: 'target' },
            ]
        );

        expect(analysis.orderedCircleIds)
            .toEqual(['left', 'right', 'target']);
        expect(analysis.terminalCircleIds).toEqual(['target']);
        expect(analysis.hasMultipleOutputs).toBe(false);
        expect(analysis.hasCycle).toBe(false);
    });

    it('reports fan-out, cycles, and unknown endpoints', () => {
        const fanOut = analyzeMagicCircleFlowTopology(
            ['source', 'left', 'right'],
            [
                { source: 'source', target: 'left' },
                { source: 'source', target: 'right' },
            ]
        );
        const cycle = analyzeMagicCircleFlowTopology(
            ['a', 'b'],
            [
                { source: 'a', target: 'b' },
                { source: 'b', target: 'a' },
            ]
        );
        const unknown = analyzeMagicCircleFlowTopology(
            ['a'],
            [{ source: 'a', target: 'missing' }]
        );

        expect(fanOut.hasMultipleOutputs).toBe(true);
        expect(cycle.hasCycle).toBe(true);
        expect(unknown.hasUnknownEndpoint).toBe(true);
    });
});
