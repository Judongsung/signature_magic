import type { Edge } from '@xyflow/svelte';
import {
    EMPTY_MAGIC_STATS,
    MAGIC_STAT_KEYS,
    type MagicNode,
    type MagicStatBranchAggregation,
    type MagicStatKey,
    type MagicStats,
    type MagicTypeConfig,
} from '../../types/magic';
import { MAGIC_STAT_RULES, type MagicStatScope } from './magicStatRules';

export function buildMagicTypeMap(
    magicTypes: readonly MagicTypeConfig[]
): ReadonlyMap<string, MagicTypeConfig> {
    return new Map(magicTypes.map(magicType => [magicType.type, magicType]));
}

export function calculateMagicStats(
    nodes: readonly MagicNode[],
    edges: readonly Edge[],
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    scope: MagicStatScope
): MagicStats {
    const result = { ...EMPTY_MAGIC_STATS };

    MAGIC_STAT_KEYS.forEach(statKey => {
        result[statKey] = scope === 'total'
            ? calculateGraphStat(statKey, nodes, edges, magicTypes)
            : calculateFlatStat(statKey, nodes, edges, magicTypes, scope);
    });

    return result;
}

function calculateFlatStat(
    statKey: MagicStatKey,
    nodes: readonly MagicNode[],
    edges: readonly Edge[],
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    scope: MagicStatScope
): number {
    const values = nodes.map(node => readNodeStat(node, statKey, magicTypes));
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
    nodes: readonly MagicNode[],
    edges: readonly Edge[],
    magicTypes: ReadonlyMap<string, MagicTypeConfig>
): number {
    if (nodes.length === 0) return 0;

    const graph = buildStatGraph(nodes, edges);
    const rootIds = nodes
        .filter(node => (graph.inDegree.get(node.id) ?? 0) === 0)
        .map(node => node.id);

    if (rootIds.length === 0) {
        return calculateFlatStat(statKey, nodes, edges, magicTypes, 'total');
    }

    const rootReachableIds = reachableNodeIds(rootIds, graph);
    const unrootedNodes = nodes.filter(node => !rootReachableIds.has(node.id));
    const unrootedValue = unrootedNodes.length > 0
        ? calculateFlatStat(statKey, unrootedNodes, edges, magicTypes, 'total')
        : 0;

    if (rootIds.length === 1) {
        return evaluateFrom(rootIds[0], statKey, graph, magicTypes, undefined, new Set()) + unrootedValue;
    }

    const mergeNodeId = findNearestCommonReachableNode(rootIds, graph);
    const rootValues = rootIds.map(rootId =>
        evaluateFrom(rootId, statKey, graph, magicTypes, mergeNodeId, new Set())
    );
    const mergedValue = mergeNodeId
        ? evaluateFrom(mergeNodeId, statKey, graph, magicTypes, undefined, new Set())
        : 0;

    return MAGIC_STAT_RULES[statKey].combineBranchValues(
        rootValues,
        mergeNodeId ? readBranchAggregationByNodeId(mergeNodeId, statKey, magicTypes, graph) : 'sum',
        {
            statKey,
            scope: 'total',
            nodes,
            edges,
            magicTypes,
        }
    ) + mergedValue + unrootedValue;
}

interface StatGraph {
    nodeMap: Map<string, MagicNode>;
    outEdges: Map<string, string[]>;
    inDegree: Map<string, number>;
    edges: readonly Edge[];
    nodes: readonly MagicNode[];
}

function buildStatGraph(nodes: readonly MagicNode[], edges: readonly Edge[]): StatGraph {
    const nodeMap = new Map<string, MagicNode>();
    const outEdges = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    nodes.forEach(node => {
        nodeMap.set(node.id, node);
        outEdges.set(node.id, []);
        inDegree.set(node.id, 0);
    });

    edges.forEach(edge => {
        if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) return;
        outEdges.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    });

    return { nodeMap, outEdges, inDegree, edges, nodes };
}

function evaluateFrom(
    nodeId: string,
    statKey: MagicStatKey,
    graph: StatGraph,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    stopNodeId: string | undefined,
    visiting: Set<string>
): number {
    if (nodeId === stopNodeId) return 0;
    if (visiting.has(nodeId)) return 0;

    const node = graph.nodeMap.get(nodeId);
    if (!node) return 0;

    visiting.add(nodeId);
    const ownValue = readNodeStat(node, statKey, magicTypes);
    const nextIds = graph.outEdges.get(nodeId) ?? [];

    if (nextIds.length === 0) {
        visiting.delete(nodeId);
        return ownValue;
    }

    if (nextIds.length === 1) {
        const value = ownValue + evaluateFrom(nextIds[0], statKey, graph, magicTypes, stopNodeId, visiting);
        visiting.delete(nodeId);
        return value;
    }

    const mergeNodeId = findNearestCommonReachableNode(nextIds, graph);
    const branchValues = nextIds.map(nextId =>
        evaluateFrom(nextId, statKey, graph, magicTypes, mergeNodeId, new Set(visiting))
    );
    const branchValue = MAGIC_STAT_RULES[statKey].combineBranchValues(
        branchValues,
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
        ? evaluateFrom(mergeNodeId, statKey, graph, magicTypes, stopNodeId, visiting)
        : 0;

    visiting.delete(nodeId);
    return ownValue + branchValue + afterMergeValue;
}

function readNodeStat(
    node: MagicNode,
    statKey: MagicStatKey,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>
): number {
    return magicTypes.get(node.data.magicType)?.stats?.[statKey] ?? 0;
}

function readBranchAggregation(
    node: MagicNode,
    statKey: MagicStatKey,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>
): MagicStatBranchAggregation {
    return magicTypes.get(node.data.magicType)?.statRules?.[statKey]?.branchAggregation ?? 'sum';
}

function readBranchAggregationByNodeId(
    nodeId: string,
    statKey: MagicStatKey,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>,
    graph?: StatGraph
): MagicStatBranchAggregation {
    const node = graph?.nodeMap.get(nodeId);
    if (!node) return 'sum';

    return readBranchAggregation(node, statKey, magicTypes);
}

function findNearestCommonReachableNode(
    startNodeIds: readonly string[],
    graph: StatGraph
): string | undefined {
    const distanceMaps = startNodeIds.map(startNodeId => reachableDistances(startNodeId, graph));
    if (distanceMaps.length === 0) return undefined;

    const [first, ...rest] = distanceMaps;
    const commonNodeIds = [...first.keys()].filter(nodeId => rest.every(distances => distances.has(nodeId)));

    return commonNodeIds
        .map(nodeId => ({
            nodeId,
            maxDistance: Math.max(...distanceMaps.map(distances => distances.get(nodeId) ?? Number.POSITIVE_INFINITY)),
            totalDistance: distanceMaps.reduce((total, distances) => total + (distances.get(nodeId) ?? 0), 0),
        }))
        .sort((a, b) => a.maxDistance - b.maxDistance || a.totalDistance - b.totalDistance)[0]?.nodeId;
}

function reachableDistances(startNodeId: string, graph: StatGraph): Map<string, number> {
    const distances = new Map<string, number>();
    const queue = [{ nodeId: startNodeId, distance: 0 }];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (distances.has(current.nodeId)) continue;

        distances.set(current.nodeId, current.distance);
        (graph.outEdges.get(current.nodeId) ?? []).forEach(nextId => {
            queue.push({ nodeId: nextId, distance: current.distance + 1 });
        });
    }

    return distances;
}

function reachableNodeIds(startNodeIds: readonly string[], graph: StatGraph): Set<string> {
    const reachable = new Set<string>();
    const queue = [...startNodeIds];

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (reachable.has(nodeId)) continue;

        reachable.add(nodeId);
        (graph.outEdges.get(nodeId) ?? []).forEach(nextId => {
            queue.push(nextId);
        });
    }

    return reachable;
}
