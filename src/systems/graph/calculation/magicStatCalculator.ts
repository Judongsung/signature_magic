import type { Edge } from '@xyflow/svelte';
import {
    EMPTY_MAGIC_STATS,
    MAGIC_STAT_KEYS,
    type MagicGraphNode,
    type MagicStatBranchAggregation,
    type MagicStatEffectConfig,
    type MagicStatKey,
    type MagicStats,
    type MagicTypeConfig,
} from '../../../types/magic';
import { MAGIC_STAT_RULES, type MagicStatScope } from './magicStatRules';
import {
    applyMagicStatEffectSummary,
    buildMagicStatEffectSummary,
    filterMagicStatEffectsForNode,
    type MagicStatEffectSummary,
} from './magicStatEffects';
import type { GraphTopology } from '../topology/graphTopology';
import {
    buildMagicGraphAnalysis,
    type MagicGraphAnalysis,
} from './magicGraphAnalysis';
import { findNearestCommonReachableNode } from '../topology/graphTraversal';
import type { MagicNodeExecutionCounts } from './magicRepeatCalculation';
import { applyMagicNodeWeightToStat } from '../model/magicNodeWeight';

const EMPTY_NODE_EXECUTION_COUNTS: MagicNodeExecutionCounts = new Map();
const DEFAULT_NODE_EXECUTION_COUNT = 1;
const NON_REPEATABLE_STAT_KEY: MagicStatKey = 'instability';

export function buildMagicTypeMap(
    magicTypes: readonly MagicTypeConfig[]
): ReadonlyMap<string, MagicTypeConfig> {
    return new Map(magicTypes.map(magicType => [magicType.type, magicType]));
}

interface MagicStatCalculationContext {
    nodeStatEffects: readonly MagicStatEffectConfig[];
    nodeStatEffectSummariesByMagicType: Map<string, MagicStatEffectSummary>;
    nodeStatsById: Map<string, MagicStats>;
    nodeExecutionCounts: MagicNodeExecutionCounts;
}

export function calculateMagicStats(
    nodes: readonly MagicGraphNode[],
    edges: readonly Edge[],
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    scope: MagicStatScope,
    nodeStatEffects: readonly MagicStatEffectConfig[] = [],
    analysis?: MagicGraphAnalysis,
    nodeExecutionCounts: MagicNodeExecutionCounts = EMPTY_NODE_EXECUTION_COUNTS
): MagicStats {
    const result = { ...EMPTY_MAGIC_STATS };
    const graphAnalysis = scope === 'total'
        ? analysis ?? buildMagicGraphAnalysis(nodes, edges, magicTypes)
        : undefined;
    const context: MagicStatCalculationContext = {
        nodeStatEffects,
        nodeStatEffectSummariesByMagicType: new Map(),
        nodeStatsById: new Map(),
        nodeExecutionCounts,
    };

    MAGIC_STAT_KEYS.forEach(statKey => {
        const value = scope === 'total'
            ? calculateGraphStat(statKey, graphAnalysis!, magicTypes, context)
            : calculateFlatStat(statKey, nodes, edges, magicTypes, scope, context);

        const scaledValue = MAGIC_STAT_RULES[statKey].scaleFinalValue(value, {
            statKey,
            scope,
            nodes,
            edges,
            magicTypes,
        });
        result[statKey] = MAGIC_STAT_RULES[statKey].clampValue(scaledValue);
    });

    return result;
}

function calculateFlatStat(
    statKey: MagicStatKey,
    nodes: readonly MagicGraphNode[],
    edges: readonly Edge[],
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    scope: MagicStatScope,
    context: MagicStatCalculationContext
): number {
    const values = nodes.map(node => readNodeStat(node, statKey, magicTypes, context));
    return MAGIC_STAT_RULES[statKey].combineNodeValues(values, {
        statKey,
        scope,
        nodes,
        edges,
        magicTypes,
    });
}

function calculateGraphStat(
    statKey: MagicStatKey,
    analysis: MagicGraphAnalysis,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    context: MagicStatCalculationContext
): number {
    const { topology: graph, rootIds, unrootedNodes, mergeNodeId } = analysis;

    if (graph.nodes.length === 0) return 0;
    if (rootIds.length === 0) {
        return calculateFlatStat(statKey, graph.nodes, graph.edges, magicTypes, 'total', context);
    }

    const unrootedValue = unrootedNodes.length > 0
        ? calculateFlatStat(statKey, unrootedNodes, graph.edges, magicTypes, 'total', context)
        : 0;

    if (rootIds.length === 1) {
        return combineComponentValues(
            statKey,
            [
                evaluateFrom(rootIds[0], statKey, analysis, magicTypes, context, undefined, new Set()),
                ...(unrootedNodes.length > 0 ? [unrootedValue] : []),
            ],
            graph,
            magicTypes
        );
    }

    const rootValues = rootIds.map(rootId =>
        evaluateFrom(rootId, statKey, analysis, magicTypes, context, mergeNodeId, new Set())
    );
    const mergedValue = mergeNodeId
        ? evaluateFrom(mergeNodeId, statKey, analysis, magicTypes, context, undefined, new Set())
        : 0;

    const branchValue = MAGIC_STAT_RULES[statKey].combineBranchValues(
        rootValues,
        mergeNodeId ? readBranchAggregationByNodeId(mergeNodeId, statKey, magicTypes, graph) : undefined,
        {
            statKey,
            scope: 'total',
            nodes: graph.nodes,
            edges: graph.edges,
            magicTypes,
        }
    );
    const rootedValue = combineSerialValues(
        statKey,
        [
            branchValue,
            ...(mergeNodeId ? [mergedValue] : []),
        ],
        graph,
        magicTypes
    );

    return combineComponentValues(
        statKey,
        [
            rootedValue,
            ...(unrootedNodes.length > 0 ? [unrootedValue] : []),
        ],
        graph,
        magicTypes
    );
}

function evaluateFrom(
    nodeId: string,
    statKey: MagicStatKey,
    analysis: MagicGraphAnalysis,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    context: MagicStatCalculationContext,
    stopNodeId: string | undefined,
    visiting: Set<string>
): number {
    const graph = analysis.topology;

    if (nodeId === stopNodeId) return 0;
    if (visiting.has(nodeId)) return MAGIC_STAT_RULES[statKey].serialIdentity;

    const node = graph.nodeMap.get(nodeId);
    if (!node) return 0;

    visiting.add(nodeId);
    const ownValue = readNodeStat(node, statKey, magicTypes, context);
    const nextIds = graph.outEdges.get(nodeId) ?? [];

    if (nextIds.length === 0) {
        visiting.delete(nodeId);
        return ownValue;
    }

    if (nextIds.length === 1) {
        const value = nextIds[0] === stopNodeId
            ? ownValue
            : combineSerialValues(
                statKey,
                [ownValue, evaluateFrom(nextIds[0], statKey, analysis, magicTypes, context, stopNodeId, visiting)],
                graph,
                magicTypes
            );
        visiting.delete(nodeId);
        return value;
    }

    const mergeNodeId = findNearestCommonReachableNode(graph, nextIds, analysis.reachabilityCache);
    const branchValues = nextIds.map(nextId =>
        evaluateFrom(nextId, statKey, analysis, magicTypes, context, mergeNodeId, new Set(visiting))
    );
    const branchValue = MAGIC_STAT_RULES[statKey].combineBranchValues(
        branchValues,
        // 분기 시작 노드의 statRules는 stat별 기본 병렬 집계 방식을 덮어쓸 수 있다.
        readBranchAggregation(node, statKey, magicTypes),
        {
            statKey,
            scope: 'total',
            nodes: graph.nodes,
            edges: graph.edges,
            magicTypes,
        }
    );
    const afterMergeValue = mergeNodeId
        ? evaluateFrom(mergeNodeId, statKey, analysis, magicTypes, context, stopNodeId, visiting)
        : 0;

    visiting.delete(nodeId);
    return combineSerialValues(
        statKey,
        [
            ownValue,
            branchValue,
            ...(mergeNodeId ? [afterMergeValue] : []),
        ],
        graph,
        magicTypes
    );
}

function combineSerialValues(
    statKey: MagicStatKey,
    values: readonly number[],
    graph: GraphTopology,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>
): number {
    const [firstValue, ...restValues] = values;
    if (firstValue === undefined) return 0;

    return restValues.reduce(
        (value, nextValue) => MAGIC_STAT_RULES[statKey].combineSerialValues(
            value,
            nextValue,
            {
                statKey,
                scope: 'total',
                nodes: graph.nodes,
                edges: graph.edges,
                magicTypes,
            }
        ),
        firstValue
    );
}

function combineComponentValues(
    statKey: MagicStatKey,
    values: readonly number[],
    graph: GraphTopology,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>
): number {
    return MAGIC_STAT_RULES[statKey].combineNodeValues([...values], {
        statKey,
        scope: 'total',
        nodes: graph.nodes,
        edges: graph.edges,
        magicTypes,
    });
}

function readNodeStat(
    node: MagicGraphNode,
    statKey: MagicStatKey,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    context: MagicStatCalculationContext
): number {
    return readNodeStats(node, magicTypes, context)[statKey];
}

function readNodeStats(
    node: MagicGraphNode,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    context: MagicStatCalculationContext
): MagicStats {
    const cached = context.nodeStatsById.get(node.id);
    if (cached) return cached;
    if (node.data.excludeFromStatScaling === true) {
        const identityStats = Object.fromEntries(
            MAGIC_STAT_KEYS.map(statKey => [
                statKey,
                MAGIC_STAT_RULES[statKey].serialIdentity,
            ])
        ) as MagicStats;
        context.nodeStatsById.set(node.id, identityStats);
        return identityStats;
    }

    const magicType = magicTypes.get(node.data.magicType);
    const rawStats = magicType?.stats;
    const nodeStatEffectSummary = getNodeStatEffectSummary(magicType, context);
    const executionCount = context.nodeExecutionCounts.get(node.id) ?? DEFAULT_NODE_EXECUTION_COUNT;
    const stats = Object.fromEntries(
        MAGIC_STAT_KEYS.map(statKey => {
            const adjustedValue = applyMagicStatEffectSummary(
                rawStats?.[statKey] ?? 0,
                statKey,
                nodeStatEffectSummary
            );
            const boundedValue = MAGIC_STAT_RULES[statKey].clampNodeValue(
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
                    : MAGIC_STAT_RULES[statKey].repeatSerialValue(
                        weightedValue,
                        executionCount
                    ),
            ];
        })
    ) as MagicStats;

    context.nodeStatsById.set(node.id, stats);
    return stats;
}

function getNodeStatEffectSummary(
    magicType: MagicTypeConfig | undefined,
    context: MagicStatCalculationContext
): MagicStatEffectSummary {
    const cacheKey = magicType?.type ?? '';
    const cached = context.nodeStatEffectSummariesByMagicType.get(cacheKey);
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

    context.nodeStatEffectSummariesByMagicType.set(cacheKey, summary);
    return summary;
}

function readBranchAggregation(
    node: MagicGraphNode,
    statKey: MagicStatKey,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>
): MagicStatBranchAggregation | undefined {
    return magicTypes.get(node.data.magicType)?.statRules?.[statKey]?.branchAggregation;
}

function readBranchAggregationByNodeId(
    nodeId: string,
    statKey: MagicStatKey,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    graph?: GraphTopology
): MagicStatBranchAggregation | undefined {
    const node = graph?.nodeMap.get(nodeId);
    if (!node) return undefined;

    return readBranchAggregation(node, statKey, magicTypes);
}
