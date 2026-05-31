import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import type { MagicNode, MagicType, MagicTypeConfig } from '../../types/magic';
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

describe('calculateMagicStats', () => {
    it('uses a stat rule for every supported magic stat', () => {
        expect(hasMagicStatRuleForEveryKey()).toBe(true);
    });

    it('calculates every stat through the rule table', () => {
        const nodes = [node('a', 'fire'), node('b', 'water')];
        const edges: Edge[] = [];
        const magicTypes = buildMagicTypeMap([
            magicType('fire', 2),
            magicType('water', 3),
        ]);

        expect(calculateMagicStats(nodes, edges, magicTypes, 'total')).toEqual({
            castingTime: 5,
            instability: 5,
            power: 5,
            range: 5,
            manaCost: 5,
            duration: 5,
        });
    });

    it('uses node configured branch aggregation for total casting time', () => {
        const nodes = [
            node('fire', 'fire'),
            node('split', 'split'),
            node('water', 'water'),
            node('earth', 'earth'),
            node('merge', 'merge'),
            node('wind', 'wind'),
        ];
        const edges = [
            edge('fire', 'split'),
            edge('split', 'water'),
            edge('split', 'earth'),
            edge('water', 'merge'),
            edge('earth', 'merge'),
            edge('merge', 'wind'),
        ];
        const magicTypes = buildMagicTypeMap([
            magicType('fire', 1),
            magicType('split', 2, {
                category: 'extension',
                statRules: { castingTime: { branchAggregation: 'max' } },
            }),
            magicType('water', 3),
            magicType('earth', 4),
            magicType('merge', 5, { category: 'extension' }),
            magicType('wind', 6),
        ]);

        expect(calculateMagicStats(nodes, edges, magicTypes, 'total')).toEqual({
            castingTime: 18,
            instability: 21,
            power: 21,
            range: 21,
            manaCost: 21,
            duration: 21,
        });
    });

    it('uses merge node branch aggregation when parallel roots join', () => {
        const nodes = [
            node('fire', 'fire'),
            node('water', 'water'),
            node('merge', 'merge'),
            node('wind', 'wind'),
        ];
        const edges = [
            edge('fire', 'merge'),
            edge('water', 'merge'),
            edge('merge', 'wind'),
        ];
        const magicTypes = buildMagicTypeMap([
            magicType('fire', 1),
            magicType('water', 3),
            magicType('merge', 5, {
                category: 'extension',
                statRules: { castingTime: { branchAggregation: 'max' } },
            }),
            magicType('wind', 6),
        ]);

        expect(calculateMagicStats(nodes, edges, magicTypes, 'total')).toEqual({
            castingTime: 14,
            instability: 15,
            power: 15,
            range: 15,
            manaCost: 15,
            duration: 15,
        });
    });
});
