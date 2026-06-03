import { describe, expect, it } from 'vitest';
import { applyMagicStatEffects, applyMagicStatEffectsToStats } from './magicStatEffects';

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
});
