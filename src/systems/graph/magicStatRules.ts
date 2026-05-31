import type { Edge } from '@xyflow/svelte';
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
}

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

function rule(): MagicStatRule {
    return {
        combineNodeValues: sumNodeValues,
        combineBranchValues,
    };
}

export const MAGIC_STAT_RULES: Record<MagicStatKey, MagicStatRule> = {
    castingTime: rule(),
    instability: rule(),
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
