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
                castingTime: 12,
                instability: 6.6,
                power: 30,
                range: 36,
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
});
