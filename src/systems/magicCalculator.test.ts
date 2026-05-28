import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { calculateCircles, computeNodeRoles } from './magicCalculator';
import type { MagicNode, MagicType } from '../types/magic';

function node(id: string, magicType: MagicType = 'fire'): MagicNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: { magicType },
    };
}

function edge(source: string, target: string): Edge {
    return { id: `${source}-${target}`, source, target };
}

describe('calculateCircles', () => {
    it('returns an empty list for an empty graph', () => {
        expect(calculateCircles([], [])).toEqual([]);
    });

    it('creates a chain from a root node until the leaf node', () => {
        const nodes = [node('a'), node('b', 'water'), node('c', 'earth')];
        const edges = [edge('a', 'b'), edge('b', 'c')];

        expect(calculateCircles(nodes, edges)).toEqual([
            { id: 'circle-0', nodes },
        ]);
    });

    it('starts a new circle at nodes with multiple inputs', () => {
        const a = node('a');
        const b = node('b', 'water');
        const c = node('c', 'wind');
        const d = node('d', 'earth');
        const nodes = [a, b, c, d];
        const edges = [edge('a', 'c'), edge('b', 'c'), edge('c', 'd')];

        const circles = calculateCircles(nodes, edges);

        expect(circles.map(circle => circle.nodes.map(n => n.id))).toEqual([
            ['a'],
            ['b'],
            ['c', 'd'],
        ]);
    });
});

describe('computeNodeRoles', () => {
    it('marks roots and leaves from graph topology', () => {
        const nodes = [node('a'), node('b'), node('c')];
        const roles = computeNodeRoles(nodes, [edge('a', 'b')]);

        expect(roles.get('a')).toEqual({ isRoot: true, isLeaf: false });
        expect(roles.get('b')).toEqual({ isRoot: false, isLeaf: true });
        expect(roles.get('c')).toEqual({ isRoot: true, isLeaf: true });
    });
});
