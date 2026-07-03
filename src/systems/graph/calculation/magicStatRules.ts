import type { MagicNode } from '../magicGraphTypes';
import magicStatRulesData from '../../../data/magicStatRules.json';
import {
    MAGIC_STAT_AGGREGATION_OPERATIONS,
    MAGIC_STAT_AGGREGATION_OPERATION_VALUES,
    MAGIC_STAT_SCALING_OPERATIONS,
    MAGIC_STAT_SCALING_OPERATION_VALUES,
} from '../../../constants/magicStatConfigs';
import {
    MAGIC_CONTROL_PAIR_ROLES,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import {
    MAGIC_CONTROL_NODE_CATEGORY,
} from '../../../constants/nodeEditorConfigs';
import {
    MAGIC_STAT_KEYS,
    type MagicStatAggregationOperation,
    type MagicStatBoundsConfig,
    type MagicStatBoundsOverrideConfig,
    type MagicStatKey,
    type MagicStatRuleConfig,
    type MagicStatRulesConfig,
    type MagicStatScalingConfig,
    type MagicNodeStatBoundsConfig,
    type MagicStats,
} from '../../../types/magicStats';
import type {
    MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import {
    resolveMagicNodeWeight,
} from '../model/magicNodeWeight';
import {
    isMagicControlPairNode,
} from '../model/magicControlPairs';

interface MagicStatScalingContext {
    nodes: readonly MagicNode[];
    magicTypes: ReadonlyMap<string, MagicTypeConfig>;
    nodeExecutionCounts?: ReadonlyMap<string, number>;
}

export interface MagicStatRule {
    serialIdentity: number;
    combineSerialValues(left: number, right: number): number;
    repeatSerialValue(value: number, count: number): number;
    combineBranchValues(values: number[]): number;
    scaleFinalValue(
        value: number,
        context: MagicStatScalingContext
    ): number;
    clampValue(value: number): number;
    clampNodeValue(
        value: number,
        nodeStatBounds?: MagicNodeStatBoundsConfig
    ): number;
}

const FIRST_NODE_SCALING_EXPONENT_OFFSET = 1;
const DEFAULT_EXPONENTIAL_FACTOR = 1;
const DEFAULT_NODE_EXECUTION_COUNT = 1;

function sum(values: number[]): number {
    return values.reduce((total, value) => total + value, 0);
}

function multiplyNodeValues(values: number[]): number {
    return values.length === 0
        ? 0
        : values.reduce((product, value) => product * value, 1);
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

const aggregationOperations: Record<
    MagicStatAggregationOperation,
    (values: number[]) => number
> = {
    [MAGIC_STAT_AGGREGATION_OPERATIONS.SUM]: sum,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MULTIPLY]:
        multiplyNodeValues,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MAX]: max,
};

const serialAggregationOperations: Record<
    MagicStatAggregationOperation,
    (left: number, right: number) => number
> = {
    [MAGIC_STAT_AGGREGATION_OPERATIONS.SUM]: sumSerialValues,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MULTIPLY]:
        multiplySerialValues,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MAX]: maxSerialValues,
};

const repeatSerialOperations: Record<
    MagicStatAggregationOperation,
    (value: number, count: number) => number
> = {
    [MAGIC_STAT_AGGREGATION_OPERATIONS.SUM]:
        (value, count) => value * count,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MULTIPLY]:
        (value, count) => value ** count,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MAX]: value => value,
};

const serialIdentityValues: Record<
    MagicStatAggregationOperation,
    number
> = {
    [MAGIC_STAT_AGGREGATION_OPERATIONS.SUM]: 0,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MULTIPLY]: 1,
    [MAGIC_STAT_AGGREGATION_OPERATIONS.MAX]: 0,
};

function scaleByNodeCount(
    value: number,
    context: MagicStatScalingContext,
    config: MagicStatScalingConfig
): number {
    const factor = config.factor ?? DEFAULT_EXPONENTIAL_FACTOR;
    const nodeCountSummary = context.nodes.reduce((summary, node) => {
        if (
            node.data.excludeFromStatScaling === true ||
            node.data.nodeKind === MAGIC_NODE_KINDS.SYSTEM
        ) {
            return summary;
        }

        const magicType = context.magicTypes.get(node.data.magicType);
        const executionCount =
            context.nodeExecutionCounts?.get(node.id) ??
            DEFAULT_NODE_EXECUTION_COUNT;
        if (
            isMagicControlPairNode(node) &&
            node.data.controlPair.role === MAGIC_CONTROL_PAIR_ROLES.END
        ) {
            return summary;
        }

        // 안정화는 제어 단위 마법이라 개수에는 넣지 않고 복리 복잡도만 상쇄한다.
        const configuredReduction =
            magicType?.instabilityNodeCountReduction;
        if (
            typeof configuredReduction === 'number' &&
            Number.isFinite(configuredReduction) &&
            configuredReduction > 0
        ) {
            return {
                ...summary,
                reduction: summary.reduction +
                    configuredReduction *
                    executionCount *
                    resolveMagicNodeWeight(node.data, magicType),
            };
        }
        if (magicType?.category === MAGIC_CONTROL_NODE_CATEGORY) {
            return summary;
        }

        return {
            ...summary,
            counted: summary.counted + executionCount,
        };
    }, { counted: 0, reduction: 0 });
    const effectiveNodeCount = Math.max(
        0,
        nodeCountSummary.counted - nodeCountSummary.reduction
    );
    const exponent = Math.max(
        0,
        effectiveNodeCount - FIRST_NODE_SCALING_EXPONENT_OFFSET
    );

    return value * (factor ** exponent);
}

function buildScaleFinalValue(
    config: MagicStatScalingConfig
): MagicStatRule['scaleFinalValue'] {
    if (
        config.operation ===
            MAGIC_STAT_SCALING_OPERATIONS.EXPONENTIAL_BY_NODE_COUNT
    ) {
        return (value, context) =>
            scaleByNodeCount(value, context, config);
    }

    return value => value;
}

export function clampMagicStatValue(
    value: number,
    bounds?: MagicStatBoundsConfig
): number {
    const minimum =
        bounds?.minimum ?? Number.NEGATIVE_INFINITY;
    const maximum =
        bounds?.maximum ?? Number.POSITIVE_INFINITY;

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
        serialIdentity:
            serialIdentityValues[config.serialAggregation],
        combineSerialValues:
            serialAggregationOperations[config.serialAggregation],
        repeatSerialValue:
            repeatSerialOperations[config.serialAggregation],
        combineBranchValues: values =>
            aggregationOperations[
                config.branchAggregation
            ](values),
        scaleFinalValue: buildScaleFinalValue(config.scaling),
        clampValue: value =>
            clampMagicStatValue(value, config.bounds),
        clampNodeValue: (value, nodeStatBounds) =>
            clampMagicStatValue(
                value,
                resolveMagicStatBounds(
                    config.bounds,
                    nodeStatBounds?.[statKey]
                )
            ),
    };
}

function buildMagicStatRules(
    configs: MagicStatRulesConfig
): Record<MagicStatKey, MagicStatRule> {
    return Object.fromEntries(MAGIC_STAT_KEYS.map(statKey => {
        const config = configs[statKey];
        if (!config) {
            throw new Error(
                `Missing magic stat rule config: ${statKey}`
            );
        }

        return [statKey, buildMagicStatRule(statKey, config)];
    })) as Record<MagicStatKey, MagicStatRule>;
}

export const MAGIC_STAT_RULES:
    Record<MagicStatKey, MagicStatRule> =
        buildMagicStatRules(
            magicStatRulesData as MagicStatRulesConfig
        );

export function clampMagicStats(stats: MagicStats): MagicStats {
    return Object.fromEntries(MAGIC_STAT_KEYS.map(statKey => [
        statKey,
        MAGIC_STAT_RULES[statKey].clampValue(stats[statKey]),
    ])) as MagicStats;
}

export function isMagicStatAggregationOperation(
    value: unknown
): value is MagicStatAggregationOperation {
    return typeof value === 'string' &&
        MAGIC_STAT_AGGREGATION_OPERATION_VALUES.includes(
            value as MagicStatAggregationOperation
        );
}

export function isMagicStatScalingOperation(
    value: unknown
): value is MagicStatScalingConfig['operation'] {
    return typeof value === 'string' &&
        MAGIC_STAT_SCALING_OPERATION_VALUES.includes(
            value as MagicStatScalingConfig['operation']
        );
}
