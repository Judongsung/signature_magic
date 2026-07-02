import { describe, expect, it } from 'vitest';
import {
    MAGIC_STAT_RULES,
    clampMagicStats,
    clampMagicStatValue,
    resolveMagicStatBounds,
} from './magicStatRules';
import {
    type MagicNode,
} from '../magicGraphTypes';
import {
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';

function calculationNode(
    id: string,
    magicType = 'test',
    options: {
        excludeFromStatScaling?: boolean;
        nodeKind?: 'user' | 'system';
    } = {}
): MagicNode {
    const base = {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
    };
    const scalingData = options.excludeFromStatScaling
        ? { excludeFromStatScaling: true as const }
        : {};

    return options.nodeKind === 'system'
        ? {
            ...base,
            data: {
                magicType,
                nodeKind: 'system',
                ...scalingData,
            },
        }
        : {
            ...base,
            data: {
                magicType,
                nodeKind: 'user',
                ...scalingData,
            },
        };
}

describe('magicStatRules', () => {
    const magicTypes = new Map<string, MagicTypeConfig>([
        ['test', {
            type: 'test',
            label: 'Test',
            icon: '',
            color: '',
            category: 'basic',
            description: '',
        }],
        ['detect', {
            type: 'detect',
            label: 'Detect',
            icon: '',
            color: '',
            category: 'extension',
            description: '',
        }],
        ['repeat', {
            type: 'repeat',
            label: 'Repeat',
            icon: '',
            color: '',
            category: 'extension',
            description: '',
        }],
        ['manifestation', {
            type: 'manifestation',
            label: 'Manifestation',
            icon: '',
            color: '',
            category: 'control',
            description: '',
        }],
    ]);

    it('clamps values to configured minimum and maximum bounds', () => {
        expect(clampMagicStatValue(-2, { minimum: 0 })).toBe(0);
        expect(clampMagicStatValue(12, { maximum: 10 })).toBe(10);
        expect(clampMagicStatValue(5, { minimum: 0, maximum: 10 })).toBe(5);
    });

    it('applies configured stat bounds to every stat', () => {
        expect(clampMagicStats({
            castingTime: -1,
            instability: -2,
            power: -3,
            range: -4,
            manaCost: -5,
            duration: -6,
        })).toEqual({
            castingTime: 0,
            instability: 0,
            power: 0,
            range: 0,
            manaCost: 0,
            duration: 0,
        });
    });

    it('resolves node-specific overrides without changing result bounds', () => {
        expect(resolveMagicStatBounds(
            { minimum: 0, maximum: 10 },
            { minimum: null }
        )).toEqual({ maximum: 10 });
        expect(resolveMagicStatBounds(
            { minimum: 0, maximum: 10 },
            { minimum: -5, maximum: null }
        )).toEqual({ minimum: -5 });

        expect(MAGIC_STAT_RULES.instability.clampNodeValue(-4)).toBe(0);
        expect(MAGIC_STAT_RULES.instability.clampNodeValue(-4, {
            instability: { minimum: null },
        })).toBe(-4);
        expect(MAGIC_STAT_RULES.instability.clampValue(-4)).toBe(0);
    });

    it('excludes control and system nodes from the node-count exponent', () => {
        const nodes = [
            calculationNode('detect', 'detect'),
            calculationNode('repeat', 'repeat'),
            calculationNode('manifestation', 'manifestation', {
                nodeKind: 'system',
            }),
        ];
        const scaled = MAGIC_STAT_RULES.instability.scaleFinalValue(2, {
            nodes,
            magicTypes,
            nodeExecutionCounts: new Map(nodes.map(node => [node.id, 9])),
        });

        expect(scaled).toBe(2);
    });

    it('uses nested execution counts only for ordinary unit nodes', () => {
        const nodes = [
            calculationNode('outside'),
            calculationNode('nested-repeat-start', 'repeat'),
            calculationNode('nested-content'),
            calculationNode('repeat-end', 'repeat', {
                excludeFromStatScaling: true,
            }),
            calculationNode('manifestation', 'manifestation', {
                nodeKind: 'system',
            }),
        ];
        const scaled = MAGIC_STAT_RULES.instability.scaleFinalValue(2, {
            nodes,
            magicTypes,
            nodeExecutionCounts: new Map([
                ['nested-repeat-start', 3],
                ['nested-content', 6],
                ['repeat-end', 3],
                ['manifestation', 6],
            ]),
        });

        expect(scaled).toBeCloseTo(2 * (1.1 ** 6));
    });
});
