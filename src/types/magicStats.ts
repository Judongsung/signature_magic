import {
    MAGIC_STAT_AGGREGATION_OPERATIONS,
    MAGIC_STAT_SCALING_OPERATIONS,
} from '../constants/magicStatConfigs';

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

export type MagicStatAggregationOperation =
    (typeof MAGIC_STAT_AGGREGATION_OPERATIONS)[keyof typeof MAGIC_STAT_AGGREGATION_OPERATIONS];

export type MagicStatScalingOperation =
    (typeof MAGIC_STAT_SCALING_OPERATIONS)[keyof typeof MAGIC_STAT_SCALING_OPERATIONS];

export interface MagicStatScalingConfig {
    operation: MagicStatScalingOperation;
    factor?: number;
}

export interface MagicStatBoundsConfig {
    minimum?: number;
    maximum?: number;
}

export interface MagicStatBoundsOverrideConfig {
    minimum?: number | null;
    maximum?: number | null;
}

export type MagicNodeStatBoundsConfig =
    Partial<Record<MagicStatKey, MagicStatBoundsOverrideConfig>>;

export interface MagicStatRuleConfig {
    serialAggregation: MagicStatAggregationOperation;
    branchAggregation: MagicStatAggregationOperation;
    scaling: MagicStatScalingConfig;
    bounds?: MagicStatBoundsConfig;
}

export type MagicStatRulesConfig =
    Partial<Record<MagicStatKey, MagicStatRuleConfig>>;

export const EMPTY_MAGIC_STATS: MagicStats = {
    castingTime: 0,
    instability: 0,
    power: 0,
    range: 0,
    manaCost: 0,
    duration: 0,
};
