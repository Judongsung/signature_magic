import type { Edge } from '@xyflow/svelte';
import { MAGIC_NODE_KINDS } from '../../../constants/graphConfigs';
import {
    INITIAL_SYSTEM_MAGIC_NODE_CONFIGS,
} from '../../../constants/systemMagicNodeConfigs';
import type { MagicEditorNode, MagicNode } from '../../../types/magic';
import { isMagicCircleNode } from './magicCircleGraph';
import { buildGraphTopology } from '../topology/graphTopology';
import { canReach, reachableNodeIds } from '../topology/graphTraversal';

const SYSTEM_NODE_IDS = new Set(
    INITIAL_SYSTEM_MAGIC_NODE_CONFIGS.map(node => node.id)
);
const SYSTEM_ROOT_IDS = INITIAL_SYSTEM_MAGIC_NODE_CONFIGS
    .filter(node => node.data.isRoot)
    .map(node => node.id);
const SYSTEM_OUTPUT_IDS = INITIAL_SYSTEM_MAGIC_NODE_CONFIGS
    .filter(node => node.data.isLeaf)
    .map(node => node.id);

export function isSystemMagicNode(
    node: MagicEditorNode
): boolean {
    if (isMagicCircleNode(node)) return false;

    return node.data.nodeKind === MAGIC_NODE_KINDS.SYSTEM ||
        SYSTEM_NODE_IDS.has(node.id) ||
        SYSTEM_NODE_IDS.has(node.data.magicType);
}

export function createInitialSystemNodes(): MagicNode[] {
    return INITIAL_SYSTEM_MAGIC_NODE_CONFIGS.map(node => ({
        ...node,
        position: { ...node.position },
        data: { ...node.data },
    }));
}

export function ensureSystemMagicNodes(nodes: MagicEditorNode[]): MagicEditorNode[] {
    const initialSystemNodes = createInitialSystemNodes();
    const systemNodeById = new Map(initialSystemNodes.map(node => [node.id, node]));
    const existingIds = new Set(nodes.map(node => node.id));
    const missingSystemNodes = initialSystemNodes.filter(node => !existingIds.has(node.id));
    let changed = missingSystemNodes.length > 0;

    const normalizedNodes = nodes.map(node => {
        if (isMagicCircleNode(node)) return node;
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
    return Boolean(
        connection.target &&
        SYSTEM_ROOT_IDS.includes(connection.target)
    ) || Boolean(
        connection.source &&
        SYSTEM_OUTPUT_IDS.includes(connection.source)
    );
}

export function filterCalculableMagicGraph(
    nodes: readonly MagicNode[],
    edges: readonly Edge[]
): { nodes: MagicNode[]; edges: Edge[] } {
    const topology = buildGraphTopology(nodes, edges);
    if (
        SYSTEM_ROOT_IDS.length === 0 ||
        SYSTEM_OUTPUT_IDS.length === 0 ||
        SYSTEM_ROOT_IDS.some(nodeId => !topology.nodeMap.has(nodeId)) ||
        SYSTEM_OUTPUT_IDS.some(nodeId => !topology.nodeMap.has(nodeId))
    ) {
        const userNodes = topology.nodes.filter(node => !isSystemMagicNode(node));
        const userNodeIds = new Set(userNodes.map(node => node.id));
        return {
            nodes: userNodes,
            edges: topology.edges.filter(edge => userNodeIds.has(edge.source) && userNodeIds.has(edge.target)),
        };
    }

    const sourceReachableIds = reachableNodeIds(topology, SYSTEM_ROOT_IDS);
    const userNodesOnOutputPath = nodes.filter(node =>
        !isSystemMagicNode(node) &&
        sourceReachableIds.has(node.id) &&
        SYSTEM_OUTPUT_IDS.some(outputId =>
            canReach(topology, node.id, outputId)
        )
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
