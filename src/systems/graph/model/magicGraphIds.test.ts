import { describe, expect, it } from 'vitest';
import { createMagicGraphPresetSnapshot } from '../presets/magicGraphPresets';
import { createNode } from './graphActions';
import {
    createMagicCircleNode,
    getCircleChildNodes,
} from './magicCircleGraph';
import { addMagicNodeToCircle } from './magicCircleGraphActions';
import { createMagicGraphIdSegment } from './magicGraphIds';

describe('magicGraphIds', () => {
    it('creates compact ten-character hexadecimal segments', () => {
        const ids = Array.from(
            { length: 100 },
            () => createMagicGraphIdSegment()
        );

        expect(ids.every(id => /^[0-9a-f]{10}$/.test(id))).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('uses compact segments for graph and preset identities', () => {
        const standaloneNode = createNode('light', { x: 0, y: 0 });
        const circle = createMagicCircleNode();
        const graph = addMagicNodeToCircle(
            [circle],
            'repeat',
            circle.id
        );
        const preset = createMagicGraphPresetSnapshot(
            'Compact',
            { nodes: graph.nodes, edges: [] }
        );
        const repeatStart = getCircleChildNodes(graph.nodes, circle.id)
            .find(node =>
            node.data.controlPair?.role === 'start'
            );

        expect(standaloneNode.id).toMatch(/^node-[0-9a-f]{10}$/);
        expect(circle.id).toMatch(/^circle-[0-9a-f]{10}$/);
        expect(repeatStart?.data.controlPair?.id)
            .toMatch(/^control-pair-[0-9a-f]{10}$/);
        expect(preset && preset.id)
            .toMatch(/^user-preset-[0-9a-f]{10}$/);
    });
});
