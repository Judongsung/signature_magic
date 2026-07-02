import { describe, expect, it } from 'vitest';
import {
    formatMagicMana,
    isManaCostWithinMaximum,
    resolveMaximumMana,
} from './magicMana';

describe('magicMana', () => {
    it('adds modifiers to the default maximum and clamps at zero', () => {
        expect(resolveMaximumMana([])).toBe(100);
        expect(resolveMaximumMana([20, -5])).toBe(115);
        expect(resolveMaximumMana([-150])).toBe(0);
    });

    it('compares and formats mana at display precision', () => {
        expect(isManaCostWithinMaximum(100.004, 100)).toBe(true);
        expect(isManaCostWithinMaximum(100.006, 100)).toBe(false);
        expect(formatMagicMana(12.345)).toBe('12.35');
        expect(formatMagicMana(12)).toBe('12');
    });
});
