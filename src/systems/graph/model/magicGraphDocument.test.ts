import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import { createMagicGraphDocument } from './magicGraphDocument';

describe('magicGraphDocument', () => {
    it('removes transient node and edge view state', () => {
        const node = {
            ...createTestMagicNode('document-node'),
            selected: true,
            dragging: true,
            measured: { width: 120, height: 80 },
        };
        const edge: Edge = {
            id: 'document-edge',
            source: 'source',
            target: 'target',
            selected: true,
        };

        const document = createMagicGraphDocument({
            nodes: [node],
            edges: [edge],
        });

        expect(document.nodes[0]).not.toHaveProperty('selected');
        expect(document.nodes[0]).not.toHaveProperty('dragging');
        expect(document.nodes[0]).not.toHaveProperty('measured');
        expect(document.edges[0]).not.toHaveProperty('selected');
        expect(document.nodes[0]).toMatchObject({
            id: node.id,
            position: node.position,
            data: node.data,
        });
    });

    it('does not mutate the source snapshot', () => {
        const node = {
            ...createTestMagicNode('source-node'),
            selected: true,
        };
        const nodes = [node];

        createMagicGraphDocument({ nodes, edges: [] });

        expect(nodes[0]).toBe(node);
        expect(nodes[0].selected).toBe(true);
    });
});
