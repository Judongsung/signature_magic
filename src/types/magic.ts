import type { Node } from '@xyflow/svelte';
import magicTypesData from '../data/magicTypes.json';
import { MAGIC_CONNECTION_RULE_KEYS, type MagicNodeCategory } from '../constants/gameConfigs';

type MagicTypesData = typeof magicTypesData;

export type MagicType = MagicTypesData[number]['type'];

export const MAGIC_STAT_KEYS = [
    'castingTime',
    'instability',
    'power',
    'range',
    'manaCost',
    'duration',
] as const;

export type MagicStatKey = (typeof MAGIC_STAT_KEYS)[number];

export type MagicStats = Record<MagicStatKey, number>;

export type MagicStatsConfig = Partial<MagicStats>;

export const MAGIC_STAT_EFFECT_PHASES = ['node', 'final'] as const;

export type MagicStatEffectPhase = (typeof MAGIC_STAT_EFFECT_PHASES)[number];

export const MAGIC_STAT_EFFECT_OPERATIONS = ['add', 'multiply'] as const;

export type MagicStatEffectOperation = (typeof MAGIC_STAT_EFFECT_OPERATIONS)[number];

export interface MagicStatEffectConfig {
    phase: MagicStatEffectPhase;
    operation: MagicStatEffectOperation;
    stat: MagicStatKey;
    value: number;
}

export interface MagicStatEffectBundle {
    nodeEffects: MagicStatEffectConfig[];
    finalEffects: MagicStatEffectConfig[];
}

export const MAGIC_STAT_BRANCH_AGGREGATIONS = ['sum', 'max'] as const;

export type MagicStatBranchAggregation = (typeof MAGIC_STAT_BRANCH_AGGREGATIONS)[number];

export interface MagicNodeStatRuleConfig {
    branchAggregation?: MagicStatBranchAggregation;
}

export type MagicNodeStatRulesConfig = Partial<Record<MagicStatKey, MagicNodeStatRuleConfig>>;

export const EMPTY_MAGIC_STATS: MagicStats = {
    castingTime: 0,
    instability: 0,
    power: 0,
    range: 0,
    manaCost: 0,
    duration: 0,
};

export const MAGIC_STAT_LABELS: Record<MagicStatKey, string> = {
    castingTime: '캐스팅 시간',
    instability: '불안정성',
    power: '출력',
    range: '범위',
    manaCost: '마나 소모',
    duration: '지속 시간',
};

export interface MagicNodeConnectionLimits {
    maxInputs?: number | null;
    maxOutputs?: number | null;
}

export interface MagicNodeConnectionRules {
    [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]?: boolean;
}

export type MagicTypeConfig = Omit<MagicTypesData[number], 'category' | 'connectionLimits' | 'connectionRules' | 'stats' | 'statRules'> & {
    category: MagicNodeCategory;
    connectionLimits?: MagicNodeConnectionLimits;
    connectionRules?: MagicNodeConnectionRules;
    stats?: MagicStatsConfig;
    statRules?: MagicNodeStatRulesConfig;
};

export interface MagicNodeData extends Record<string, unknown> {
    magicType: MagicType;
    isRoot?: boolean;
    isLeaf?: boolean;
    inputHandleCount?: number;
    outputHandleCount?: number;
}

export type MagicNode = Node<MagicNodeData>;

export interface CirclePath {
    id: string;
    nodes: MagicNode[];
    stats: MagicStats;
}

export interface MagicCalculationResult {
    circles: CirclePath[];
    totalStats: MagicStats;
}
