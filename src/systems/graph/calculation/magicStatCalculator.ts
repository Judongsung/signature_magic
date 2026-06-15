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
    type MagicStatEffectSummary,
} from './magicStatEffects';
import type { GraphTopology } from '../topology/graphTopology';
import {
    buildMagicGraphAnalysis,
    type MagicGraphAnalysis,
} from './magicGraphAnalysis';
import { findNearestCommonReachableNode } from '../topology/graphTraversal';

export function buildMagicTypeMap(
    magicTypes: readonly MagicTypeConfig[]
): ReadonlyMap<string, MagicTypeConfig> {
    return new Map(magicTypes.map(magicType => [magicType.type, magicType]));
}

interface MagicStatCalculationContext {
    nodeStatEffectSummary: MagicStatEffectSummary;
    nodeStatsById: Map<string, MagicStats>;
}

export function calculateMagicStats(
    nodes: readonly MagicGraphNode[],
    edges: readonly Edge[],
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    scope: MagicStatScope,
    nodeStatEffects: readonly MagicStatEffectConfig[] = [],
    analysis?: MagicGraphAnalysis
): MagicStats {
    const result = { ...EMPTY_MAGIC_STATS };
    const graphAnalysis = scope === 'total'
        ? analysis ?? buildMagicGraphAnalysis(nodes, edges, magicTypes)
        : undefined;
    const context: MagicStatCalculationContext = {
        nodeStatEffectSummary: buildMagicStatEffectSummary(nodeStatEffects),
        nodeStatsById: new Map(),
    };

    MAGIC_STAT_KEYS.forEach(statKey => {
        const value = scope === 'total'
            ? calculateGraphStat(statKey, graphAnalysis!, magicTypes, context)
            : calculateFlatStat(statKey, nodes, edges, magicTypes, scope, context);

        result[statKey] = MAGIC_STAT_RULES[statKey].scaleFinalValue(value, {
            statKey,
            scope,
            nodes,
            edges,
            magicTypes,
        });
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
    if (visiting.has(nodeId)) return 0;

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
        // 분기 집계 방식은 분기 시작 노드의 statRules가 정한다. 예: castingTime은 병렬 분기에서 max를 쓸 수 있다.
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

    const rawStats = magicTypes.get(node.data.magicType)?.stats;
    const stats = Object.fromEntries(
        MAGIC_STAT_KEYS.map(statKey => [
            statKey,
            applyMagicStatEffectSummary(
                rawStats?.[statKey] ?? 0,
                statKey,
                context.nodeStatEffectSummary
            ),
        ])
    ) as MagicStats;

    context.nodeStatsById.set(node.id, stats);
    return stats;
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
