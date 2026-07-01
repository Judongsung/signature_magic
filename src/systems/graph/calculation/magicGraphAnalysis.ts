import type { MagicGraphEdge } from '../magicGraphTypes';
import type { MagicGraphNode } from '../../../types/magic';
import { buildGraphTopology, type GraphTopology } from '../topology/graphTopology';
import {
    createReachabilityCache,
    findNearestCommonReachableNode,
    reachableNodeIds,
    type ReachabilityCache,
} from '../topology/graphTraversal';

export interface MagicGraphAnalysis {
    topology: GraphTopology;
    rootIds: readonly string[];
    unrootedNodes: readonly MagicGraphNode[];
    mergeNodeId?: string;
    reachabilityCache: ReachabilityCache;
}

export function buildMagicGraphAnalysis(
    nodes: readonly MagicGraphNode[],
    edges: readonly MagicGraphEdge[]
): MagicGraphAnalysis {
    const topology = buildGraphTopology(nodes, edges);
    const reachabilityCache = createReachabilityCache();
    const rootIds = topology.rootIds;
    const rootReachableNodeIds = reachableNodeIds(topology, rootIds);
    const unrootedNodes = topology.nodes.filter(node => !rootReachableNodeIds.has(node.id));
    const mergeNodeId = rootIds.length > 1
        ? findNearestCommonReachableNode(topology, rootIds, reachabilityCache)
        : undefined;

    return {
        topology,
        rootIds,
        unrootedNodes,
        mergeNodeId,
        reachabilityCache,
    };
}
