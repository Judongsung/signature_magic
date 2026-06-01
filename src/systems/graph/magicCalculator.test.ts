import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { calculateCircles, calculateMagic, computeNodeRoles } from './magicCalculator';
import { EMPTY_MAGIC_STATS, type MagicNode, type MagicType, type MagicTypeConfig } from '../../types/magic';
import { MAGIC_CONNECTION_RULE_KEYS } from '../../constants/gameConfigs';

function node(id: string, magicType: MagicType = 'ignition'): MagicNode {
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
        const nodes = [node('a'), node('b', 'stream'), node('c', 'soil')];
        const edges = [edge('a', 'b'), edge('b', 'c')];

        expect(calculateCircles(nodes, edges)).toEqual([
            circle(nodes),
        ]);
    });

    it('adds node stats for each calculated circle', () => {
        const nodes = [node('a', 'ignition'), node('b', 'stream')];
        const edges = [edge('a', 'b')];
        const magicTypes = [
            {
                type: 'ignition',
                label: 'Fire',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Fire magic.',
                stats: { castingTime: 1, instability: 2, power: 3, range: 4, manaCost: 5, duration: 6 },
            },
            {
                type: 'stream',
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
        const b = node('b', 'stream');
        const c = node('c', 'air');
        const d = node('d', 'soil');
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
        const b = node('b', 'stream');
        const c = node('c', 'soil');
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
        const b = node('b', 'stream');
        const c = node('c', 'soil');
        const merge = node('merge', 'merge');
        const d = node('d', 'air');
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

    it('starts a circular chain at a node that allows output cycles', () => {
        const a = node('a');
        const repeat = node('repeat', 'repeat');
        const b = node('b', 'stream');
        const nodes = [a, repeat, b];
        const edges = [edge('a', 'repeat'), edge('repeat', 'b'), edge('b', 'a')];
        const magicTypes = [
            {
                type: 'repeat',
                label: 'Repeat',
                icon: '',
                color: '',
                category: 'control',
                description: 'Repeat magic.',
                connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
            },
        ] as MagicTypeConfig[];

        const circles = calculateCircles(nodes, edges, magicTypes);

        expect(circles.map(circle => circle.nodes.map(n => n.id))).toEqual([
            ['repeat', 'b', 'a'],
        ]);
    });
});

describe('calculateMagic', () => {
    it('returns circle stats and total graph stats separately', () => {
        const a = node('a', 'ignition');
        const split = node('split', 'split');
        const b = node('b', 'stream');
        const c = node('c', 'soil');
        const nodes = [a, split, b, c];
        const edges = [edge('a', 'split'), edge('split', 'b'), edge('split', 'c')];
        const magicTypes = [
            {
                type: 'ignition',
                label: 'Fire',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Fire magic.',
                stats: { castingTime: 1, instability: 1, power: 1, range: 1, manaCost: 1, duration: 1 },
            },
            {
                type: 'split',
                label: 'Split',
                icon: '',
                color: '',
                category: 'extension',
                description: 'Split magic.',
                stats: { castingTime: 2, instability: 2, power: 2, range: 2, manaCost: 2, duration: 2 },
            },
            {
                type: 'stream',
                label: 'Water',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Water magic.',
                stats: { castingTime: 3, instability: 3, power: 3, range: 3, manaCost: 3, duration: 3 },
            },
            {
                type: 'soil',
                label: 'Earth',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Earth magic.',
                stats: { castingTime: 4, instability: 4, power: 4, range: 4, manaCost: 4, duration: 4 },
            },
        ] as MagicTypeConfig[];

        const result = calculateMagic(nodes, edges, magicTypes);

        expect(result.circles.map(circle => circle.stats.castingTime)).toEqual([3, 3, 4]);
        expect(result.totalStats).toEqual({
            castingTime: 10,
            instability: 10,
            power: 10,
            range: 10,
            manaCost: 10,
            duration: 10,
        });
    });

    it('counts each node once when the graph is circular', () => {
        const a = node('a', 'ignition');
        const repeat = node('repeat', 'repeat');
        const b = node('b', 'stream');
        const nodes = [a, repeat, b];
        const edges = [edge('a', 'repeat'), edge('repeat', 'b'), edge('b', 'a')];
        const magicTypes = [
            {
                type: 'ignition',
                label: 'Ignition',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Ignition magic.',
                stats: { castingTime: 1, instability: 1, power: 1, range: 1, manaCost: 1, duration: 1 },
            },
            {
                type: 'repeat',
                label: 'Repeat',
                icon: '',
                color: '',
                category: 'control',
                description: 'Repeat magic.',
                stats: { castingTime: 2, instability: 2, power: 2, range: 2, manaCost: 2, duration: 2 },
                connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
            },
            {
                type: 'stream',
                label: 'Stream',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Stream magic.',
                stats: { castingTime: 3, instability: 3, power: 3, range: 3, manaCost: 3, duration: 3 },
            },
        ] as MagicTypeConfig[];

        const result = calculateMagic(nodes, edges, magicTypes);

        expect(result.circles.map(circle => circle.nodes.map(n => n.id))).toEqual([
            ['repeat', 'b', 'a'],
        ]);
        expect(result.totalStats).toEqual({
            castingTime: 6,
            instability: 6,
            power: 6,
            range: 6,
            manaCost: 6,
            duration: 6,
        });
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
