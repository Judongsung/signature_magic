import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { calculateCircles, computeNodeRoles } from './magicCalculator';
import { EMPTY_MAGIC_STATS, type MagicNode, type MagicType, type MagicTypeConfig } from '../../types/magic';

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

function circle(nodes: MagicNode[]) {
    return { id: 'circle-0', nodes, stats: EMPTY_MAGIC_STATS };
}

describe('calculateCircles', () => {
    it('returns an empty list for an empty graph', () => {
        expect(calculateCircles([], [])).toEqual([]);
    });

    it('creates a chain from a root node until the leaf node', () => {
        const nodes = [node('a'), node('b', 'water'), node('c', 'earth')];
        const edges = [edge('a', 'b'), edge('b', 'c')];

        expect(calculateCircles(nodes, edges)).toEqual([
            circle(nodes),
        ]);
    });

    it('adds node stats for each calculated circle', () => {
        const nodes = [node('a', 'fire'), node('b', 'water')];
        const edges = [edge('a', 'b')];
        const magicTypes = [
            {
                type: 'fire',
                label: 'Fire',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Fire magic.',
                stats: { castingTime: 1, instability: 2, power: 3, range: 4, manaCost: 5, duration: 6 },
            },
            {
                type: 'water',
                label: 'Water',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Water magic.',
                stats: { castingTime: 2, instability: 3, power: 4, range: 5, manaCost: 6, duration: 7 },
            },
        ] as MagicTypeConfig[];

        expect(calculateCircles(nodes, edges, magicTypes)[0].stats).toEqual({
            castingTime: 3,
            instability: 5,
            power: 7,
            range: 9,
            manaCost: 11,
            duration: 13,
        });
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

    it('separates the pre-split circle from each branch after a split node', () => {
        const a = node('a');
        const split = node('split', 'split');
        const b = node('b', 'water');
        const c = node('c', 'earth');
        const nodes = [a, split, b, c];
        const edges = [edge('a', 'split'), edge('split', 'b'), edge('split', 'c')];

        const circles = calculateCircles(nodes, edges);

        expect(circles.map(circle => circle.nodes.map(n => n.id))).toEqual([
            ['a', 'split'],
            ['b'],
            ['c'],
        ]);
    });

    it('keeps split branches and post-merge circles separate', () => {
        const a = node('a');
        const split = node('split', 'split');
        const b = node('b', 'water');
        const c = node('c', 'earth');
        const merge = node('merge', 'merge');
        const d = node('d', 'wind');
        const nodes = [a, split, b, c, merge, d];
        const edges = [
            edge('a', 'split'),
            edge('split', 'b'),
            edge('split', 'c'),
            edge('b', 'merge'),
            edge('c', 'merge'),
            edge('merge', 'd'),
        ];

        const circles = calculateCircles(nodes, edges);

        expect(circles.map(circle => circle.nodes.map(n => n.id))).toEqual([
            ['a', 'split'],
            ['b'],
            ['c'],
            ['merge', 'd'],
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
