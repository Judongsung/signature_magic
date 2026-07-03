import {
    MAGIC_STAT_KEYS,
    type MagicStatKey,
    type MagicStats,
} from '../../../types/magicStats';
import type { MagicNode } from '../magicGraphTypes';
import type {
    MagicStatEffectConfig,
} from '../../../types/magicStatEffects';
import type {
    MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import { MAGIC_STAT_RULES } from './magicStatRules';
import {
    applyMagicStatEffectSummary,
    buildMagicStatEffectSummary,
    filterMagicStatEffectsForNode,
    type MagicStatEffectSummary,
} from './magicStatEffects';
import type { MagicNodeExecutionCounts } from './magicRepeatCalculation';
import {
    applyMagicNodeWeightToStat,
    resolveMagicNodeWeight,
} from '../model/magicNodeWeight';
import { isMagicControlPairType } from '../model/magicControlPairs';

const EMPTY_NODE_EXECUTION_COUNTS: MagicNodeExecutionCounts = new Map();
const DEFAULT_NODE_EXECUTION_COUNT = 1;
const NON_REPEATABLE_STAT_KEY: MagicStatKey = 'instability';

export function buildMagicTypeMap(
    magicTypes: readonly MagicTypeConfig[]
): ReadonlyMap<string, MagicTypeConfig> {
    return new Map(magicTypes.map(magicType => [
        magicType.type,
        magicType,
    ]));
}

interface MagicStatCalculationContext {
    nodeStatEffects: readonly MagicStatEffectConfig[];
    nodeStatEffectSummariesByMagicType: Map<
        string,
        MagicStatEffectSummary
    >;
    nodeStatsById: Map<string, MagicStats>;
    nodeExecutionCounts: MagicNodeExecutionCounts;
}

export function calculateMagicStats(
    nodes: readonly MagicNode[],
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    nodeStatEffects: readonly MagicStatEffectConfig[] = [],
    nodeExecutionCounts: MagicNodeExecutionCounts =
        EMPTY_NODE_EXECUTION_COUNTS
): MagicStats {
    const context = createMagicStatCalculationContext(
        nodeStatEffects,
        nodeExecutionCounts
    );
    const accumulated = applyMagicNodeSequenceWithContext(
        createSerialIdentityStats(),
        nodes,
        magicTypes,
        context
    );

    return Object.fromEntries(MAGIC_STAT_KEYS.map(statKey => {
        const rule = MAGIC_STAT_RULES[statKey];
        const scaledValue = rule.scaleFinalValue(
            accumulated[statKey],
            {
                nodes,
                magicTypes,
                nodeExecutionCounts,
            }
        );

        return [statKey, rule.clampValue(scaledValue)];
    })) as MagicStats;
}

export function applyMagicNodeSequenceStats(
    initialStats: MagicStats | undefined,
    nodes: readonly MagicNode[],
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    nodeStatEffects: readonly MagicStatEffectConfig[] = [],
    nodeExecutionCounts: MagicNodeExecutionCounts =
        EMPTY_NODE_EXECUTION_COUNTS
): MagicStats {
    return applyMagicNodeSequenceWithContext(
        initialStats ?? createSerialIdentityStats(),
        nodes,
        magicTypes,
        createMagicStatCalculationContext(
            nodeStatEffects,
            nodeExecutionCounts
        )
    );
}

function createMagicStatCalculationContext(
    nodeStatEffects: readonly MagicStatEffectConfig[],
    nodeExecutionCounts: MagicNodeExecutionCounts
): MagicStatCalculationContext {
    return {
        nodeStatEffects,
        nodeStatEffectSummariesByMagicType: new Map(),
        nodeStatsById: new Map(),
        nodeExecutionCounts,
    };
}

function applyMagicNodeSequenceWithContext(
    initialStats: MagicStats,
    nodes: readonly MagicNode[],
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    context: MagicStatCalculationContext
): MagicStats {
    // 입력 객체는 보존하고, 계산 중에는 이 지역 복사본만 갱신해 노드별 임시 객체 생성을 피한다.
    const accumulated = { ...initialStats };

    nodes.forEach(node => {
        const nodeStats = readNodeStats(node, magicTypes, context);
        MAGIC_STAT_KEYS.forEach(statKey => {
            accumulated[statKey] =
                MAGIC_STAT_RULES[statKey].combineSerialValues(
                    accumulated[statKey],
                    nodeStats[statKey]
                );
        });
        applyPowerAmplification(
            accumulated,
            node,
            magicTypes.get(node.data.magicType),
            context.nodeExecutionCounts
        );
    });

    return accumulated;
}

function applyPowerAmplification(
    accumulated: MagicStats,
    node: MagicNode,
    magicType: MagicTypeConfig | undefined,
    nodeExecutionCounts: MagicNodeExecutionCounts
): void {
    const amplification = magicType?.powerAmplification;
    if (!amplification) return;

    const executionCount = nodeExecutionCounts.get(node.id) ??
        DEFAULT_NODE_EXECUTION_COUNT;
    const applicationCount =
        executionCount * resolveMagicNodeWeight(node.data, magicType);
    const amplifiablePower = Math.max(0, accumulated.power);
    const amplifiedPower =
        amplifiablePower * amplification.factor ** applicationCount;
    const addedPower = amplifiedPower - amplifiablePower;

    accumulated.power += addedPower;
    accumulated.manaCost +=
        addedPower * amplification.manaCostPerAddedPower;
}

function readNodeStats(
    node: MagicNode,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    context: MagicStatCalculationContext
): MagicStats {
    const cached = context.nodeStatsById.get(node.id);
    if (cached) return cached;
    if (
        node.data.excludeFromStatScaling === true ||
        isMagicControlPairType(node.data.magicType)
    ) {
        const identityStats = createSerialIdentityStats();
        context.nodeStatsById.set(node.id, identityStats);
        return identityStats;
    }

    const magicType = magicTypes.get(node.data.magicType);
    const rawStats = magicType?.stats;
    if (magicType && !rawStats) {
        const identityStats = createSerialIdentityStats();
        context.nodeStatsById.set(node.id, identityStats);
        return identityStats;
    }
    const nodeStatEffectSummary = getNodeStatEffectSummary(
        magicType,
        context
    );
    const executionCount = context.nodeExecutionCounts.get(node.id) ??
        DEFAULT_NODE_EXECUTION_COUNT;
    const stats = {} as MagicStats;
    MAGIC_STAT_KEYS.forEach(statKey => {
        const adjustedValue = applyMagicStatEffectSummary(
            rawStats?.[statKey] ?? 0,
            statKey,
            nodeStatEffectSummary
        );
        const boundedValue = MAGIC_STAT_RULES[
            statKey
        ].clampNodeValue(
            adjustedValue,
            magicType?.statBounds
        );
        const weightedValue = applyMagicNodeWeightToStat(
            boundedValue,
            statKey,
            node.data,
            magicType
        );

        stats[statKey] = statKey === NON_REPEATABLE_STAT_KEY
            ? weightedValue
            : MAGIC_STAT_RULES[
                statKey
            ].repeatSerialValue(
                weightedValue,
                executionCount
            );
    });

    context.nodeStatsById.set(node.id, stats);
    return stats;
}

function createSerialIdentityStats(): MagicStats {
    return Object.fromEntries(
        MAGIC_STAT_KEYS.map(statKey => [
            statKey,
            MAGIC_STAT_RULES[statKey].serialIdentity,
        ])
    ) as MagicStats;
}

function getNodeStatEffectSummary(
    magicType: MagicTypeConfig | undefined,
    context: MagicStatCalculationContext
): MagicStatEffectSummary {
    const cacheKey = magicType?.type ?? '';
    const cached =
        context.nodeStatEffectSummariesByMagicType.get(cacheKey);
    if (cached) return cached;

    const applicableEffects = filterMagicStatEffectsForNode(
        context.nodeStatEffects,
        magicType
            ? {
                category: magicType.category,
                magicType: magicType.type,
                stats: magicType.stats,
            }
            : undefined
    );
    const summary = buildMagicStatEffectSummary(applicableEffects);

    context.nodeStatEffectSummariesByMagicType.set(
        cacheKey,
        summary
    );
    return summary;
}
