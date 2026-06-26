import { describe, expect, it } from 'vitest';
import {
    createEmptyMagicStatEffectBundle,
    MAGIC_STAT_EFFECT_PHASE,
} from './magicStatEffectBundles';

describe('magicStatEffectBundles', () => {
    it('creates independent empty stat effect bundles', () => {
        const first = createEmptyMagicStatEffectBundle();
        const second = createEmptyMagicStatEffectBundle();

        first.nodeEffects.push({
            phase: MAGIC_STAT_EFFECT_PHASE.NODE,
            operation: 'add',
            stat: 'power',
            value: 1,
        });

        expect(second.nodeEffects).toEqual([]);
        expect(second.finalEffects).toEqual([]);
    });

    it('exposes named phase constants for runtime branching', () => {
        expect(MAGIC_STAT_EFFECT_PHASE).toEqual({
            NODE: 'node',
            FINAL: 'final',
        });
    });
});
