import type { MagicGraphEdge } from '../magicGraphTypes';
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
    type MagicGraphNode,
    type MagicStatAggregationOperation,
    type MagicStatBoundsConfig,
    type MagicStatBoundsOverrideConfig,
    type MagicStatBranchAggregation,
    type MagicStatKey,
    type MagicStatRuleConfig,
    type MagicStatRulesConfig,
    type MagicStatScalingConfig,
    type MagicNodeStatBoundsConfig,
    type MagicStats,
    type MagicTypeConfig,
} from '../../../types/magic';

export type MagicStatScope = 'circle' | 'total';

export interface MagicStatRuleContext {
    statKey: MagicStatKey;
    scope: MagicStatScope;
    nodes: readonly MagicGraphNode[];
    edges: readonly MagicGraphEdge[];
    magicTypes: ReadonlyMap<string, MagicTypeConfig>;
}

export interface MagicStatRule {
    serialIdentity: number;
    combineNodeValues(values: number[], context: MagicStatRuleContext): number;
    combineSerialValues(left: number, right: number, context: MagicStatRuleContext): number;
    repeatSerialValue(value: number, count: number): number;
    combineBranchValues(values: number[], aggregation: MagicStatBranchAggregation | undefined, context: MagicStatRuleContext): number;
    scaleFinalValue(value: number, context: MagicStatRuleContext): number;
    clampValue(value: number): number;
    clampNodeValue(value: number, nodeStatBounds?: MagicNodeStatBoundsConfig): number;
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

const repeatSerialOperations: Record<MagicStatAggregationOperation, (value: number, count: number) => number> = {
    [MAGIC_STAT_AGGREGATION_OPERATIONS.SUM]: (value, count) => value * count,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MULTIPLY]: (value, count) => value ** count,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MAX]: value => value,
};

const serialIdentityValues: Record<MagicStatAggregationOperation, number> = {
    [MAGIC_STAT_AGGREGATION_OPERATIONS.SUM]: 0,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MULTIPLY]: 1,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MAX]: 0,
};

function scaleByNodeCount(
    value: number,
    context: MagicStatRuleContext,
    config: MagicStatScalingConfig
): number {
    const factor = config.factor ?? DEFAULT_EXPONENTIAL_FACTOR;
    const countedNodeTotal = context.nodes.filter(
        node => node.data.excludeFromStatScaling !== true
    ).length;
    const exponent = Math.max(
        0,
        countedNodeTotal - FIRST_NODE_SCALING_EXPONENT_OFFSET
    );

    return value * (factor ** exponent);
}

function buildScaleFinalValue(config: MagicStatScalingConfig): MagicStatRule['scaleFinalValue'] {
    if (config.operation === MAGIC_STAT_SCALING_OPERATIONS.EXPONENTIAL_BY_NODE_COUNT) {
        return (value, context) => scaleByNodeCount(value, context, config);
    }

    return value => value;
}

export function clampMagicStatValue(
    value: number,
    bounds?: MagicStatBoundsConfig
): number {
    const minimum = bounds?.minimum ?? Number.NEGATIVE_INFINITY;
    const maximum = bounds?.maximum ?? Number.POSITIVE_INFINITY;

    return Math.min(maximum, Math.max(minimum, value));
}

export function resolveMagicStatBounds(
    defaultBounds: MagicStatBoundsConfig | undefined,
    overrideBounds: MagicStatBoundsOverrideConfig | undefined
): MagicStatBoundsConfig | undefined {
    if (!overrideBounds) return defaultBounds;

    const minimum = overrideBounds.minimum === null
        ? undefined
        : overrideBounds.minimum ?? defaultBounds?.minimum;
    const maximum = overrideBounds.maximum === null
        ? undefined
        : overrideBounds.maximum ?? defaultBounds?.maximum;

    return minimum === undefined && maximum === undefined
        ? undefined
        : { minimum, maximum };
}

function buildMagicStatRule(
    statKey: MagicStatKey,
    config: MagicStatRuleConfig
): MagicStatRule {
    return {
        serialIdentity: serialIdentityValues[config.serialAggregation],
        combineNodeValues: nodeAggregationOperations[config.nodeAggregation],
        combineSerialValues: serialAggregationOperations[config.serialAggregation],
        repeatSerialValue: repeatSerialOperations[config.serialAggregation],
        combineBranchValues: (values, aggregation) =>
            nodeAggregationOperations[aggregation ?? config.branchAggregation](values),
        scaleFinalValue: buildScaleFinalValue(config.scaling),
        clampValue: value => clampMagicStatValue(value, config.bounds),
        clampNodeValue: (value, nodeStatBounds) => clampMagicStatValue(
            value,
            resolveMagicStatBounds(config.bounds, nodeStatBounds?.[statKey])
        ),
    };
}

function buildMagicStatRules(configs: MagicStatRulesConfig): Record<MagicStatKey, MagicStatRule> {
    return Object.fromEntries(MAGIC_STAT_KEYS.map(statKey => {
        const config = configs[statKey];
        if (!config) {
            throw new Error(`Missing magic stat rule config: ${statKey}`);
        }

        return [statKey, buildMagicStatRule(statKey, config)];
    })) as Record<MagicStatKey, MagicStatRule>;
}

export const MAGIC_STAT_RULES: Record<MagicStatKey, MagicStatRule> =
    buildMagicStatRules(magicStatRulesData as MagicStatRulesConfig);

export function clampMagicStats(stats: MagicStats): MagicStats {
    return Object.fromEntries(MAGIC_STAT_KEYS.map(statKey => [
        statKey,
        MAGIC_STAT_RULES[statKey].clampValue(stats[statKey]),
    ])) as MagicStats;
}

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
