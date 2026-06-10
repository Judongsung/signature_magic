import type { Edge } from '@xyflow/svelte';
import { MAGIC_CONNECTION_RULE_KEYS } from '../../../constants/gameConfigs';
import type { MagicGraphNode, MagicTypeConfig } from '../../../types/magic';
import { buildGraphTopology, type GraphTopology } from '../topology/graphTopology';
import {
    findNearestCommonReachableNode,
    reachableNodeIds,
} from '../topology/graphTraversal';

export interface MagicGraphAnalysis {
    topology: GraphTopology;
    rootIds: readonly string[];
    rootReachableNodeIds: ReadonlySet<string>;
    unrootedNodes: readonly MagicGraphNode[];
    mergeNodeId?: string;
    circleStartNodes: readonly MagicGraphNode[];
}

export function buildMagicGraphAnalysis(
    nodes: readonly MagicGraphNode[],
    edges: readonly Edge[],
    magicTypeMap: ReadonlyMap<string, MagicTypeConfig>
): MagicGraphAnalysis {
    const topology = buildGraphTopology(nodes, edges);
    const rootIds = topology.rootIds;
    const rootReachableNodeIds = reachableNodeIds(topology, rootIds);
    const unrootedNodes = topology.nodes.filter(node => !rootReachableNodeIds.has(node.id));
    const mergeNodeId = rootIds.length > 1
        ? findNearestCommonReachableNode(topology, rootIds)
        : undefined;
    const circleStartNodes = resolveCircleStartNodes(topology, rootReachableNodeIds, magicTypeMap);

    return {
        topology,
        rootIds,
        rootReachableNodeIds,
        unrootedNodes,
        mergeNodeId,
        circleStartNodes,
    };
}

function resolveCircleStartNodes(
    topology: GraphTopology,
    rootReachableNodeIds: ReadonlySet<string>,
    magicTypeMap: ReadonlyMap<string, MagicTypeConfig>
): MagicGraphNode[] {
    const rootStartNodes = topology.rootIds
        .map(nodeId => topology.nodeMap.get(nodeId))
        .filter((node): node is MagicGraphNode => Boolean(node));
    const branchStartNodes = topology.edges
        .filter(edge => (topology.outEdges.get(edge.source)?.length ?? 0) > 1)
        .map(edge => topology.nodeMap.get(edge.target))
        .filter((node): node is MagicGraphNode => Boolean(node));
    const mergeStartNodes = topology.nodes.filter(node => {
        const degree = topology.inDegree.get(node.id) ?? 0;
        return degree > 1;
    });
    const cycleStartNodes = topology.nodes.filter(node =>
        magicTypeMap.get(node.data.magicType)
            ?.connectionRules?.[MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT] &&
        !rootReachableNodeIds.has(node.id)
    );

    return dedupeNodes([
        ...rootStartNodes,
        ...branchStartNodes,
        ...mergeStartNodes,
        ...cycleStartNodes,
    ]);
}

function dedupeNodes(nodes: readonly MagicGraphNode[]): MagicGraphNode[] {
    const seen = new Set<string>();
    return nodes.filter(node => {
        if (seen.has(node.id)) return false;
        seen.add(node.id);
        return true;
    });
}
