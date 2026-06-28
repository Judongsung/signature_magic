import { describe, expect, it } from 'vitest';
import {
    MAGIC_STAT_RULES,
    clampMagicStats,
    clampMagicStatValue,
    resolveMagicStatBounds,
} from './magicStatRules';

describe('magicStatRules', () => {
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
});
