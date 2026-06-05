import type { Edge } from '@xyflow/svelte';
import { MAGIC_NODE_KINDS } from '../../constants/graphConfigs';
import {
    INITIAL_SYSTEM_MAGIC_NODE_CONFIGS,
    SYSTEM_MAGIC_NODE_CONFIGS,
} from '../../constants/systemMagicNodeConfigs';
import type { MagicNode } from '../../types/magic';
import { buildGraphTopology } from './topology/graphTopology';
import { canReach, reachableNodeIds } from './topology/graphTraversal';

export function isSystemMagicNode(node: Pick<MagicNode, 'id' | 'data'>): boolean {
    return node.data.nodeKind === MAGIC_NODE_KINDS.SYSTEM ||
        node.data.magicType === SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id ||
        node.data.magicType === SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id ||
        node.id === SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id ||
        node.id === SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id;
}

export function createInitialSystemNodes(): MagicNode[] {
    return INITIAL_SYSTEM_MAGIC_NODE_CONFIGS.map(node => ({
        ...node,
        position: { ...node.position },
        data: { ...node.data },
    }));
}

export function ensureSystemMagicNodes(nodes: MagicNode[]): MagicNode[] {
    const initialSystemNodes = createInitialSystemNodes();
    const systemNodeById = new Map(initialSystemNodes.map(node => [node.id, node]));
    const existingIds = new Set(nodes.map(node => node.id));
    const missingSystemNodes = initialSystemNodes.filter(node => !existingIds.has(node.id));
    let changed = missingSystemNodes.length > 0;

    const normalizedNodes = nodes.map(node => {
        const systemNode = systemNodeById.get(node.id);
        if (!systemNode) return node;

        const normalizedNode = {
            ...node,
            type: systemNode.type,
            deletable: false,
            data: {
                ...node.data,
                ...systemNode.data,
            },
        };
        const didNormalize =
            node.type !== normalizedNode.type ||
            node.deletable !== normalizedNode.deletable ||
            node.data.magicType !== normalizedNode.data.magicType ||
            node.data.nodeKind !== normalizedNode.data.nodeKind ||
            node.data.isRoot !== normalizedNode.data.isRoot ||
            node.data.isLeaf !== normalizedNode.data.isLeaf ||
            node.data.inputHandleCount !== normalizedNode.data.inputHandleCount ||
            node.data.outputHandleCount !== normalizedNode.data.outputHandleCount;
        if (didNormalize) changed = true;

        return didNormalize ? normalizedNode : node;
    });

    if (!changed) return nodes;

    return [...missingSystemNodes, ...normalizedNodes];
}

export function isProtectedSystemConnection(connection: { source?: string | null; target?: string | null }): boolean {
    return connection.target === SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id ||
        connection.source === SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id;
}

export function filterCalculableMagicGraph(
    nodes: readonly MagicNode[],
    edges: readonly Edge[]
): { nodes: MagicNode[]; edges: Edge[] } {
    const topology = buildGraphTopology(nodes, edges);
    if (
        !topology.nodeMap.has(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id) ||
        !topology.nodeMap.has(SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id)
    ) {
        const userNodes = topology.nodes.filter(node => !isSystemMagicNode(node));
        const userNodeIds = new Set(userNodes.map(node => node.id));
        return {
            nodes: userNodes,
            edges: topology.edges.filter(edge => userNodeIds.has(edge.source) && userNodeIds.has(edge.target)),
        };
    }

    const sourceReachableIds = reachableNodeIds(topology, [SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id]);
    const userNodesOnOutputPath = nodes.filter(node =>
        !isSystemMagicNode(node) &&
        sourceReachableIds.has(node.id) &&
        canReach(topology, node.id, SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id)
    );
    const userNodeIds = new Set(userNodesOnOutputPath.map(node => node.id));
    const userEdgesOnOutputPath = topology.edges.filter(edge =>
        userNodeIds.has(edge.source) && userNodeIds.has(edge.target)
    );

    return {
        nodes: userNodesOnOutputPath,
        edges: userEdgesOnOutputPath,
    };
}
