import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import {
    type MagicNode,
} from '../magicGraphTypes';
import {
    type MagicType,
} from '../../../types/magicTypeConfig';
import { buildGraphTopology, buildOutEdgeMap } from './graphTopology';
import {
    canReach,
    findNearestCommonReachableNode,
    reachableDistances,
    reachableNodeIds,
} from './graphTraversal';

function node(id: string, magicType: MagicType = 'ignition'): MagicNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: { magicType, nodeKind: 'user' },
    };
}

function edge(source: string, target: string): Edge {
    return { id: `${source}-${target}`, source, target };
}

describe('graphTopology', () => {
    it('builds graph indexes and ignores edges with missing endpoints', () => {
        const topology = buildGraphTopology(
            [node('a'), node('b'), node('c')],
            [edge('a', 'b'), edge('missing', 'c'), edge('b', 'missing')]
        );

        expect(topology.edges).toEqual([edge('a', 'b')]);
        expect(topology.nodeMap.get('a')?.id).toBe('a');
        expect(topology.outEdges.get('a')).toEqual(['b']);
        expect(topology.inDegree.get('b')).toBe(1);
        expect(topology.rootIds).toEqual(['a', 'c']);
    });

    it('builds an edge-only outgoing map for connection validation', () => {
        const outEdges = buildOutEdgeMap([edge('a', 'b'), edge('a', 'c')]);

        expect(outEdges.get('a')).toEqual(['b', 'c']);
    });
});

describe('graphTraversal', () => {
    it('checks reachability without looping forever on cycles', () => {
        const topology = buildGraphTopology(
            [node('a'), node('b'), node('c')],
            [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')]
        );

        expect(canReach(topology, 'a', 'c')).toBe(true);
        expect(canReach(topology, 'c', 'missing')).toBe(false);
    });

    it('finds all reachable node ids from multiple starts', () => {
        const topology = buildGraphTopology(
            [node('a'), node('b'), node('c'), node('d')],
            [edge('a', 'b'), edge('c', 'd')]
        );

        expect(reachableNodeIds(topology, ['a', 'c'])).toEqual(new Set(['a', 'b', 'c', 'd']));
    });

    it('finds reachable node ids without looping forever on cycles', () => {
        const topology = buildGraphTopology(
            [node('a'), node('b'), node('c'), node('d')],
            [edge('a', 'b'), edge('b', 'c'), edge('c', 'a'), edge('b', 'd')]
        );

        expect(reachableNodeIds(topology, ['a'])).toEqual(new Set(['a', 'b', 'c', 'd']));
    });

    it('finds shortest reachable distances from the start node', () => {
        const topology = buildGraphTopology(
            [node('a'), node('b'), node('c'), node('d')],
            [edge('a', 'b'), edge('a', 'c'), edge('b', 'd'), edge('c', 'd'), edge('d', 'b')]
        );

        expect(reachableDistances(topology, 'a')).toEqual(new Map([
            ['a', 0],
            ['b', 1],
            ['c', 1],
            ['d', 2],
        ]));
    });

    it('finds the nearest common reachable node', () => {
        const topology = buildGraphTopology(
            [node('a'), node('b'), node('c'), node('d'), node('e')],
            [edge('a', 'c'), edge('b', 'd'), edge('c', 'e'), edge('d', 'e')]
        );

        expect(findNearestCommonReachableNode(topology, ['a', 'b'])).toBe('e');
    });
});
