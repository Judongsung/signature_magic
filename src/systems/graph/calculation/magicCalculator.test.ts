import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { calculateCircles, calculateMagic, computeNodeRoles } from './magicCalculator';
import { EMPTY_MAGIC_STATS, type MagicNode, type MagicStats, type MagicType, type MagicTypeConfig } from '../../../types/magic';
import {
    MAGIC_CONNECTION_RULE_KEYS,
    MAGIC_NODE_EDITOR_BEHAVIORS,
    MAGIC_NODE_EDITOR_CONTROLS,
    MAGIC_NODE_EDITOR_PRESENTATIONS,
} from '../../../constants/gameConfigs';

function node(
    id: string,
    magicType: MagicType = 'ignition',
    settings?: Record<string, string>
): MagicNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: { magicType, settings },
    };
}

function edge(source: string, target: string): Edge {
    return { id: `${source}-${target}`, source, target };
}

function circle(nodes: MagicNode[]) {
    return { id: 'circle-0', nodes, stats: EMPTY_MAGIC_STATS };
}

function expectStatsClose(actual: MagicStats, expected: MagicStats): void {
    Object.entries(expected).forEach(([key, value]) => {
        expect(actual[key as keyof MagicStats]).toBeCloseTo(value);
    });
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

        expectStatsClose(calculateCircles(nodes, edges, magicTypes)[0].stats, {
            castingTime: 3,
            instability: 5.75,
            power: 7,
            range: 20,
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

    it('builds a cycle circle from the cycle target to the output-cycle source', () => {
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
            ['b', 'a', 'repeat'],
        ]);
    });

    it('folds a cycle-closing repeat node into the cycle path and keeps other branches separate', () => {
        const target = node('target', 'ignition');
        const split = node('split', 'split');
        const repeat = node('repeat', 'repeat');
        const other = node('other', 'stream');
        const nodes = [target, split, repeat, other];
        const edges = [
            edge('target', 'split'),
            edge('split', 'repeat'),
            edge('split', 'other'),
            edge('repeat', 'target'),
        ];
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
            ['target', 'split', 'repeat'],
            ['other'],
        ]);
    });

    it('expands a cycle circle to include the single predecessor chain before the cycle target', () => {
        const a = node('a', 'ignition');
        const b = node('b', 'stream');
        const c = node('c', 'soil');
        const repeat = node('repeat', 'repeat');
        const nodes = [a, b, c, repeat];
        const edges = [
            edge('a', 'b'),
            edge('b', 'c'),
            edge('c', 'repeat'),
            edge('repeat', 'b'),
        ];
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
            ['a', 'b', 'c', 'repeat'],
        ]);
    });

    it('expands a cycle circle through the selected split branch and keeps other branches separate', () => {
        const a = node('a', 'ignition');
        const split = node('split', 'split');
        const b = node('b', 'stream');
        const repeat = node('repeat', 'repeat');
        const other = node('other', 'soil');
        const nodes = [a, split, b, repeat, other];
        const edges = [
            edge('a', 'split'),
            edge('split', 'b'),
            edge('split', 'other'),
            edge('b', 'repeat'),
            edge('repeat', 'b'),
        ];
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
            ['b', 'repeat'],
            ['a', 'split'],
            ['other'],
        ]);
    });

    it('does not expand nested cycle circles past their branch predecessor', () => {
        const root = node('root', 'detect');
        const split = node('split', 'branch');
        const outerRepeat = node('outer-repeat', 'repeat');
        const nestedTarget = node('nested-target', 'detect');
        const nestedSplit = node('nested-split', 'branch');
        const nestedRepeat = node('nested-repeat', 'repeat');
        const output = node('output', 'stream');
        const nodes = [
            root,
            split,
            outerRepeat,
            nestedTarget,
            nestedSplit,
            nestedRepeat,
            output,
        ];
        const edges = [
            edge('root', 'split'),
            edge('split', 'outer-repeat'),
            edge('outer-repeat', 'root'),
            edge('split', 'nested-target'),
            edge('nested-target', 'nested-split'),
            edge('nested-split', 'nested-repeat'),
            edge('nested-repeat', 'nested-target'),
            edge('nested-split', 'output'),
        ];
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
            ['root', 'split', 'outer-repeat'],
            ['nested-target', 'nested-split', 'nested-repeat'],
            ['output'],
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
        expectStatsClose(result.totalStats, {
            castingTime: 7,
            instability: 4,
            power: 10,
            range: 8,
            manaCost: 10,
            duration: 7,
        });
    });

    it('uses the largest circle instability for total instability', () => {
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

        expect(result.circles.map(circle => circle.stats.instability)).toEqual([
            expect.closeTo(3.45),
            expect.closeTo(3),
            expect.closeTo(4),
        ]);
        expect(result.totalStats.instability).toBeCloseTo(4);
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
            ['b', 'a', 'repeat'],
        ]);
        expectStatsClose(result.totalStats, {
            castingTime: 6,
            instability: 7.935,
            power: 6,
            range: 6,
            manaCost: 6,
            duration: 6,
        });
    });

    it('calculates cycle-closing repeat stats as part of the cycle circle', () => {
        const target = node('target', 'ignition');
        const split = node('split', 'split');
        const repeat = node('repeat', 'repeat');
        const other = node('other', 'stream');
        const nodes = [target, split, repeat, other];
        const edges = [
            edge('target', 'split'),
            edge('split', 'repeat'),
            edge('split', 'other'),
            edge('repeat', 'target'),
        ];
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
                type: 'split',
                label: 'Split',
                icon: '',
                color: '',
                category: 'extension',
                description: 'Split magic.',
                stats: { castingTime: 2, instability: 2, power: 2, range: 2, manaCost: 2, duration: 2 },
            },
            {
                type: 'repeat',
                label: 'Repeat',
                icon: '',
                color: '',
                category: 'control',
                description: 'Repeat magic.',
                stats: { castingTime: 3, instability: 3, power: 3, range: 3, manaCost: 3, duration: 3 },
                connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
            },
            {
                type: 'stream',
                label: 'Stream',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Stream magic.',
                stats: { castingTime: 4, instability: 4, power: 4, range: 4, manaCost: 4, duration: 4 },
            },
        ] as MagicTypeConfig[];

        const result = calculateMagic(nodes, edges, magicTypes);

        expect(result.circles.map(circle => circle.nodes.map(n => n.id))).toEqual([
            ['target', 'split', 'repeat'],
            ['other'],
        ]);
        expect(result.circles.map(circle => circle.stats.castingTime)).toEqual([6, 4]);
        expect(result.totalStats.instability).toBeCloseTo(
            Math.max(...result.circles.map(circle => circle.stats.instability))
        );
    });

    it('calculates stats from the expanded cycle circle when the cycle targets a middle node', () => {
        const a = node('a', 'ignition');
        const b = node('b', 'stream');
        const c = node('c', 'soil');
        const repeat = node('repeat', 'repeat');
        const nodes = [a, b, c, repeat];
        const edges = [
            edge('a', 'b'),
            edge('b', 'c'),
            edge('c', 'repeat'),
            edge('repeat', 'b'),
        ];
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
                type: 'stream',
                label: 'Stream',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Stream magic.',
                stats: { castingTime: 2, instability: 2, power: 2, range: 2, manaCost: 2, duration: 2 },
            },
            {
                type: 'soil',
                label: 'Soil',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Soil magic.',
                stats: { castingTime: 3, instability: 3, power: 3, range: 3, manaCost: 3, duration: 3 },
            },
            {
                type: 'repeat',
                label: 'Repeat',
                icon: '',
                color: '',
                category: 'control',
                description: 'Repeat magic.',
                stats: { castingTime: 4, instability: 4, power: 4, range: 4, manaCost: 4, duration: 4 },
                connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
            },
        ] as MagicTypeConfig[];

        const result = calculateMagic(nodes, edges, magicTypes);

        expect(result.circles.map(circle => circle.nodes.map(n => n.id))).toEqual([
            ['a', 'b', 'c', 'repeat'],
        ]);
        expect(result.circles.map(circle => circle.stats.castingTime)).toEqual([10]);
        expect(result.totalStats.instability).toBeCloseTo(result.circles[0].stats.instability);
    });

    it('repeats cycle stats except instability for a finite repeat count', () => {
        const nodes = [
            node('a', 'ignition'),
            node('b', 'stream'),
            node('c', 'soil'),
            node('repeat', 'repeat', { repeatCount: '3' }),
        ];
        const edges = [
            edge('a', 'b'),
            edge('b', 'c'),
            edge('c', 'repeat'),
            edge('repeat', 'b'),
        ];
        const magicTypes = [
            {
                type: 'ignition',
                label: 'Ignition',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Ignition magic.',
                stats: { castingTime: 1, instability: 1, power: 1, range: 2, manaCost: 1, duration: 1 },
            },
            {
                type: 'stream',
                label: 'Stream',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Stream magic.',
                stats: { castingTime: 2, instability: 2, power: 2, range: 2, manaCost: 2, duration: 2 },
            },
            {
                type: 'soil',
                label: 'Soil',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Soil magic.',
                stats: { castingTime: 3, instability: 3, power: 3, range: 3, manaCost: 3, duration: 3 },
            },
            {
                type: 'repeat',
                label: 'Repeat',
                icon: '',
                color: '',
                category: 'control',
                description: 'Repeat magic.',
                instanceEditor: {
                    fields: [
                        {
                            key: 'repeatCount',
                            label: 'Count',
                            control: MAGIC_NODE_EDITOR_CONTROLS.STEPPER,
                            min: 0,
                            max: 99,
                            step: 1,
                            defaultValue: 0,
                            presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL_SUFFIX,
                            behavior: MAGIC_NODE_EDITOR_BEHAVIORS.CYCLE_REPEAT_COUNT,
                        },
                    ],
                },
                stats: { castingTime: 4, instability: 4, power: 4, range: 4, manaCost: 4, duration: 4 },
                connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
            },
        ] as MagicTypeConfig[];

        const result = calculateMagic(nodes, edges, magicTypes);
        const expectedInstability = 10 * (1.15 ** 3);

        expect(result.circles[0].nodes.map(item => item.id)).toEqual(['a', 'b', 'c', 'repeat']);
        expectStatsClose(result.circles[0].stats, {
            castingTime: 28,
            instability: expectedInstability,
            power: 28,
            range: 27_648,
            manaCost: 28,
            duration: 28,
        });
        expectStatsClose(result.totalStats, {
            castingTime: 28,
            instability: expectedInstability,
            power: 28,
            range: 27_648,
            manaCost: 28,
            duration: 28,
        });
    });

    it('calculates infinite and disconnected repeats once', () => {
        const repeatType = {
            type: 'repeat',
            label: 'Repeat',
            icon: '',
            color: '',
            category: 'control',
            description: 'Repeat magic.',
            instanceEditor: {
                fields: [
                    {
                        key: 'repeatCount',
                        label: 'Count',
                        control: MAGIC_NODE_EDITOR_CONTROLS.STEPPER,
                        min: 0,
                        max: 99,
                        step: 1,
                        defaultValue: 0,
                        presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL_SUFFIX,
                        behavior: MAGIC_NODE_EDITOR_BEHAVIORS.CYCLE_REPEAT_COUNT,
                    },
                ],
            },
            stats: { castingTime: 4, instability: 4, power: 4, range: 4, manaCost: 4, duration: 4 },
            connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
        } satisfies MagicTypeConfig;
        const ignitionType = {
            type: 'ignition',
            label: 'Ignition',
            icon: '',
            color: '',
            category: 'basic',
            description: 'Ignition magic.',
            stats: { castingTime: 1, instability: 1, power: 1, range: 2, manaCost: 1, duration: 1 },
        } satisfies MagicTypeConfig;
        const infiniteCycle = calculateMagic(
            [node('a'), node('repeat', 'repeat', { repeatCount: '0' })],
            [edge('a', 'repeat'), edge('repeat', 'a')],
            [ignitionType, repeatType]
        );
        const disconnectedRepeat = calculateMagic(
            [node('a'), node('repeat', 'repeat', { repeatCount: '3' })],
            [edge('a', 'repeat')],
            [ignitionType, repeatType]
        );
        const expected = {
            castingTime: 5,
            instability: 5.75,
            power: 5,
            range: 8,
            manaCost: 5,
            duration: 5,
        };

        expectStatsClose(infiniteCycle.circles[0].stats, expected);
        expectStatsClose(infiniteCycle.totalStats, expected);
        expectStatsClose(disconnectedRepeat.circles[0].stats, expected);
        expectStatsClose(disconnectedRepeat.totalStats, expected);
    });

    it('applies node stat effects before circle and total stat calculation', () => {
        const nodes = [node('a', 'ignition'), node('b', 'ignition')];
        const edges = [edge('a', 'b')];
        const magicTypes = [
            {
                type: 'ignition',
                label: 'Ignition',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Ignition magic.',
                stats: { castingTime: 1, instability: 2, power: 1, range: 1, manaCost: 1, duration: 1 },
            },
        ] as MagicTypeConfig[];

        const result = calculateMagic(nodes, edges, magicTypes, {
            nodeEffects: [
                { phase: 'node', operation: 'multiply', stat: 'instability', value: 0.5 },
                { phase: 'node', operation: 'add', stat: 'power', value: 1 },
            ],
            finalEffects: [],
        });

        expectStatsClose(result.totalStats, {
            castingTime: 2,
            instability: 2.3,
            power: 4,
            range: 1,
            manaCost: 2,
            duration: 2,
        });
        expectStatsClose(result.circles[0].stats, {
            castingTime: 2,
            instability: 2.3,
            power: 4,
            range: 1,
            manaCost: 2,
            duration: 2,
        });
    });

    it('applies final stat effects to total stats without changing circle stats', () => {
        const nodes = [node('a', 'ignition')];
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
        ] as MagicTypeConfig[];

        const result = calculateMagic(nodes, [], magicTypes, {
            nodeEffects: [],
            finalEffects: [
                { phase: 'final', operation: 'add', stat: 'power', value: 3 },
                { phase: 'final', operation: 'multiply', stat: 'range', value: 2 },
            ],
        });

        expectStatsClose(result.totalStats, {
            castingTime: 1,
            instability: 1,
            power: 4,
            range: 2,
            manaCost: 1,
            duration: 1,
        });
        expectStatsClose(result.circles[0].stats, {
            castingTime: 1,
            instability: 1,
            power: 1,
            range: 1,
            manaCost: 1,
            duration: 1,
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
