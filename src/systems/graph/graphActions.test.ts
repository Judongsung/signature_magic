import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import {
    createEdge,
    createEdgeUpdate,
    createNode,
    filterEdgesForDeletedNodes,
    normalizeEdgeHandles,
    refreshNodeRoles,
    resolveNodeHandleCounts,
} from './graphActions';
import type { MagicNode, MagicTypeConfig } from '../../types/magic';

const magicTypes = [
    { type: 'ignition', label: 'Ignition', icon: '', color: '#fff', category: 'basic', description: 'basic' },
    {
        type: 'split',
        label: 'Split',
        icon: '',
        color: '#fff',
        category: 'extension',
        description: 'split',
        connectionLimits: { maxInputs: 1, maxOutputs: null },
    },
] as MagicTypeConfig[];

function node(id: string, magicType: MagicNode['data']['magicType'] = 'ignition'): MagicNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: { magicType, isRoot: true, isLeaf: true, inputHandleCount: 1, outputHandleCount: 1 },
    };
}

function edge(source: string, target: string): Edge {
    return { id: `${source}-${target}`, source, target };
}

describe('graphActions', () => {
    it('creates nodes with injected stable ids', () => {
        const created = createNode('stream', { x: 10, y: 20 }, () => 'fixed-id');

        expect(created).toEqual({
            id: 'node-fixed-id',
            type: 'magicNode',
            position: { x: 10, y: 20 },
            data: { magicType: 'stream', isRoot: true, isLeaf: true, inputHandleCount: 1, outputHandleCount: 1 },
        });
    });

    it('creates validated edges with injected stable ids', () => {
        const created = createEdge(
            { source: 'a', target: 'b', sourceHandle: 'output-0', targetHandle: null },
            [],
            [node('a'), node('b')],
            magicTypes,
            () => 'edge-id'
        );

        expect(created).toEqual({
            id: 'edge-edge-id',
            source: 'a',
            target: 'b',
            sourceHandle: 'output-0',
            targetHandle: 'input-0',
            type: 'magicEdge',
        });
    });

    it('returns false for invalid edges', () => {
        expect(createEdge(
            { source: 'a', target: 'c', sourceHandle: 'output-1', targetHandle: null },
            [edge('a', 'b')],
            [node('a'), node('b'), node('c')],
            magicTypes
        )).toBe(false);
    });

    it('returns replacement edges when reusing an occupied handle', () => {
        const existing = { ...edge('a', 'b'), sourceHandle: 'output-0', targetHandle: 'input-0' };
        const update = createEdgeUpdate(
            { source: 'a', target: 'c', sourceHandle: 'output-0', targetHandle: 'input-0' },
            [existing],
            [node('a'), node('b'), node('c')],
            magicTypes,
            () => 'edge-id'
        );

        expect(update && update.edges).toEqual([]);
        expect(update && update.edge).toMatchObject({
            source: 'a',
            target: 'c',
            sourceHandle: 'output-0',
            targetHandle: 'input-0',
        });
    });

    it('refreshes node roles and handle counts when topology changes', () => {
        const nodes = [node('a'), node('b')];

        const result = refreshNodeRoles(nodes, [edge('a', 'b')], magicTypes);

        expect(result.changed).toBe(true);
        expect(result.nodes[0].data).toMatchObject({ isRoot: true, isLeaf: false, outputHandleCount: 1 });
        expect(result.nodes[1].data).toMatchObject({ isRoot: false, isLeaf: true, inputHandleCount: 1 });
    });

    it('keeps the same node references when role flags and handle counts are already current', () => {
        const nodes = [
            { ...node('a'), data: { magicType: 'ignition' as const, isRoot: true, isLeaf: false, inputHandleCount: 1, outputHandleCount: 1 } },
            { ...node('b'), data: { magicType: 'ignition' as const, isRoot: false, isLeaf: true, inputHandleCount: 1, outputHandleCount: 1 } },
        ];

        const result = refreshNodeRoles(nodes, [edge('a', 'b')], magicTypes);

        expect(result.changed).toBe(false);
        expect(result.nodes).toEqual(nodes);
    });

    it('filters edges connected to deleted nodes', () => {
        expect(filterEdgesForDeletedNodes(
            new Set(['b']),
            [edge('a', 'b'), edge('b', 'c'), edge('c', 'd')]
        )).toEqual([edge('c', 'd')]);
    });

    it('compacts handle ids after an earlier connection is deleted', () => {
        expect(normalizeEdgeHandles([
            { ...edge('a', 'merge'), id: 'second', targetHandle: 'input-1' },
            { ...edge('b', 'merge'), id: 'third', targetHandle: 'input-2' },
            { ...edge('split', 'c'), id: 'out-second', sourceHandle: 'output-1' },
        ])).toEqual([
            { ...edge('a', 'merge'), id: 'second', sourceHandle: 'output-0', targetHandle: 'input-0' },
            { ...edge('b', 'merge'), id: 'third', sourceHandle: 'output-0', targetHandle: 'input-1' },
            { ...edge('split', 'c'), id: 'out-second', sourceHandle: 'output-0', targetHandle: 'input-0' },
        ]);
    });

    it('adds one visible output handle for unlimited-output nodes after each used handle', () => {
        expect(resolveNodeHandleCounts(
            node('a', 'split'),
            [
                { ...edge('a', 'b'), sourceHandle: 'output-0' },
                { ...edge('a', 'c'), sourceHandle: 'output-1' },
            ],
            magicTypes
        )).toMatchObject({ outputHandleCount: 3 });
    });
});
