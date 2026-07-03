import { describe, expect, it } from 'vitest';
import {
    MAGIC_STAT_DISPLAY_CONTEXTS,
} from '../../constants/magicStatPresentationConfigs';
import {
    formatMagicStat,
    formatMagicStatAdjustment,
    resolveMagicStatGrade,
} from './magicStatFormatting';

describe('magicStatFormatting', () => {
    it('formats physical units and abstract values by context', () => {
        expect(formatMagicStat(
            'castingTime',
            71.5,
            MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL
        )).toBe('71.5초');
        expect(formatMagicStat(
            'duration',
            85,
            MAGIC_STAT_DISPLAY_CONTEXTS.CIRCLE
        )).toBe('85초');
        expect(formatMagicStat(
            'range',
            3,
            MAGIC_STAT_DISPLAY_CONTEXTS.NODE
        )).toBe('×3');
        expect(formatMagicStat(
            'range',
            3,
            MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL
        )).toBe('3m');
        expect(formatMagicStat(
            'manaCost',
            12.345,
            MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL
        )).toBe('12.35 마나');
        expect(formatMagicStat(
            'power',
            4,
            MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL
        )).toBe('4');
    });

    it('formats signed adjustments with context-specific units', () => {
        expect(formatMagicStatAdjustment(
            'castingTime',
            1,
            MAGIC_STAT_DISPLAY_CONTEXTS.CIRCLE
        )).toBe('+1초');
        expect(formatMagicStatAdjustment(
            'range',
            1,
            MAGIC_STAT_DISPLAY_CONTEXTS.NODE
        )).toBe('+1배');
        expect(formatMagicStatAdjustment(
            'range',
            -0.5,
            MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL
        )).toBe('-0.5m');
        expect(formatMagicStatAdjustment(
            'manaCost',
            2,
            MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL
        )).toBe('+2 마나');
        expect(formatMagicStatAdjustment(
            'power',
            0.004,
            MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL
        )).toBeUndefined();
    });

    it.each([
        [0, '없음'],
        [4, '미약'],
        [4.01, '실용'],
        [14, '실용'],
        [14.01, '강력'],
        [39.99, '강력'],
        [40, '대규모'],
    ])('resolves final power %s as %s', (value, grade) => {
        expect(resolveMagicStatGrade(
            'power',
            value,
            MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL
        )).toBe(grade);
    });

    it.each([
        [5, '안정'],
        [5.01, '주의'],
        [10, '주의'],
        [10.01, '위험'],
        [15, '위험'],
        [15.01, '극위험'],
    ])('resolves final instability %s as %s', (
        value,
        grade
    ) => {
        expect(resolveMagicStatGrade(
            'instability',
            value,
            MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL
        )).toBe(grade);
    });

    it('does not expose grades outside final total stats', () => {
        expect(resolveMagicStatGrade(
            'power',
            40,
            MAGIC_STAT_DISPLAY_CONTEXTS.CIRCLE
        )).toBeUndefined();
        expect(resolveMagicStatGrade(
            'manaCost',
            40,
            MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL
        )).toBeUndefined();
    });
});
