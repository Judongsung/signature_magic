import { describe, expect, it } from 'vitest';
import {
    applyMagicStatEffectSummary,
    applyMagicStatEffects,
    applyMagicStatEffectsToStats,
    buildMagicStatEffectSummary,
    filterMagicStatEffectsForNode,
} from './magicStatEffects';

describe('magicStatEffects', () => {
    it('applies multipliers before additive effects for a stat', () => {
        expect(applyMagicStatEffects(10, 'power', [
            { phase: 'final', operation: 'add', stat: 'power', value: 2 },
            { phase: 'final', operation: 'multiply', stat: 'power', value: 1.5 },
        ])).toBe(17);
    });

    it('ignores effects for other stats', () => {
        expect(applyMagicStatEffects(10, 'range', [
            { phase: 'final', operation: 'add', stat: 'power', value: 2 },
        ])).toBe(10);
    });

    it('builds a reusable summary for stat effects', () => {
        const summary = buildMagicStatEffectSummary([
            { phase: 'final', operation: 'multiply', stat: 'power', value: 2 },
            { phase: 'final', operation: 'multiply', stat: 'power', value: 1.5 },
            { phase: 'final', operation: 'add', stat: 'power', value: -5 },
            { phase: 'final', operation: 'add', stat: 'manaCost', value: -3 },
        ]);

        expect(summary.power).toEqual({ multiplier: 3, addition: -5 });
        expect(summary.manaCost).toEqual({ multiplier: 1, addition: -3 });
        expect(applyMagicStatEffectSummary(10, 'power', summary)).toBe(25);
        expect(applyMagicStatEffectSummary(10, 'range', summary)).toBe(10);
    });

    it('applies effects across a stat object', () => {
        expect(applyMagicStatEffectsToStats({
            castingTime: 1,
            instability: 2,
            power: 3,
            range: 4,
            manaCost: 5,
            duration: 6,
        }, [
            { phase: 'final', operation: 'multiply', stat: 'power', value: 2 },
            { phase: 'final', operation: 'add', stat: 'manaCost', value: -1 },
        ])).toEqual({
            castingTime: 1,
            instability: 2,
            power: 6,
            range: 4,
            manaCost: 4,
            duration: 6,
        });
    });

    it('filters node effects by category and magic type', () => {
        const effects = [
            { phase: 'node', operation: 'add', stat: 'power', value: 1 },
            {
                phase: 'node',
                operation: 'add',
                stat: 'power',
                value: 2,
                nodeTarget: { categories: ['action'] },
            },
            {
                phase: 'node',
                operation: 'add',
                stat: 'power',
                value: 4,
                nodeTarget: { magicTypes: ['emit'] },
            },
            {
                phase: 'node',
                operation: 'add',
                stat: 'power',
                value: 8,
                nodeTarget: {
                    categories: ['action'],
                    magicTypes: ['emit'],
                },
            },
        ] as const;

        expect(filterMagicStatEffectsForNode(effects, {
            category: 'action',
            magicType: 'emit',
        }).map(effect => effect.value)).toEqual([1, 2, 4, 8]);
        expect(filterMagicStatEffectsForNode(effects, {
            category: 'action',
            magicType: 'move',
        }).map(effect => effect.value)).toEqual([1, 2]);
        expect(filterMagicStatEffectsForNode(effects, {
            category: 'basic',
            magicType: 'emit',
        }).map(effect => effect.value)).toEqual([1, 4]);
        expect(filterMagicStatEffectsForNode(effects).map(effect => effect.value)).toEqual([1]);
    });
});
