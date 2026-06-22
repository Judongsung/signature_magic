import { describe, expect, it } from 'vitest';
import {
    formatMagicStat,
    formatMagicStatAdjustment,
} from './magicStatFormatting';

describe('magicStatFormatting', () => {
    it('formats values and signed adjustments with the same precision', () => {
        expect(formatMagicStat(4)).toBe('4');
        expect(formatMagicStatAdjustment(1)).toBe('+1');
        expect(formatMagicStatAdjustment(-0.3)).toBe('-0.3');
        expect(formatMagicStatAdjustment(0.126)).toBe('+0.13');
    });

    it('omits adjustments that round to zero at display precision', () => {
        expect(formatMagicStatAdjustment(0)).toBeUndefined();
        expect(formatMagicStatAdjustment(0.004)).toBeUndefined();
        expect(formatMagicStatAdjustment(-0.004)).toBeUndefined();
    });
});
