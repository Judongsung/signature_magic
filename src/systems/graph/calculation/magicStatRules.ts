import type { Edge } from '@xyflow/svelte';
import magicStatRulesData from '../../../data/magicStatRules.json';
import {
    MAGIC_STAT_AGGREGATION_OPERATIONS,
    MAGIC_STAT_AGGREGATION_OPERATION_VALUES,
    MAGIC_STAT_BRANCH_AGGREGATIONS,
    MAGIC_STAT_BRANCH_AGGREGATION_VALUES,
    MAGIC_STAT_SCALING_OPERATIONS,
    MAGIC_STAT_SCALING_OPERATION_VALUES,
} from '../../../constants/magicStatConfigs';
import {
    MAGIC_STAT_KEYS,
    type MagicNode,
    type MagicStatAggregationOperation,
    type MagicStatBranchAggregation,
    type MagicStatKey,
    type MagicStatRuleConfig,
    type MagicStatRulesConfig,
    type MagicStatScalingConfig,
    type MagicTypeConfig,
} from '../../../types/magic';

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
    combineSerialValues(left: number, right: number, context: MagicStatRuleContext): number;
    combineBranchValues(values: number[], aggregation: MagicStatBranchAggregation | undefined, context: MagicStatRuleContext): number;
    scaleFinalValue(value: number, context: MagicStatRuleContext): number;
}

const FIRST_NODE_SCALING_EXPONENT_OFFSET = 1;
const DEFAULT_EXPONENTIAL_FACTOR = 1;

function sum(values: number[]): number {
    return values.reduce((total, value) => total + value, 0);
}

function multiplyNodeValues(values: number[]): number {
    return values.length === 0 ? 0 : values.reduce((product, value) => product * value, 1);
}

function max(values: number[]): number {
    return values.length === 0 ? 0 : Math.max(...values);
}

function sumSerialValues(left: number, right: number): number {
    return left + right;
}

function multiplySerialValues(left: number, right: number): number {
    return left * right;
}

function maxSerialValues(left: number, right: number): number {
    return Math.max(left, right);
}

const nodeAggregationOperations: Record<MagicStatAggregationOperation, (values: number[]) => number> = {
    [MAGIC_STAT_AGGREGATION_OPERATIONS.SUM]: sum,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MULTIPLY]: multiplyNodeValues,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MAX]: max,
};

const serialAggregationOperations: Record<MagicStatAggregationOperation, (left: number, right: number) => number> = {
    [MAGIC_STAT_AGGREGATION_OPERATIONS.SUM]: sumSerialValues,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MULTIPLY]: multiplySerialValues,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MAX]: maxSerialValues,
};

function scaleByNodeCount(
    value: number,
    context: MagicStatRuleContext,
    config: MagicStatScalingConfig
): number {
    const factor = config.factor ?? DEFAULT_EXPONENTIAL_FACTOR;
    const exponent = Math.max(0, context.nodes.length - FIRST_NODE_SCALING_EXPONENT_OFFSET);

    return value * (factor ** exponent);
}

function buildScaleFinalValue(config: MagicStatScalingConfig): MagicStatRule['scaleFinalValue'] {
    if (config.operation === MAGIC_STAT_SCALING_OPERATIONS.EXPONENTIAL_BY_NODE_COUNT) {
        return (value, context) => scaleByNodeCount(value, context, config);
    }

    return value => value;
}

function buildMagicStatRule(config: MagicStatRuleConfig): MagicStatRule {
    return {
        combineNodeValues: nodeAggregationOperations[config.nodeAggregation],
        combineSerialValues: serialAggregationOperations[config.serialAggregation],
        combineBranchValues: (values, aggregation) =>
            nodeAggregationOperations[aggregation ?? config.branchAggregation](values),
        scaleFinalValue: buildScaleFinalValue(config.scaling),
    };
}

function buildMagicStatRules(configs: MagicStatRulesConfig): Record<MagicStatKey, MagicStatRule> {
    return Object.fromEntries(MAGIC_STAT_KEYS.map(statKey => {
        const config = configs[statKey];
        if (!config) {
            throw new Error(`Missing magic stat rule config: ${statKey}`);
        }

        return [statKey, buildMagicStatRule(config)];
    })) as Record<MagicStatKey, MagicStatRule>;
}

export const MAGIC_STAT_RULES: Record<MagicStatKey, MagicStatRule> =
    buildMagicStatRules(magicStatRulesData as MagicStatRulesConfig);

export function hasMagicStatRuleForEveryKey(): boolean {
    return MAGIC_STAT_KEYS.every(key => Boolean(MAGIC_STAT_RULES[key]));
}

export function isMagicStatAggregationOperation(value: unknown): value is MagicStatAggregationOperation {
    return typeof value === 'string' &&
        MAGIC_STAT_AGGREGATION_OPERATION_VALUES.includes(value as MagicStatAggregationOperation);
}

export function isMagicStatBranchAggregation(value: unknown): value is MagicStatBranchAggregation {
    return typeof value === 'string' && MAGIC_STAT_BRANCH_AGGREGATION_VALUES.includes(value as MagicStatBranchAggregation);
}

export function isMagicStatScalingOperation(value: unknown): value is MagicStatScalingConfig['operation'] {
    return typeof value === 'string' &&
        MAGIC_STAT_SCALING_OPERATION_VALUES.includes(value as MagicStatScalingConfig['operation']);
}
