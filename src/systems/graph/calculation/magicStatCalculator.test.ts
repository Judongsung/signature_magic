import { describe, expect, it } from 'vitest';
import {
    type MagicUserNode,
} from '../magicGraphTypes';
import {
    type MagicStats,
} from '../../../types/magicStats';
import {
    type MagicType,
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import {
    buildMagicTypeMap,
    calculateMagicStats,
} from './magicStatCalculator';

function node(
    id: string,
    magicType: MagicType,
    settings?: Record<string, string>
): MagicUserNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: {
            magicType,
            settings,
            nodeKind: 'user',
        },
    };
}

function magicType(
    type: MagicType,
    value: number,
    config: Partial<MagicTypeConfig> = {}
): MagicTypeConfig {
    return {
        type,
        label: type,
        icon: '',
        color: '',
        category: 'basic',
        description: `${type} magic.`,
        stats: {
            castingTime: value,
            instability: value,
            power: value,
            range: value,
            manaCost: value,
            duration: value,
        },
        ...config,
    };
}

function expectStatsClose(
    actual: MagicStats,
    expected: MagicStats
): void {
    Object.entries(expected).forEach(([key, value]) => {
        expect(actual[key as keyof MagicStats]).toBeCloseTo(value);
    });
}

describe('calculateMagicStats', () => {
    it('aggregates a circle through the configured stat rules', () => {
        const nodes = [
            node('a', 'ignition'),
            node('b', 'stream'),
        ];
        const magicTypes = buildMagicTypeMap([
            magicType('ignition', 2),
            magicType('stream', 3),
        ]);

        expectStatsClose(
            calculateMagicStats(nodes, magicTypes),
            {
                castingTime: 5,
                instability: 5.5,
                power: 5,
                range: 6,
                manaCost: 5,
                duration: 5,
            }
        );
    });

    it('applies node effects, bounds, weight, and repeats in order', () => {
        const nodes = [
            node('a', 'ignition', { weight: '3' }),
        ];
        const magicTypes = buildMagicTypeMap([
            magicType('ignition', 2, {
                category: 'action',
                statBounds: { power: { maximum: 5 } },
            }),
        ]);

        expectStatsClose(
            calculateMagicStats(
                nodes,
                magicTypes,
                [{
                    phase: 'node',
                    operation: 'add',
                    stat: 'power',
                    value: 10,
                }],
                new Map([['a', 2]])
            ),
            {
                castingTime: 4,
                instability: 6.6,
                power: 30,
                range: 64,
                manaCost: 12,
                duration: 4,
            }
        );
    });

    it('weights sustain duration but ignores weight on control nodes', () => {
        const sustainStats = calculateMagicStats(
            [node('sustain', 'sustain', { weight: '3' })],
            buildMagicTypeMap([
                magicType('sustain', 2, {
                    category: 'control',
                }),
            ])
        );
        const controlStats = calculateMagicStats(
            [node('detect', 'detect', { weight: '9' })],
            buildMagicTypeMap([
                magicType('detect', 2, {
                    category: 'extension',
                }),
            ])
        );

        expect(sustainStats.duration).toBe(6);
        expect(controlStats).toEqual({
            castingTime: 2,
            instability: 2,
            power: 2,
            range: 2,
            manaCost: 2,
            duration: 2,
        });
    });

    it('treats registered statless nodes as serial identities', () => {
        const ordinary = magicType('ordinary', 2);
        const statless: MagicTypeConfig = {
            type: 'detect',
            label: '감지',
            icon: '',
            color: '',
            category: 'extension',
            description: '대상을 찾아낸다.',
        };
        const magicTypes = buildMagicTypeMap([ordinary, statless]);
        const withoutStatless = calculateMagicStats(
            [node('ordinary', 'ordinary')],
            magicTypes
        );
        const withStatless = calculateMagicStats(
            [
                node('ordinary', 'ordinary'),
                node('detect', 'detect'),
            ],
            magicTypes
        );

        expect(withStatless).toEqual(withoutStatless);
    });

    it('scales stabilization costs by execution count while ignoring control-node weight', () => {
        const magicTypes = buildMagicTypeMap([
            magicType('ordinary', 2),
            magicType('stabilize', 0, {
                category: 'extension',
                instabilityNodeCountReduction: 2,
                stats: {
                    castingTime: 3.5,
                    instability: 0,
                    power: 0,
                    range: 1,
                    manaCost: 4,
                    duration: 0,
                },
            }),
        ]);
        const stats = calculateMagicStats(
            [
                node('ordinary', 'ordinary'),
                node('stabilize', 'stabilize', { weight: '2' }),
            ],
            magicTypes,
            [],
            new Map([
                ['ordinary', 4],
                ['stabilize', 3],
            ])
        );

        expectStatsClose(stats, {
            castingTime: 18.5,
            instability: 2,
            power: 8,
            range: 16,
            manaCost: 20,
            duration: 8,
        });
    });

    it('amplifies the accumulated power and charges for the added output', () => {
        const source = magicType('source', 0, {
            stats: {
                power: 10,
                range: 1,
            },
        });
        const amplify = magicType('amplify', 0, {
            category: 'control',
            powerAmplification: {
                factor: 1.5,
                manaCostPerAddedPower: 1,
            },
            stats: {
                castingTime: 1.5,
                instability: 3,
                power: 0,
                range: 1,
                manaCost: 5,
                duration: 0,
            },
        });
        const magicTypes = buildMagicTypeMap([source, amplify]);

        expectStatsClose(
            calculateMagicStats(
                [
                    node('source', 'source'),
                    node('amplify', 'amplify'),
                ],
                magicTypes
            ),
            {
                castingTime: 1.5,
                instability: 3.3,
                power: 15,
                range: 1,
                manaCost: 10,
                duration: 0,
            }
        );
        expect(calculateMagicStats(
            [
                node('amplify', 'amplify'),
                node('source', 'source'),
            ],
            magicTypes
        ).power).toBe(10);
    });

    it('compounds weighted and repeated amplification applications', () => {
        const source = magicType('source', 0, {
            stats: {
                power: 10,
                range: 1,
            },
        });
        const amplify = magicType('amplify', 0, {
            category: 'control',
            powerAmplification: {
                factor: 1.5,
                manaCostPerAddedPower: 1,
            },
            stats: {
                power: 0,
                range: 1,
                manaCost: 5,
            },
        });
        const result = calculateMagicStats(
            [
                node('source', 'source'),
                node('amplify', 'amplify', { weight: '2' }),
            ],
            buildMagicTypeMap([source, amplify]),
            [],
            new Map([['amplify', 3]])
        );
        const expectedPower = 10 * (1.5 ** 6);

        expect(result.power).toBeCloseTo(expectedPower);
        expect(result.manaCost).toBeCloseTo(
            5 * 6 + expectedPower - 10
        );
    });
});
