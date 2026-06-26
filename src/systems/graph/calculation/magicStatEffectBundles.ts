import type { MagicStatEffectBundle } from '../../../types/magic';

export const MAGIC_STAT_EFFECT_PHASE = {
    NODE: 'node',
    FINAL: 'final',
} as const;

export function createEmptyMagicStatEffectBundle(): MagicStatEffectBundle {
    return {
        nodeEffects: [],
        finalEffects: [],
    };
}
