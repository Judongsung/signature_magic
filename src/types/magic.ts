import type { Node } from '@xyflow/svelte';
import {
    MAGIC_CONNECTION_RULE_KEYS,
    type MagicNodeCategory,
} from '../constants/gameConfigs';
import {
    MAGIC_STAT_AGGREGATION_OPERATION_IDS,
    MAGIC_STAT_BRANCH_AGGREGATION_IDS,
    MAGIC_STAT_SCALING_OPERATION_IDS,
} from '../constants/magicStatConfigs';

export type MagicType = string;

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

export type MagicStatBranchAggregation =
    (typeof MAGIC_STAT_BRANCH_AGGREGATION_IDS)[keyof typeof MAGIC_STAT_BRANCH_AGGREGATION_IDS];

export type MagicStatAggregationOperation =
    (typeof MAGIC_STAT_AGGREGATION_OPERATION_IDS)[keyof typeof MAGIC_STAT_AGGREGATION_OPERATION_IDS];

export type MagicStatScalingOperation =
    (typeof MAGIC_STAT_SCALING_OPERATION_IDS)[keyof typeof MAGIC_STAT_SCALING_OPERATION_IDS];

export interface MagicStatScalingConfig {
    operation: MagicStatScalingOperation;
    factor?: number;
}

export interface MagicStatRuleConfig {
    nodeAggregation: MagicStatAggregationOperation;
    serialAggregation: MagicStatAggregationOperation;
    branchAggregation: MagicStatAggregationOperation;
    scaling: MagicStatScalingConfig;
}

export type MagicStatRulesConfig = Partial<Record<MagicStatKey, MagicStatRuleConfig>>;

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

export interface MagicNodeConnectionLimits {
    maxInputs?: number | null;
    maxOutputs?: number | null;
}

export interface MagicNodeConnectionRules {
    [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]?: boolean;
}

export type MagicNodeKind = 'user' | 'system';

export interface MagicTypeConfig {
    type: MagicType;
    label: string;
    icon: string;
    color: string;
    category: MagicNodeCategory;
    description: string;
    connectionLimits?: MagicNodeConnectionLimits;
    connectionRules?: MagicNodeConnectionRules;
    stats?: MagicStatsConfig;
    statRules?: MagicNodeStatRulesConfig;
}

export interface MagicNodeData extends Record<string, unknown> {
    magicType: MagicType;
    nodeKind?: MagicNodeKind;
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
