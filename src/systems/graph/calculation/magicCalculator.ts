import type { Edge } from '@xyflow/svelte';
import {
    type MagicNode,
    type MagicStatEffectBundle,
    type MagicStatEffectConfig,
    type MagicStats,
    type MagicTypeConfig,
    type CirclePath,
    type MagicCalculationResult,
} from '../../../types/magic';
import { MAGIC_CONNECTION_RULE_KEYS } from '../../../constants/gameConfigs';
import { MAGIC_CIRCLE_ID_PREFIX } from '../../../constants/graphConfigs';
import { buildMagicTypeMap, calculateMagicStats } from './magicStatCalculator';
import { applyMagicStatEffectsToStats } from './magicStatEffects';
import { buildGraphTopology, type GraphTopology } from '../topology/graphTopology';
import { reachableNodeIds } from '../topology/graphTraversal';
import { filterCalculableMagicGraph } from '../model/systemMagicNodes';

const EMPTY_MAGIC_STAT_EFFECTS: MagicStatEffectBundle = {
    nodeEffects: [],
    finalEffects: [],
};

export function calculateMagic(
    nodes: MagicNode[],
    edges: Edge[],
    magicTypes: readonly MagicTypeConfig[] = [],
    statEffects: MagicStatEffectBundle = EMPTY_MAGIC_STAT_EFFECTS
): MagicCalculationResult {
    const magicTypeMap = buildMagicTypeMap(magicTypes);
    const calculableGraph = filterCalculableMagicGraph(nodes, edges);
    const circles = calculateCirclesWithMagicTypes(
        calculableGraph.nodes,
        calculableGraph.edges,
        magicTypeMap,
        statEffects.nodeEffects
    );
    const totalStats = calculateMagicStats(
        calculableGraph.nodes,
        calculableGraph.edges,
        magicTypeMap,
        'total',
        statEffects.nodeEffects
    );

    return {
        circles,
        totalStats: applyMagicStatEffectsToStats(
            applyCircleInstabilityToTotalStats(totalStats, circles),
            statEffects.finalEffects
        ),
    };
}

function applyCircleInstabilityToTotalStats(
    totalStats: MagicStats,
    circles: readonly CirclePath[]
): MagicStats {
    return {
        ...totalStats,
        instability: circles.reduce((total, circle) => total + circle.stats.instability, 0),
    };
}

export function calculateCircles(
    nodes: MagicNode[],
    edges: Edge[],
    magicTypes: readonly MagicTypeConfig[] = [],
    nodeStatEffects: readonly MagicStatEffectConfig[] = []
): CirclePath[] {
    if (nodes.length === 0) return [];

    return calculateCirclesWithMagicTypes(nodes, edges, buildMagicTypeMap(magicTypes), nodeStatEffects);
}

function calculateCirclesWithMagicTypes(
    nodes: MagicNode[],
    edges: Edge[],
    magicTypeMap: ReadonlyMap<string, MagicTypeConfig>,
    nodeStatEffects: readonly MagicStatEffectConfig[] = []
): CirclePath[] {
    const topology = buildGraphTopology(nodes, edges);
    const rootStartNodes = topology.rootIds
        .map(nodeId => topology.nodeMap.get(nodeId))
        .filter((node): node is MagicNode => Boolean(node));
    const branchStartNodes = topology.edges
        .filter(edge => (topology.outEdges.get(edge.source)?.length ?? 0) > 1)
        .map(edge => topology.nodeMap.get(edge.target))
        .filter((node): node is MagicNode => Boolean(node));
    const mergeStartNodes = topology.nodes.filter(node => {
        const degree = topology.inDegree.get(node.id) ?? 0;
        return degree > 1;
    });
    const rootReachableNodeIds = reachableNodeIds(topology, topology.rootIds);
    const cycleStartNodes = topology.nodes.filter(node =>
        magicTypeMap.get(node.data.magicType)
            ?.connectionRules?.[MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT] &&
        !rootReachableNodeIds.has(node.id)
    );
    const uniqueStartNodes = dedupeNodes([
        ...rootStartNodes,
        ...branchStartNodes,
        ...mergeStartNodes,
        ...cycleStartNodes,
    ]);

    return uniqueStartNodes
        .flatMap(startNode => collectCircleChains(startNode, topology))
        .map((chain, index) => ({
            id: `${MAGIC_CIRCLE_ID_PREFIX}-${index}`,
            nodes: chain,
            stats: calculateMagicStats(chain, topology.edges, magicTypeMap, 'circle', nodeStatEffects),
        }));
}

function dedupeNodes(nodes: MagicNode[]): MagicNode[] {
    const seen = new Set<string>();
    return nodes.filter(node => {
        if (seen.has(node.id)) return false;
        seen.add(node.id);
        return true;
    });
}

function collectCircleChains(
    startNode: MagicNode,
    topology: GraphTopology
): MagicNode[][] {
    const walk = (currentNode: MagicNode, chain: MagicNode[], visited: Set<string>): MagicNode[][] => {
        const nextIds = topology.outEdges.get(currentNode.id) ?? [];
        if (nextIds.length === 0) return [chain];
        if (nextIds.length > 1) return [chain];

        return nextIds.flatMap(nextId => {
            if (visited.has(nextId)) return [chain];
            if ((topology.inDegree.get(nextId) ?? 0) > 1) return [chain];

            const nextNode = topology.nodeMap.get(nextId);
            if (!nextNode) return [chain];

            return walk(nextNode, [...chain, nextNode], new Set([...visited, nextId]));
        });
    };

    return walk(startNode, [startNode], new Set([startNode.id]));
}

export function computeNodeRoles(
    nodes: MagicNode[],
    edges: Edge[]
): Map<string, { isRoot: boolean; isLeaf: boolean }> {
    const topology = buildGraphTopology(nodes, edges);
    const hasSomeOutput = new Set(topology.edges.map(edge => edge.source));

    const roles = new Map<string, { isRoot: boolean; isLeaf: boolean }>();
    nodes.forEach(node => {
        roles.set(node.id, {
            isRoot: (topology.inDegree.get(node.id) ?? 0) === 0,
            isLeaf: !hasSomeOutput.has(node.id),
        });
    });

    return roles;
}
