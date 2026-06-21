import type { Edge } from '@xyflow/svelte';
import {
    type MagicNode,
    type MagicGraphNode,
    type MagicStatEffectBundle,
    type MagicStatEffectConfig,
    type MagicStats,
    type MagicTypeConfig,
    type CirclePath,
    type MagicCalculationResult,
} from '../../../types/magic';
import { MAGIC_CIRCLE_ID_PREFIX } from '../../../constants/graphConfigs';
import { buildMagicTypeMap, calculateMagicStats } from './magicStatCalculator';
import { applyMagicStatEffectsToStats } from './magicStatEffects';
import { buildGraphTopology, type GraphTopology } from '../topology/graphTopology';
import { filterCalculableMagicGraph } from '../model/systemMagicNodes';
import {
    buildMagicGraphAnalysis,
    type MagicGraphAnalysis,
} from './magicGraphAnalysis';
import {
    GRAPH_PERFORMANCE_OPERATION_IDS,
    measureGraphOperation,
} from '../diagnostics/graphPerformance';
import {
    buildMagicNodeExecutionCounts,
    type MagicNodeExecutionCounts,
} from './magicRepeatCalculation';

const EMPTY_MAGIC_STAT_EFFECTS: MagicStatEffectBundle = {
    nodeEffects: [],
    finalEffects: [],
};

const SINGLE_PREDECESSOR_COUNT = 1;

export function calculateMagic(
    nodes: MagicNode[],
    edges: Edge[],
    magicTypes: readonly MagicTypeConfig[] = [],
    statEffects: MagicStatEffectBundle = EMPTY_MAGIC_STAT_EFFECTS
): MagicCalculationResult {
    return measureGraphOperation(
        GRAPH_PERFORMANCE_OPERATION_IDS.CALCULATE_MAGIC,
        {
            nodeCount: nodes.length,
            edgeCount: edges.length,
            nodeEffectCount: statEffects.nodeEffects.length,
            finalEffectCount: statEffects.finalEffects.length,
        },
        () => calculateMagicNow(nodes, edges, magicTypes, statEffects)
    );
}

function calculateMagicNow(
    nodes: MagicNode[],
    edges: Edge[],
    magicTypes: readonly MagicTypeConfig[],
    statEffects: MagicStatEffectBundle
): MagicCalculationResult {
    const magicTypeMap = buildMagicTypeMap(magicTypes);
    const calculableGraph = filterCalculableMagicGraph(nodes, edges);
    const analysis = buildMagicGraphAnalysis(
        calculableGraph.nodes,
        calculableGraph.edges,
        magicTypeMap
    );
    const nodeExecutionCounts = buildMagicNodeExecutionCounts(analysis, magicTypeMap);
    const circles = calculateCirclesWithMagicTypes(
        analysis,
        magicTypeMap,
        statEffects.nodeEffects,
        nodeExecutionCounts
    );
    const totalStats = calculateMagicStats(
        calculableGraph.nodes,
        calculableGraph.edges,
        magicTypeMap,
        'total',
        statEffects.nodeEffects,
        analysis,
        nodeExecutionCounts
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
        instability: circles.length === 0
            ? 0
            : Math.max(...circles.map(circle => circle.stats.instability)),
    };
}

export function calculateCircles(
    nodes: MagicNode[],
    edges: Edge[],
    magicTypes: readonly MagicTypeConfig[] = [],
    nodeStatEffects: readonly MagicStatEffectConfig[] = []
): CirclePath[] {
    if (nodes.length === 0) return [];

    const magicTypeMap = buildMagicTypeMap(magicTypes);
    const analysis = buildMagicGraphAnalysis(nodes, edges, magicTypeMap);
    return calculateCirclesWithMagicTypes(
        analysis,
        magicTypeMap,
        nodeStatEffects,
        buildMagicNodeExecutionCounts(analysis, magicTypeMap)
    );
}

function calculateCirclesWithMagicTypes(
    analysis: MagicGraphAnalysis,
    magicTypeMap: ReadonlyMap<string, MagicTypeConfig>,
    nodeStatEffects: readonly MagicStatEffectConfig[] = [],
    nodeExecutionCounts: MagicNodeExecutionCounts = new Map()
): CirclePath[] {
    const { topology, circleStartNodes, cycleCirclePaths } = analysis;
    const cycleChains = cycleCirclePaths.map(path => expandCycleCircleChain(path, topology));
    const cycleChainNodeIds = new Set(cycleChains.flatMap(chain =>
        chain.map(node => node.id)
    ));
    const regularChains = circleStartNodes
        .flatMap(startNode => collectCircleChains(startNode, topology))
        .filter(chain => !chain.some(node => cycleChainNodeIds.has(node.id)));

    // cycle-closing edge가 속한 단일 선행 흐름까지 같은 반복 포함 서클로 확정한다.
    return [...cycleChains, ...regularChains]
        .map((chain, index) => ({
            id: `${MAGIC_CIRCLE_ID_PREFIX}-${index}`,
            nodes: chain,
            stats: calculateMagicStats(
                chain,
                topology.edges,
                magicTypeMap,
                'circle',
                nodeStatEffects,
                undefined,
                nodeExecutionCounts
            ),
        }));
}

function expandCycleCircleChain(
    cyclePath: MagicGraphAnalysis['cycleCirclePaths'][number],
    topology: GraphTopology
): MagicGraphNode[] {
    const chain = [...cyclePath.nodes];
    const chainNodeIds = new Set(chain.map(node => node.id));

    while (chain.length > 0) {
        const firstNode = chain[0];
        const predecessorEdges = (topology.targetEdges.get(firstNode.id) ?? [])
            .filter(edge => edge.id !== cyclePath.closingEdge.id);
        if (predecessorEdges.length !== SINGLE_PREDECESSOR_COUNT) break;

        const predecessor = topology.nodeMap.get(predecessorEdges[0].source);
        if (!predecessor || chainNodeIds.has(predecessor.id)) break;
        if ((topology.outEdges.get(predecessor.id)?.length ?? 0) > SINGLE_PREDECESSOR_COUNT) break;

        chain.unshift(predecessor);
        chainNodeIds.add(predecessor.id);
    }

    return chain;
}

function collectCircleChains(
    startNode: MagicGraphNode,
    topology: GraphTopology
): MagicGraphNode[][] {
    const walk = (
        currentNode: MagicGraphNode,
        chain: MagicGraphNode[],
        visited: Set<string>
    ): MagicGraphNode[][] => {
        const nextIds = topology.outEdges.get(currentNode.id) ?? [];
        if (nextIds.length === 0) return [chain];
        // 출력이 여러 개인 노드는 현재 원을 끝내고, 각 출력 대상에서 별도 원을 시작한다.
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
    edges: Edge[],
    topology: GraphTopology = buildGraphTopology(nodes, edges)
): Map<string, { isRoot: boolean; isLeaf: boolean }> {
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
