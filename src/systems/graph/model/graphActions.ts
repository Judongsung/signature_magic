import type { Connection, Edge } from '@xyflow/svelte';
import {
    GRAPH_EDGE_TYPES,
    GRAPH_NODE_TYPES,
    MAGIC_EDGE_ID_PREFIX,
    MAGIC_NODE_HANDLE_CONFIG,
    MAGIC_NODE_ID_PREFIX,
} from '../../../constants/graphConfigs';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import {
    DEFAULT_INPUT_HANDLE_ID,
    DEFAULT_OUTPUT_HANDLE_ID,
    filterEdgesReplacedByConnection,
    isConnectionValid,
    resolveNodeConnectionLimit,
    type MagicTypeLookup,
} from './graphRules';
import {
    canNodeReceiveCycleInput,
    isCycleClosingEdge,
    type CyclePolicyContext,
} from './graphCyclePolicy';
import { computeNodeRoles } from '../calculation/magicCalculator';
import type { MagicNode, MagicType } from '../../../types/magic';
import { isSystemMagicNode } from './systemMagicNodes';
import { buildGraphTopology, type GraphTopology } from '../topology/graphTopology';
import { createReachabilityCache } from '../topology/graphTraversal';
import { createUserMagicNodeData } from './magicNodeData';

export type IdFactory = () => string;

interface NodeHandleState {
    inputHandleCount: number;
    outputHandleCount: number;
    cycleInputHandleIndex?: number;
    cycleInputHandleConnected?: boolean;
}

export function createUniqueId(): string {
    return crypto.randomUUID();
}

export function createNode(
    magicType: MagicType,
    position: { x: number; y: number },
    createId: IdFactory = createUniqueId
): MagicNode {
    return {
        id: `${MAGIC_NODE_ID_PREFIX}-${createId()}`,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position,
        data: createUserMagicNodeData(magicType),
    };
}

export function createEdge(
    connection: Connection,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    createId: IdFactory = createUniqueId
): Edge | false {
    if (!isConnectionValid(connection, edges, nodes, magicTypes)) return false;
    return {
        id: `${MAGIC_EDGE_ID_PREFIX}-${createId()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle ?? DEFAULT_OUTPUT_HANDLE_ID,
        targetHandle: connection.targetHandle ?? DEFAULT_INPUT_HANDLE_ID,
        type: GRAPH_EDGE_TYPES.MAGIC_EDGE,
    };
}

export function createEdgeUpdate(
    connection: Connection,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    createId: IdFactory = createUniqueId
): { edge: Edge; edges: Edge[] } | false {
    const nextEdges = filterEdgesReplacedByConnection(connection, edges);
    const edge = createEdge(connection, edges, nodes, magicTypes, createId);
    if (!edge) return false;
    return { edge, edges: nextEdges };
}

export function refreshNodeRoles(
    nodes: MagicNode[],
    edges: Edge[],
    magicTypes: MagicTypeLookup
): { nodes: MagicNode[]; changed: boolean } {
    const topology = buildGraphTopology(nodes, edges);
    const roles = computeNodeRoles(nodes, edges, topology);
    const cycleContext: CyclePolicyContext = {
        outEdges: topology.outEdges,
        nodeMap: topology.nodeMap,
        reachabilityCache: createReachabilityCache(),
    };
    let changed = false;

    const updated = nodes.map(n => {
        const role = roles.get(n.id);
        if (!role) return n;
        const handleCounts = resolveNodeHandleCounts(n, edges, magicTypes, nodes, topology, cycleContext);
        const nodeRole = isSystemMagicNode(n)
            ? {
                isRoot: n.id === SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
                isLeaf: n.id === SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
            }
            : role;
        if (
            n.data.isRoot === nodeRole.isRoot &&
            n.data.isLeaf === nodeRole.isLeaf &&
            n.data.inputHandleCount === handleCounts.inputHandleCount &&
            n.data.outputHandleCount === handleCounts.outputHandleCount &&
            n.data.cycleInputHandleIndex === handleCounts.cycleInputHandleIndex &&
            n.data.cycleInputHandleConnected === handleCounts.cycleInputHandleConnected
        ) return n;
        changed = true;
        return { ...n, data: { ...n.data, ...nodeRole, ...handleCounts } };
    });

    return { nodes: updated, changed };
}

function nextVisibleHandleCount(
    usedCount: number,
    limit: number | null,
    hasExtraVisibleHandle = false
): number {
    // 사용된 핸들 뒤에 빈 핸들 하나를 더 보여 주되, 명시된 연결 제한은 넘지 않는다.
    if (limit === 0) return 0;
    const limitedCount = limit === null
        ? usedCount + 1
        : Math.min(limit + (hasExtraVisibleHandle ? 1 : 0), usedCount + 1);

    return Math.max(MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT, usedCount, limitedCount);
}

function findCycleInputEdge(
    nodeId: string,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    topology: GraphTopology,
    cycleContext: CyclePolicyContext
): Edge | undefined {
    return (topology.targetEdges.get(nodeId) ?? []).find(edge =>
        isCycleClosingEdge(edge, edges, nodes, magicTypes, cycleContext)
    );
}

function resolveCycleInputHandleState(
    node: MagicNode,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    maxInputs: number | null,
    usedInputCount: number,
    topology: GraphTopology,
    cycleContext: CyclePolicyContext
): Pick<NodeHandleState, 'cycleInputHandleIndex' | 'cycleInputHandleConnected'> {
    const cycleInputEdge = findCycleInputEdge(node.id, edges, nodes, magicTypes, topology, cycleContext);
    if (cycleInputEdge) {
        return {
            cycleInputHandleIndex: readHandleIndex(cycleInputEdge.targetHandle, DEFAULT_INPUT_HANDLE_ID),
            cycleInputHandleConnected: true,
        };
    }

    if (maxInputs === null || maxInputs === 0 || usedInputCount !== maxInputs) {
        return {
            cycleInputHandleIndex: undefined,
            cycleInputHandleConnected: undefined,
        };
    }
    if (canNodeReceiveCycleInput(node.id, edges, nodes, magicTypes, cycleContext)) {
        return {
            cycleInputHandleIndex: maxInputs,
            cycleInputHandleConnected: false,
        };
    }

    return {
        cycleInputHandleIndex: undefined,
        cycleInputHandleConnected: undefined,
    };
}

export function resolveNodeHandleCounts(
    node: MagicNode,
    edges: Edge[],
    magicTypes: MagicTypeLookup,
    nodes: MagicNode[] = [node],
    topology?: GraphTopology,
    cycleContext?: CyclePolicyContext
): NodeHandleState {
    const resolvedTopology = topology ?? buildGraphTopology(nodes, edges);
    const resolvedCycleContext = cycleContext ?? {
        outEdges: resolvedTopology.outEdges,
        nodeMap: resolvedTopology.nodeMap,
        reachabilityCache: createReachabilityCache(),
    };
    const shouldScanRawEdges = !topology;
    const maxInputs = resolveNodeConnectionLimit(node, magicTypes, 'inputs');
    const maxOutputs = resolveNodeConnectionLimit(node, magicTypes, 'outputs');
    const usedInputs = new Set(readNodeTargetEdges(node.id, edges, resolvedTopology, shouldScanRawEdges)
        .map(edge => edge.targetHandle ?? DEFAULT_INPUT_HANDLE_ID));
    const usedOutputs = new Set(readNodeSourceEdges(node.id, edges, resolvedTopology, shouldScanRawEdges)
        .map(edge => edge.sourceHandle ?? DEFAULT_OUTPUT_HANDLE_ID));
    const cycleInputHandleState = resolveCycleInputHandleState(
        node,
        edges,
        nodes,
        magicTypes,
        maxInputs,
        usedInputs.size,
        resolvedTopology,
        resolvedCycleContext
    );
    const hasExtraCycleInputHandle = cycleInputHandleState.cycleInputHandleIndex !== undefined;

    return {
        inputHandleCount: nextVisibleHandleCount(usedInputs.size, maxInputs, hasExtraCycleInputHandle),
        outputHandleCount: nextVisibleHandleCount(usedOutputs.size, maxOutputs),
        ...cycleInputHandleState,
    };
}

function readNodeSourceEdges(
    nodeId: string,
    edges: Edge[],
    topology: GraphTopology,
    shouldScanRawEdges: boolean
): readonly Edge[] {
    return shouldScanRawEdges
        ? edges.filter(edge => edge.source === nodeId)
        : topology.sourceEdges.get(nodeId) ?? [];
}

function readNodeTargetEdges(
    nodeId: string,
    edges: Edge[],
    topology: GraphTopology,
    shouldScanRawEdges: boolean
): readonly Edge[] {
    return shouldScanRawEdges
        ? edges.filter(edge => edge.target === nodeId)
        : topology.targetEdges.get(nodeId) ?? [];
}

function readHandleIndex(handleId: string | null | undefined, fallbackHandleId: string): number {
    const id = handleId ?? fallbackHandleId;
    const match = id.match(/-(\d+)$/);
    return match ? Number(match[1]) : 0;
}

function buildNormalizedDirectionalHandleIds(
    edges: Edge[],
    direction: 'source' | 'target'
): Map<string, string> {
    const handleKey = direction === 'source' ? 'sourceHandle' : 'targetHandle';
    const fallbackHandleId = direction === 'source' ? DEFAULT_OUTPUT_HANDLE_ID : DEFAULT_INPUT_HANDLE_ID;
    const handlePrefix = direction === 'source'
        ? MAGIC_NODE_HANDLE_CONFIG.OUTPUT_PREFIX
        : MAGIC_NODE_HANDLE_CONFIG.INPUT_PREFIX;
    const groupedEdges = new Map<string, { edge: Edge; index: number }[]>();
    const nextHandleIds = new Map<string, string>();

    edges.forEach((edge, index) => {
        const nodeId = edge[direction];
        const group = groupedEdges.get(nodeId) ?? [];
        group.push({ edge, index });
        groupedEdges.set(nodeId, group);
    });

    groupedEdges.forEach(nodeEdges => {
        nodeEdges.sort((a, b) => {
            const indexDiff =
                readHandleIndex(a.edge[handleKey], fallbackHandleId) -
                readHandleIndex(b.edge[handleKey], fallbackHandleId);
            return indexDiff || a.index - b.index;
        });

        // edge 삭제 뒤에는 남은 핸들 번호를 앞쪽부터 다시 채워 중간 빈칸을 없앤다.
        nodeEdges.forEach(({ edge }, index) => {
            nextHandleIds.set(edge.id, `${handlePrefix}-${index}`);
        });
    });

    return nextHandleIds;
}

export function normalizeEdgeHandles(edges: Edge[]): Edge[] {
    const sourceHandleIds = buildNormalizedDirectionalHandleIds(edges, 'source');
    const targetHandleIds = buildNormalizedDirectionalHandleIds(edges, 'target');

    return edges.map(edge => {
        const sourceHandle = sourceHandleIds.get(edge.id);
        const targetHandle = targetHandleIds.get(edge.id);
        if (
            (!sourceHandle || edge.sourceHandle === sourceHandle) &&
            (!targetHandle || edge.targetHandle === targetHandle)
        ) {
            return edge;
        }

        return {
            ...edge,
            ...(sourceHandle ? { sourceHandle } : {}),
            ...(targetHandle ? { targetHandle } : {}),
        };
    });
}

export function filterEdgesForDeletedNodes(
    deletedIds: Set<string>,
    edges: Edge[]
): Edge[] {
    return edges.filter(e => !deletedIds.has(e.source) && !deletedIds.has(e.target));
}
