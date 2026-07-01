import type { MagicNodeCategory } from '../constants/nodeEditorConfigs';
import type { MagicStatKey } from './magicStats';
import type { MagicType } from './magicTypeConfig';

export const MAGIC_STAT_EFFECT_PHASE = {
    NODE: 'node',
    FINAL: 'final',
} as const;

export type MagicStatEffectPhase =
    (typeof MAGIC_STAT_EFFECT_PHASE)[keyof typeof MAGIC_STAT_EFFECT_PHASE];

export const MAGIC_STAT_EFFECT_PHASES: readonly MagicStatEffectPhase[] =
    Object.values(MAGIC_STAT_EFFECT_PHASE);

export const MAGIC_STAT_EFFECT_OPERATION_IDS = {
    ADD: 'add',
    MULTIPLY: 'multiply',
} as const;

export type MagicStatEffectOperation = (typeof MAGIC_STAT_EFFECT_OPERATION_IDS)[
    keyof typeof MAGIC_STAT_EFFECT_OPERATION_IDS
];

export const MAGIC_STAT_EFFECT_OPERATIONS: readonly MagicStatEffectOperation[] =
    Object.values(MAGIC_STAT_EFFECT_OPERATION_IDS);

export const MAGIC_STAT_EFFECT_VALUE_SIGNS = {
    POSITIVE: 'positive',
    NEGATIVE: 'negative',
} as const;

export type MagicStatEffectValueSign =
    (typeof MAGIC_STAT_EFFECT_VALUE_SIGNS)[keyof typeof MAGIC_STAT_EFFECT_VALUE_SIGNS];

export interface MagicStatEffectNodeTarget {
    categories?: readonly MagicNodeCategory[];
    magicTypes?: readonly MagicType[];
    statValueSign?: MagicStatEffectValueSign;
}

export interface MagicStatEffectConfig {
    phase: MagicStatEffectPhase;
    operation: MagicStatEffectOperation;
    stat: MagicStatKey;
    value: number;
    nodeTarget?: MagicStatEffectNodeTarget;
}

export interface MagicStatEffectBundle {
    nodeEffects: MagicStatEffectConfig[];
    finalEffects: MagicStatEffectConfig[];
}

export function createEmptyMagicStatEffectBundle(): MagicStatEffectBundle {
    return {
        nodeEffects: [],
        finalEffects: [],
    };
}
