import type { Edge } from '@xyflow/svelte';
import {
    MAGIC_STAT_RULE_CONFIGS,
    MAGIC_STAT_SCALING_OPERATIONS,
} from '../../constants/gameConfigs';
import {
    MAGIC_STAT_BRANCH_AGGREGATIONS,
    MAGIC_STAT_KEYS,
    type MagicNode,
    type MagicStatBranchAggregation,
    type MagicStatKey,
    type MagicTypeConfig,
} from '../../types/magic';

export type MagicStatScope = 'circle' | 'total';

export interface MagicStatRuleContext {
    statKey: MagicStatKey;
    scope: MagicStatScope;
    nodes: readonly MagicNode[];
    edges: readonly Edge[];
    magicTypes: ReadonlyMap<string, MagicTypeConfig>;
}

export interface MagicStatRule {
    combineNodeValues(values: number[], context: MagicStatRuleContext): number;
    combineBranchValues(values: number[], aggregation: MagicStatBranchAggregation, context: MagicStatRuleContext): number;
    scaleFinalValue(value: number, context: MagicStatRuleContext): number;
}

const FIRST_NODE_SCALING_EXPONENT_OFFSET = 1;
const DEFAULT_EXPONENTIAL_FACTOR = 1;

function sum(values: number[]): number {
    return values.reduce((total, value) => total + value, 0);
}

function sumNodeValues(values: number[]): number {
    return sum(values);
}

function max(values: number[]): number {
    return values.length === 0 ? 0 : Math.max(...values);
}

function combineBranchValues(
    values: number[],
    aggregation: MagicStatBranchAggregation
): number {
    if (aggregation === 'max') return max(values);
    return sum(values);
}

function scaleByNodeCount(value: number, context: MagicStatRuleContext): number {
    const config = MAGIC_STAT_RULE_CONFIGS[context.statKey as keyof typeof MAGIC_STAT_RULE_CONFIGS];

    if (!config || config.scalingOperation === MAGIC_STAT_SCALING_OPERATIONS.NONE) return value;

    if (config.scalingOperation === MAGIC_STAT_SCALING_OPERATIONS.EXPONENTIAL_BY_NODE_COUNT) {
        const exponent = Math.max(0, context.nodes.length - FIRST_NODE_SCALING_EXPONENT_OFFSET);
        const factor = config.exponentialFactor ?? DEFAULT_EXPONENTIAL_FACTOR;
        return value * (factor ** exponent);
    }

    return value;
}

function rule(scaleFinalValue: MagicStatRule['scaleFinalValue'] = value => value): MagicStatRule {
    return {
        combineNodeValues: sumNodeValues,
        combineBranchValues,
        scaleFinalValue,
    };
}

export const MAGIC_STAT_RULES: Record<MagicStatKey, MagicStatRule> = {
    castingTime: rule(),
    instability: rule(scaleByNodeCount),
    power: rule(),
    range: rule(),
    manaCost: rule(),
    duration: rule(),
};

export function hasMagicStatRuleForEveryKey(): boolean {
    return MAGIC_STAT_KEYS.every(key => Boolean(MAGIC_STAT_RULES[key]));
}

export function isMagicStatBranchAggregation(value: unknown): value is MagicStatBranchAggregation {
    return typeof value === 'string' && MAGIC_STAT_BRANCH_AGGREGATIONS.includes(value as MagicStatBranchAggregation);
}
