import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import {
    GRAPH_EDGE_TYPES, GRAPH_NODE_TYPES, MAGIC_NODE_HANDLE_CONFIG, MAGIC_NODE_KINDS, } from '../../../constants/graphConfigs';
import { MAGIC_CONNECTION_RULE_KEYS } from '../../../constants/nodeEditorConfigs';
import {
    createEdge,
    createEdgeUpdate,
    createNode,
    filterEdgesForDeletedNodes,
    normalizeEdgeHandles,
    refreshNodeRoles,
    resolveNodeHandleCounts,
} from './graphActions';
import type { MagicNode, MagicTypeConfig } from '../../../types/magic';
import { createMagicCircleNode } from './magicCircleGraph';

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
    {
        type: 'repeat',
        label: 'Repeat',
        icon: '',
        color: '#fff',
        category: 'control',
        description: 'repeat',
        connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
    },
] as MagicTypeConfig[];

function node(id: string, magicType: MagicNode['data']['magicType'] = 'ignition'): MagicNode {
    return {
        id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
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
            type: GRAPH_NODE_TYPES.MAGIC_NODE,
            position: { x: 10, y: 20 },
            data: {
                magicType: 'stream',
                nodeKind: MAGIC_NODE_KINDS.USER,
                isRoot: true,
                isLeaf: true,
                inputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
                outputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
            },
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
            sourceHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
            targetHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID,
            type: GRAPH_EDGE_TYPES.MAGIC_EDGE,
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

    it('compacts dynamic external circle ports', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'ports');
        const edges: Edge[] = [
            {
                id: 'input-later',
                source: 'source',
                target: circle.id,
                sourceHandle: 'output-0',
                targetHandle: 'circle-input-2',
            },
            {
                id: 'output-later',
                source: circle.id,
                target: 'target',
                sourceHandle: 'circle-output-3',
                targetHandle: 'input-0',
            },
        ];

        expect(normalizeEdgeHandles(edges, [circle])).toEqual([
            { ...edges[0], targetHandle: 'circle-input' },
            { ...edges[1], sourceHandle: 'circle-output' },
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

    it('adds one visible input handle for full nodes that can receive a cycle input', () => {
        const source = node('source');
        const target = node('target');
        const middle = node('middle');
        const repeat = node('repeat', 'repeat');
        const nodes = [source, target, middle, repeat];

        expect(resolveNodeHandleCounts(
            target,
            [
                edge('source', 'target'),
                edge('target', 'middle'),
                edge('middle', 'repeat'),
            ],
            magicTypes,
            nodes
        )).toMatchObject({
            inputHandleCount: 2,
            cycleInputHandleIndex: 1,
            cycleInputHandleConnected: false,
        });
    });

    it('does not add a cycle input handle when no downstream repeat output can close a cycle', () => {
        const source = node('source');
        const target = node('target');
        const middle = node('middle');
        const nodes = [source, target, middle];

        expect(resolveNodeHandleCounts(
            target,
            [
                edge('source', 'target'),
                edge('target', 'middle'),
            ],
            magicTypes,
            nodes
        )).toMatchObject({ inputHandleCount: 1 });
    });

    it('keeps the connected cycle input handle visible and disabled after a cycle edge is added', () => {
        const source = node('source');
        const target = node('target');
        const middle = node('middle');
        const repeat = node('repeat', 'repeat');
        const nodes = [source, target, middle, repeat];

        expect(resolveNodeHandleCounts(
            target,
            [
                edge('source', 'target'),
                edge('target', 'middle'),
                edge('middle', 'repeat'),
                { ...edge('repeat', 'target'), targetHandle: 'input-1' },
            ],
            magicTypes,
            nodes
        )).toMatchObject({
            inputHandleCount: 2,
            cycleInputHandleIndex: 1,
            cycleInputHandleConnected: true,
        });
    });

    it('hides other cycle input handles after a cycle edge is added', () => {
        const sourceA = node('source-a');
        const sourceB = node('source-b');
        const targetA = node('target-a');
        const targetB = node('target-b');
        const middle = node('middle');
        const repeat = node('repeat', 'repeat');
        const nodes = [sourceA, sourceB, targetA, targetB, middle, repeat];

        expect(resolveNodeHandleCounts(
            targetB,
            [
                edge('source-a', 'target-a'),
                edge('source-b', 'target-b'),
                edge('target-a', 'middle'),
                { ...edge('target-b', 'middle'), targetHandle: 'input-1' },
                edge('middle', 'repeat'),
                { ...edge('repeat', 'target-a'), targetHandle: 'input-1' },
            ],
            magicTypes,
            nodes
        )).toMatchObject({
            inputHandleCount: 1,
            cycleInputHandleIndex: undefined,
            cycleInputHandleConnected: undefined,
        });
    });
});
