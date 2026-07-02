import { describe, expect, it } from 'vitest';
import {
    EMPTY_MAGIC_STATS,
    type MagicStats,
} from '../../../types/magicStats';
import {
    type MagicCalculationResult,
    MAGIC_GRAPH_COMPLETION_ISSUES,
} from './magicCalculationTypes';
import {
    type MagicNode,
    type MagicUserNode,
} from '../magicGraphTypes';
import {
    type MagicStatEffectBundle,
} from '../../../types/magicStatEffects';
import {
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from '../model/magicCircleGraph';
import {
    applyMagicCircleConnectionJoinSlots,
} from '../model/magicCircleConnectionNodes';
import {
    normalizeMagicCircleSequences,
} from '../model/magicCircleGraphActions';
import { syncGraphTopology } from '../model/graphEventHandlers';
import { calculateMagic } from './magicCalculator';

const EMPTY_EFFECTS: MagicStatEffectBundle = {
    nodeEffects: [],
    finalEffects: [],
};

function node(
    id: string,
    magicType: string,
    settings?: Record<string, string>
): MagicUserNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: {
            magicType,
            nodeKind: 'user',
            ...(settings ? { settings } : {}),
        },
    };
}

function calculateSequence(
    nodes: MagicNode[],
    magicTypes: MagicTypeConfig[],
    effects: MagicStatEffectBundle = EMPTY_EFFECTS
): MagicCalculationResult {
    const circle = createMagicCircleNode(
        { x: 0, y: 0 },
        () => 'calculation'
    );

    return calculateMagic(
        [
            circle,
            ...nodes.map((item, index) =>
                attachNodeToCircle(item, circle, index)
            ),
        ],
        [],
        magicTypes,
        effects
    );
}

function expectStatsClose(
    actual: MagicStats,
    expected: MagicStats
): void {
    Object.keys(expected).forEach(key => {
        const statKey = key as keyof MagicStats;
        expect(actual[statKey]).toBeCloseTo(expected[statKey]);
    });
}

describe('calculateMagic explicit circle integration', () => {
    it('returns an empty calculation for a graph without circles', () => {
        expect(calculateMagic([], [])).toEqual({
            circles: [],
            circleStates: [],
            totalStats: EMPTY_MAGIC_STATS,
            totalStatAdjustments: EMPTY_MAGIC_STATS,
            completionIssue:
                MAGIC_GRAPH_COMPLETION_ISSUES.NO_CALCULABLE_CIRCLE,
        });
    });

    it('applies node effects before circle and total aggregation', () => {
        const magicTypes: MagicTypeConfig[] = [{
            type: 'ignition',
            label: 'Ignition',
            icon: '',
            color: '',
            category: 'basic',
            description: 'Ignition magic.',
            stats: {
                castingTime: 1,
                instability: 2,
                power: 1,
                range: 1,
                manaCost: 1,
                duration: 1,
            },
        }];
        const result = calculateSequence(
            [
                node('a', 'ignition'),
                node('b', 'ignition'),
            ],
            magicTypes,
            {
                nodeEffects: [
                    {
                        phase: 'node',
                        operation: 'multiply',
                        stat: 'instability',
                        value: 0.5,
                    },
                    {
                        phase: 'node',
                        operation: 'add',
                        stat: 'power',
                        value: 1,
                    },
                ],
                finalEffects: [],
            }
        );
        const expected: MagicStats = {
            castingTime: 2,
            instability: 2.2,
            power: 4,
            range: 1,
            manaCost: 2,
            duration: 2,
        };

        expectStatsClose(result.circles[0].stats, expected);
        expectStatsClose(result.totalStats, expected);
    });

    it('applies category and magic-type targets only to matching nodes', () => {
        const magicTypes: MagicTypeConfig[] = [
            {
                type: 'emit',
                label: 'Emit',
                icon: '',
                color: '',
                category: 'action',
                description: 'Emit magic.',
                stats: { power: 1, manaCost: 1 },
            },
            {
                type: 'move',
                label: 'Move',
                icon: '',
                color: '',
                category: 'action',
                description: 'Move magic.',
                stats: { power: 1, manaCost: 1 },
            },
            {
                type: 'ignition',
                label: 'Ignition',
                icon: '',
                color: '',
                category: 'basic',
                description: 'Ignition magic.',
                stats: { power: 1, manaCost: 1 },
            },
        ];
        const result = calculateSequence(
            [
                node('emit-a', 'emit'),
                node('emit-b', 'emit'),
                node('move', 'move'),
                node('basic', 'ignition'),
            ],
            magicTypes,
            {
                nodeEffects: [
                    {
                        phase: 'node',
                        operation: 'add',
                        stat: 'manaCost',
                        value: -1,
                        nodeTarget: { categories: ['action'] },
                    },
                    {
                        phase: 'node',
                        operation: 'add',
                        stat: 'power',
                        value: 2,
                        nodeTarget: {
                            categories: ['action'],
                            magicTypes: ['emit'],
                        },
                    },
                ],
                finalEffects: [],
            }
        );

        expect(result.circles[0].stats.manaCost).toBe(1);
        expect(result.circles[0].stats.power).toBe(8);
        expect(result.totalStats.manaCost).toBe(1);
        expect(result.totalStats.power).toBe(8);
    });

    it('clamps node and final effect results to stat bounds', () => {
        const magicTypes: MagicTypeConfig[] = [{
            type: 'test',
            label: 'Test',
            icon: '',
            color: '',
            category: 'action',
            description: 'Test magic.',
            stats: {
                castingTime: 0,
                instability: 0,
                power: 1,
                range: 1,
                manaCost: 0,
                duration: 1,
            },
        }];
        const result = calculateSequence(
            [node('a', 'test')],
            magicTypes,
            {
                nodeEffects: [{
                    phase: 'node',
                    operation: 'add',
                    stat: 'manaCost',
                    value: -1,
                    nodeTarget: { categories: ['action'] },
                }],
                finalEffects: [{
                    phase: 'final',
                    operation: 'add',
                    stat: 'power',
                    value: -10,
                }],
            }
        );

        expect(result.circles[0].stats.manaCost).toBe(0);
        expect(result.totalStats.manaCost).toBe(0);
        expect(result.totalStats.power).toBe(0);
        expect(result.totalStatAdjustments.power).toBe(-1);
    });

    it('applies node weight without scaling non-sustain duration', () => {
        const magicTypes: MagicTypeConfig[] = [{
            type: 'weighted',
            label: 'Weighted',
            icon: '',
            color: '',
            category: 'basic',
            description: 'Weighted magic.',
            stats: {
                castingTime: 1,
                instability: 1,
                power: 1,
                range: 1,
                manaCost: 1,
                duration: 1,
            },
        }];
        const result = calculateSequence(
            [node('weighted', 'weighted', { weight: '3' })],
            magicTypes
        );

        expect(result.totalStats).toEqual({
            castingTime: 3,
            instability: 3,
            power: 3,
            range: 3,
            manaCost: 3,
            duration: 1,
        });
    });

    it('applies final effects only to totals and reports net adjustments', () => {
        const magicTypes: MagicTypeConfig[] = [{
            type: 'test',
            label: 'Test',
            icon: '',
            color: '',
            category: 'basic',
            description: 'Test magic.',
            stats: {
                castingTime: 1,
                instability: 1,
                power: 3,
                range: 10,
                manaCost: 1,
                duration: 10,
            },
        }];
        const result = calculateSequence(
            [node('a', 'test')],
            magicTypes,
            {
                nodeEffects: [
                    {
                        phase: 'node',
                        operation: 'add',
                        stat: 'power',
                        value: 1,
                    },
                    {
                        phase: 'node',
                        operation: 'multiply',
                        stat: 'range',
                        value: 0.9,
                    },
                    {
                        phase: 'node',
                        operation: 'multiply',
                        stat: 'duration',
                        value: 0.5,
                    },
                ],
                finalEffects: [
                    {
                        phase: 'final',
                        operation: 'add',
                        stat: 'power',
                        value: 2,
                    },
                    {
                        phase: 'final',
                        operation: 'add',
                        stat: 'duration',
                        value: 5,
                    },
                ],
            }
        );

        expect(result.totalStats.power).toBe(6);
        expect(result.totalStats.range).toBe(9);
        expect(result.totalStats.duration).toBe(10);
        expect(result.totalStatAdjustments.power).toBe(3);
        expect(result.totalStatAdjustments.range).toBe(-1);
        expect(result.totalStatAdjustments.duration).toBe(0);
        expect(result.circles[0].stats.power).toBe(4);
        expect(result.circles[0].stats.duration).toBe(5);
    });

    it('merges at the join slot and continues serial calculation afterward', () => {
        const source = createMagicCircleNode(
            { x: -520, y: 0 },
            () => 'flow-source'
        );
        const target = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'flow-target'
        );
        const types: MagicTypeConfig[] = [
            {
                type: 'source',
                label: 'Source',
                icon: '',
                color: '',
                category: 'basic',
                description: '',
                stats: {
                    castingTime: 14,
                    instability: 1,
                    power: 14,
                    range: 14,
                    manaCost: 14,
                    duration: 14,
                },
            },
            {
                type: 'prefix',
                label: 'Prefix',
                icon: '',
                color: '',
                category: 'basic',
                description: '',
                stats: {
                    castingTime: 10,
                    instability: 1,
                    power: 10,
                    range: 10,
                    manaCost: 10,
                    duration: 10,
                },
            },
            {
                type: 'suffix',
                label: 'Suffix',
                icon: '',
                color: '',
                category: 'basic',
                description: '',
                stats: {
                    castingTime: 2,
                    instability: 1,
                    power: 3,
                    range: 2,
                    manaCost: 4,
                    duration: 5,
                },
            },
        ];
        const edge = {
            id: 'edge-flow',
            source: source.id,
            target: target.id,
            sourceHandle: 'circle-output',
            targetHandle: 'circle-input',
        };
        const connected = syncGraphTopology({
            nodes: [
                source,
                target,
                attachNodeToCircle(
                    node('source-node', 'source'),
                    source,
                    0
                ),
                attachNodeToCircle(
                    node('prefix-node', 'prefix'),
                    target,
                    0
                ),
                attachNodeToCircle(
                    node('suffix-node', 'suffix'),
                    target,
                    1
                ),
            ],
            edges: [edge],
        });
        const graphNodes = normalizeMagicCircleSequences(
            applyMagicCircleConnectionJoinSlots(
                connected.nodes,
                new Map([[edge.id, 1]])
            )
        );
        const result = calculateMagic(
            graphNodes,
            connected.edges,
            types
        );
        const targetStats = result.circles.find(circle =>
            circle.id === target.id
        )!.stats;

        expect(targetStats).toMatchObject({
            castingTime: 16,
            power: 27,
            range: 28,
            manaCost: 28,
            duration: 19,
        });
        expect(result.totalStats).toEqual(targetStats);
        expect(result.completionIssue).toBeUndefined();
    });

    it('treats an input-only join circle as a calculable terminal', () => {
        const source = createMagicCircleNode(
            { x: -520, y: 0 },
            () => 'join-only-source'
        );
        const target = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'join-only-target'
        );
        const types: MagicTypeConfig[] = [{
            type: 'source',
            label: 'Source',
            icon: '',
            color: '',
            category: 'basic',
            description: '',
            stats: {
                castingTime: 2,
                instability: 3,
                power: 4,
                range: 5,
                manaCost: 6,
                duration: 7,
            },
        }];
        const edge = {
            id: 'edge-join-only',
            source: source.id,
            target: target.id,
            sourceHandle: 'circle-output',
            targetHandle: 'circle-input',
        };
        const connected = syncGraphTopology({
            nodes: [
                source,
                target,
                attachNodeToCircle(
                    node('source-node', 'source'),
                    source,
                    0
                ),
            ],
            edges: [edge],
        });
        const result = calculateMagic(
            connected.nodes,
            connected.edges,
            types
        );

        expect(result.completionIssue).toBeUndefined();
        expect(result.circles.find(circle =>
            circle.id === target.id
        )?.stats).toEqual(result.totalStats);
    });
});
