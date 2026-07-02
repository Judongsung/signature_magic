import {
    EMPTY_MAGIC_STATS,
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
import { applyMagicNodeWeightToStat } from '../model/magicNodeWeight';
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
    const result = { ...EMPTY_MAGIC_STATS };
    const context: MagicStatCalculationContext = {
        nodeStatEffects,
        nodeStatEffectSummariesByMagicType: new Map(),
        nodeStatsById: new Map(),
        nodeExecutionCounts,
    };

    MAGIC_STAT_KEYS.forEach(statKey => {
        const rule = MAGIC_STAT_RULES[statKey];
        const value = rule.combineNodeValues(nodes.map(node =>
            readNodeStat(node, statKey, magicTypes, context)
        ));
        const scaledValue = rule.scaleFinalValue(value, {
            nodes,
            magicTypes,
            nodeExecutionCounts,
        });
        result[statKey] = rule.clampValue(scaledValue);
    });

    return result;
}

function readNodeStat(
    node: MagicNode,
    statKey: MagicStatKey,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    context: MagicStatCalculationContext
): number {
    return readNodeStats(node, magicTypes, context)[statKey];
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
    const nodeStatEffectSummary = getNodeStatEffectSummary(
        magicType,
        context
    );
    const executionCount = context.nodeExecutionCounts.get(node.id) ??
        DEFAULT_NODE_EXECUTION_COUNT;
    const stats = Object.fromEntries(
        MAGIC_STAT_KEYS.map(statKey => {
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

            return [
                statKey,
                statKey === NON_REPEATABLE_STAT_KEY
                    ? weightedValue
                    : MAGIC_STAT_RULES[
                        statKey
                    ].repeatSerialValue(
                        weightedValue,
                        executionCount
                    ),
            ];
        })
    ) as MagicStats;

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
