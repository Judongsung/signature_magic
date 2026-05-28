import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { createEdge, createNode, filterEdgesForDeletedNodes, refreshNodeRoles } from './graphActions';
import type { MagicNode } from '../types/magic';

function node(id: string): MagicNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: { magicType: 'fire', isRoot: true, isLeaf: true },
    };
}

function edge(source: string, target: string): Edge {
    return { id: `${source}-${target}`, source, target };
}

describe('graphActions', () => {
    it('creates nodes with injected stable ids', () => {
        const created = createNode('water', { x: 10, y: 20 }, () => 'fixed-id');

        expect(created).toEqual({
            id: 'node-fixed-id',
            type: 'magicNode',
            position: { x: 10, y: 20 },
            data: { magicType: 'water', isRoot: true, isLeaf: true },
        });
    });

    it('creates validated edges with injected stable ids', () => {
        const created = createEdge(
            { source: 'a', target: 'b', sourceHandle: 'output', targetHandle: null },
            [],
            () => 'edge-id'
        );

        expect(created).toEqual({
            id: 'edge-edge-id',
            source: 'a',
            target: 'b',
            sourceHandle: 'output',
            targetHandle: null,
            type: 'magicEdge',
        });
    });

    it('returns false for invalid edges', () => {
        expect(createEdge(
            { source: 'a', target: 'c', sourceHandle: null, targetHandle: null },
            [edge('a', 'b')]
        )).toBe(false);
    });

    it('refreshes node roles only when topology changes the role flags', () => {
        const nodes = [node('a'), node('b')];

        const result = refreshNodeRoles(nodes, [edge('a', 'b')]);

        expect(result.changed).toBe(true);
        expect(result.nodes[0].data).toMatchObject({ isRoot: true, isLeaf: false });
        expect(result.nodes[1].data).toMatchObject({ isRoot: false, isLeaf: true });
    });

    it('keeps the same node references when role flags are already current', () => {
        const nodes = [
            { ...node('a'), data: { magicType: 'fire' as const, isRoot: true, isLeaf: false } },
            { ...node('b'), data: { magicType: 'fire' as const, isRoot: false, isLeaf: true } },
        ];

        const result = refreshNodeRoles(nodes, [edge('a', 'b')]);

        expect(result.changed).toBe(false);
        expect(result.nodes).toEqual(nodes);
    });

    it('filters edges connected to deleted nodes', () => {
        expect(filterEdgesForDeletedNodes(
            new Set(['b']),
            [edge('a', 'b'), edge('b', 'c'), edge('c', 'd')]
        )).toEqual([edge('c', 'd')]);
    });
});
