import type { Connection, Edge } from '@xyflow/svelte';
import {
    GRAPH_EDGE_TYPES,
    GRAPH_NODE_TYPES,
    MAGIC_EDGE_ID_PREFIX,
    MAGIC_NODE_HANDLE_CONFIG,
    MAGIC_NODE_ID_PREFIX,
    MAGIC_NODE_KINDS,
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
} from './graphCyclePolicy';
import { computeNodeRoles } from '../calculation/magicCalculator';
import type { MagicNode, MagicType } from '../../../types/magic';
import { isSystemMagicNode } from './systemMagicNodes';

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
        data: {
            magicType,
            nodeKind: MAGIC_NODE_KINDS.USER,
            isRoot: true,
            isLeaf: true,
            inputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
            outputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
        },
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
    const roles = computeNodeRoles(nodes, edges);
    let changed = false;

    const updated = nodes.map(n => {
        const role = roles.get(n.id);
        if (!role) return n;
        const handleCounts = resolveNodeHandleCounts(n, edges, magicTypes, nodes);
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
    magicTypes: MagicTypeLookup
): Edge | undefined {
    return edges.find(edge =>
        edge.target === nodeId &&
        isCycleClosingEdge(edge, edges, nodes, magicTypes)
    );
}

function resolveCycleInputHandleState(
    node: MagicNode,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    maxInputs: number | null,
    usedInputCount: number
): Pick<NodeHandleState, 'cycleInputHandleIndex' | 'cycleInputHandleConnected'> {
    const cycleInputEdge = findCycleInputEdge(node.id, edges, nodes, magicTypes);
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
    if (canNodeReceiveCycleInput(node.id, edges, nodes, magicTypes)) {
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
    nodes: MagicNode[] = [node]
): NodeHandleState {
    const maxInputs = resolveNodeConnectionLimit(node, magicTypes, 'inputs');
    const maxOutputs = resolveNodeConnectionLimit(node, magicTypes, 'outputs');
    const usedInputs = new Set(edges
        .filter(edge => edge.target === node.id)
        .map(edge => edge.targetHandle ?? DEFAULT_INPUT_HANDLE_ID));
    const usedOutputs = new Set(edges
        .filter(edge => edge.source === node.id)
        .map(edge => edge.sourceHandle ?? DEFAULT_OUTPUT_HANDLE_ID));
    const cycleInputHandleState = resolveCycleInputHandleState(
        node,
        edges,
        nodes,
        magicTypes,
        maxInputs,
        usedInputs.size
    );
    const hasExtraCycleInputHandle = cycleInputHandleState.cycleInputHandleIndex !== undefined;

    return {
        inputHandleCount: nextVisibleHandleCount(usedInputs.size, maxInputs, hasExtraCycleInputHandle),
        outputHandleCount: nextVisibleHandleCount(usedOutputs.size, maxOutputs),
        ...cycleInputHandleState,
    };
}

function readHandleIndex(handleId: string | null | undefined, fallbackHandleId: string): number {
    const id = handleId ?? fallbackHandleId;
    const match = id.match(/-(\d+)$/);
    return match ? Number(match[1]) : 0;
}

function normalizeDirectionalHandles(
    edges: Edge[],
    nodeId: string,
    direction: 'source' | 'target'
): Edge[] {
    const handleKey = direction === 'source' ? 'sourceHandle' : 'targetHandle';
    const fallbackHandleId = direction === 'source' ? DEFAULT_OUTPUT_HANDLE_ID : DEFAULT_INPUT_HANDLE_ID;
    const handlePrefix = direction === 'source'
        ? MAGIC_NODE_HANDLE_CONFIG.OUTPUT_PREFIX
        : MAGIC_NODE_HANDLE_CONFIG.INPUT_PREFIX;
    const nodeEdges = edges
        .map((edge, index) => ({ edge, index }))
        .filter(({ edge }) => edge[direction] === nodeId)
        .sort((a, b) => {
            const indexDiff =
                readHandleIndex(a.edge[handleKey], fallbackHandleId) -
                readHandleIndex(b.edge[handleKey], fallbackHandleId);
            return indexDiff || a.index - b.index;
        });

    if (nodeEdges.length === 0) return edges;

    const nextHandleIds = new Map<string, string>();
    // edge 삭제 뒤에는 남은 핸들 번호를 앞쪽부터 다시 채워 중간 빈칸을 없앤다.
    nodeEdges.forEach(({ edge }, index) => {
        nextHandleIds.set(edge.id, `${handlePrefix}-${index}`);
    });

    return edges.map(edge => {
        const nextHandleId = nextHandleIds.get(edge.id);
        if (!nextHandleId || edge[handleKey] === nextHandleId) return edge;
        return { ...edge, [handleKey]: nextHandleId };
    });
}

export function normalizeEdgeHandles(edges: Edge[]): Edge[] {
    const nodeIds = new Set<string>();
    edges.forEach(edge => {
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
    });

    let normalized = edges;
    nodeIds.forEach(nodeId => {
        normalized = normalizeDirectionalHandles(normalized, nodeId, 'source');
        normalized = normalizeDirectionalHandles(normalized, nodeId, 'target');
    });

    return normalized;
}

export function filterEdgesForDeletedNodes(
    deletedIds: Set<string>,
    edges: Edge[]
): Edge[] {
    return edges.filter(e => !deletedIds.has(e.source) && !deletedIds.has(e.target));
}
