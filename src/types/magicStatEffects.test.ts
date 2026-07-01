import { describe, expect, it } from 'vitest';
import {
    createEmptyMagicStatEffectBundle,
    MAGIC_STAT_EFFECT_OPERATION_IDS,
    MAGIC_STAT_EFFECT_OPERATIONS,
    MAGIC_STAT_EFFECT_PHASE,
    MAGIC_STAT_EFFECT_PHASES,
} from './magicStatEffects';

describe('magicStatEffects', () => {
    it('creates independent empty stat effect bundles', () => {
        const first = createEmptyMagicStatEffectBundle();
        const second = createEmptyMagicStatEffectBundle();

        first.nodeEffects.push({
            phase: MAGIC_STAT_EFFECT_PHASE.NODE,
            operation: MAGIC_STAT_EFFECT_OPERATION_IDS.ADD,
            stat: 'power',
            value: 1,
        });

        expect(second.nodeEffects).toEqual([]);
        expect(second.finalEffects).toEqual([]);
    });

    it('derives validation values from the named runtime constants', () => {
        expect(MAGIC_STAT_EFFECT_PHASES).toEqual(
            Object.values(MAGIC_STAT_EFFECT_PHASE)
        );
        expect(MAGIC_STAT_EFFECT_OPERATIONS).toEqual(
            Object.values(MAGIC_STAT_EFFECT_OPERATION_IDS)
        );
    });
});
