import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import type { MagicNode, MagicStats, MagicType, MagicTypeConfig } from '../../../types/magic';
import { MAGIC_CONNECTION_RULE_KEYS } from '../../../constants/gameConfigs';
import { buildMagicTypeMap, calculateMagicStats } from './magicStatCalculator';
import { hasMagicStatRuleForEveryKey } from './magicStatRules';

function node(id: string, magicType: MagicType): MagicNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: { magicType },
    };
}

function magicType(type: MagicType, value: number, config: Partial<MagicTypeConfig> = {}): MagicTypeConfig {
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

function edge(source: string, target: string): Edge {
    return { id: `${source}-${target}`, source, target };
}

function expectStatsClose(actual: MagicStats, expected: MagicStats): void {
    Object.entries(expected).forEach(([key, value]) => {
        expect(actual[key as keyof MagicStats]).toBeCloseTo(value);
    });
}

describe('calculateMagicStats', () => {
    it('uses a stat rule for every supported magic stat', () => {
        expect(hasMagicStatRuleForEveryKey()).toBe(true);
    });

    it('calculates every stat through the rule table', () => {
        const nodes = [node('a', 'ignition'), node('b', 'stream')];
        const edges: Edge[] = [];
        const magicTypes = buildMagicTypeMap([
            magicType('ignition', 2),
            magicType('stream', 3),
        ]);

        expectStatsClose(calculateMagicStats(nodes, edges, magicTypes, 'total'), {
            castingTime: 5,
            instability: 5.75,
            power: 5,
            range: 3,
            manaCost: 5,
            duration: 5,
        });
    });

    it('multiplies flat circle range values through the stat rule table', () => {
        const nodes = [node('a', 'ignition'), node('b', 'stream')];
        const edges: Edge[] = [];
        const magicTypes = buildMagicTypeMap([
            magicType('ignition', 2),
            magicType('stream', 3),
        ]);

        expectStatsClose(calculateMagicStats(nodes, edges, magicTypes, 'circle'), {
            castingTime: 5,
            instability: 5.75,
            power: 5,
            range: 6,
            manaCost: 5,
            duration: 5,
        });
    });

    it('multiplies serial range values through the stat rule table', () => {
        const nodes = [node('a', 'ignition'), node('b', 'stream')];
        const edges = [edge('a', 'b')];
        const magicTypes = buildMagicTypeMap([
            magicType('ignition', 2),
            magicType('stream', 4),
        ]);

        expectStatsClose(calculateMagicStats(nodes, edges, magicTypes, 'total'), {
            castingTime: 6,
            instability: 6.9,
            power: 6,
            range: 8,
            manaCost: 6,
            duration: 6,
        });
    });

    it('uses node configured branch aggregation for total casting time', () => {
        const nodes = [
            node('ignition', 'ignition'),
            node('split', 'split'),
            node('stream', 'stream'),
            node('soil', 'soil'),
            node('merge', 'merge'),
            node('air', 'air'),
        ];
        const edges = [
            edge('ignition', 'split'),
            edge('split', 'stream'),
            edge('split', 'soil'),
            edge('stream', 'merge'),
            edge('soil', 'merge'),
            edge('merge', 'air'),
        ];
        const magicTypes = buildMagicTypeMap([
            magicType('ignition', 1),
            magicType('split', 2, {
                category: 'extension',
                statRules: { castingTime: { branchAggregation: 'max' } },
            }),
            magicType('stream', 3),
            magicType('soil', 4),
            magicType('merge', 5, { category: 'extension' }),
            magicType('air', 6),
        ]);

        expectStatsClose(calculateMagicStats(nodes, edges, magicTypes, 'total'), {
            castingTime: 18,
            instability: 42.24,
            power: 21,
            range: 240,
            manaCost: 21,
            duration: 21,
        });
    });

    it('uses merge node branch aggregation when parallel roots join', () => {
        const nodes = [
            node('ignition', 'ignition'),
            node('stream', 'stream'),
            node('merge', 'merge'),
            node('air', 'air'),
        ];
        const edges = [
            edge('ignition', 'merge'),
            edge('stream', 'merge'),
            edge('merge', 'air'),
        ];
        const magicTypes = buildMagicTypeMap([
            magicType('ignition', 1),
            magicType('stream', 3),
            magicType('merge', 5, {
                category: 'extension',
                statRules: { castingTime: { branchAggregation: 'max' } },
            }),
            magicType('air', 6),
        ]);

        expectStatsClose(calculateMagicStats(nodes, edges, magicTypes, 'total'), {
            castingTime: 14,
            instability: 22.81,
            power: 15,
            range: 90,
            manaCost: 15,
            duration: 15,
        });
    });

    it('counts circular graphs once per node instead of requiring a root', () => {
        const nodes = [
            node('ignition', 'ignition'),
            node('repeat', 'repeat'),
            node('stream', 'stream'),
        ];
        const edges = [
            edge('ignition', 'repeat'),
            edge('repeat', 'stream'),
            edge('stream', 'ignition'),
        ];
        const magicTypes = buildMagicTypeMap([
            magicType('ignition', 1),
            magicType('repeat', 2, {
                category: 'control',
                connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
            }),
            magicType('stream', 3),
        ]);

        expectStatsClose(calculateMagicStats(nodes, edges, magicTypes, 'total'), {
            castingTime: 6,
            instability: 7.935,
            power: 6,
            range: 6,
            manaCost: 6,
            duration: 6,
        });
    });
});
