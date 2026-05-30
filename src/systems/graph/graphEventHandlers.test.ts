import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import type { MagicNode, MagicTypeConfig } from '../../types/magic';
import {
    prepareGraphEdge,
    removeDeletedGraphElements,
    syncGraphTopology,
} from './graphEventHandlers';

const magicTypes = [
    { type: 'fire', label: 'Fire', icon: '', color: '#fff', category: 'basic', description: 'basic' },
    {
        type: 'merge',
        label: 'Merge',
        icon: '',
        color: '#fff',
        category: 'extension',
        description: 'merge',
        connectionLimits: { maxInputs: null, maxOutputs: 1 },
    },
] as MagicTypeConfig[];

function node(id: string, magicType: MagicNode['data']['magicType'] = 'fire'): MagicNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: { magicType, isRoot: true, isLeaf: true, inputHandleCount: 1, outputHandleCount: 1 },
    };
}

function edge(id: string, source: string, target: string, targetHandle = 'input-0'): Edge {
    return { id, source, target, sourceHandle: 'output-0', targetHandle };
}

describe('graphEventHandlers', () => {
    it('prepares an edge update and removes the edge occupying the same handle', () => {
        const update = prepareGraphEdge(
            { source: 'a', target: 'c', sourceHandle: 'output-0', targetHandle: 'input-0' },
            {
                nodes: [node('a'), node('b'), node('c')],
                edges: [edge('old', 'a', 'b')],
            },
            magicTypes
        );

        expect(update && update.edges).toEqual([]);
        expect(update && update.edge).toMatchObject({ source: 'a', target: 'c' });
    });

    it('removes deleted nodes and edges from a graph snapshot', () => {
        expect(removeDeletedGraphElements(
            {
                nodes: [node('a'), node('b'), node('c')],
                edges: [edge('a-b', 'a', 'b'), edge('b-c', 'b', 'c'), edge('a-c', 'a', 'c')],
            },
            [node('b')],
            [edge('a-c', 'a', 'c')]
        )).toEqual({
            nodes: [node('a'), node('c')],
            edges: [],
        });
    });

    it('syncs topology by compacting handles and refreshing node roles', () => {
        const result = syncGraphTopology(
            {
                nodes: [node('a'), node('b'), node('merge', 'merge')],
                edges: [
                    edge('b-merge', 'b', 'merge', 'input-1'),
                    edge('a-merge', 'a', 'merge', 'input-2'),
                ],
            },
            magicTypes
        );

        expect(result.changed).toBe(true);
        expect(result.edges.map(item => item.targetHandle)).toEqual(['input-0', 'input-1']);
        expect(result.nodes.find(item => item.id === 'merge')?.data).toMatchObject({
            isRoot: false,
            inputHandleCount: 3,
        });
    });
});
