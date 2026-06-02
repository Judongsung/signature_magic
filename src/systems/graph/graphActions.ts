/**
 * graphActions.ts
 *
 * 그래프 요소 생성·변환에 관한 순수 함수 모음입니다.
 * 외부 상태(store)에 의존하지 않으며, 입력을 받아 결과를 반환합니다.
 * graphStore는 이 함수들을 호출하고 반환값으로 상태를 갱신합니다.
 */

import type { Connection, Edge } from '@xyflow/svelte';
import {
    DEFAULT_INPUT_HANDLE_ID,
    DEFAULT_OUTPUT_HANDLE_ID,
    filterEdgesReplacedByConnection,
    isConnectionValid,
    resolveNodeConnectionLimit,
    type MagicTypeLookup,
} from './graphRules';
import { computeNodeRoles } from './magicCalculator';
import type { MagicNode, MagicType } from '../../types/magic';

export type IdFactory = () => string;

export function createUniqueId(): string {
    return crypto.randomUUID();
}

// ── 노드 생성 ─────────────────────────────────────────────────────────────────

/**
 * 새 마법 노드 객체를 생성하여 반환합니다.
 * 초기 상태는 항상 isRoot=true, isLeaf=true (연결 없음)입니다.
 */
export function createNode(
    magicType: MagicType,
    position: { x: number; y: number },
    createId: IdFactory = createUniqueId
): MagicNode {
    return {
        id: `node-${createId()}`,
        type: 'magicNode',
        position,
        data: { magicType, isRoot: true, isLeaf: true, inputHandleCount: 1, outputHandleCount: 1 },
    };
}

// ── 엣지 생성 ─────────────────────────────────────────────────────────────────

/**
 * 연결 요청을 검증한 뒤 새 엣지 객체를 반환합니다.
 * 유효하지 않으면 false를 반환합니다. (SvelteFlow onbeforeconnect 규약)
 */
export function createEdge(
    connection: Connection,
    edges: Edge[],
    nodes: MagicNode[],
    magicTypes: MagicTypeLookup,
    createId: IdFactory = createUniqueId
): Edge | false {
    if (!isConnectionValid(connection, edges, nodes, magicTypes)) return false;
    return {
        id: `edge-${createId()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle ?? DEFAULT_OUTPUT_HANDLE_ID,
        targetHandle: connection.targetHandle ?? DEFAULT_INPUT_HANDLE_ID,
        type: 'magicEdge',
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

// ── 노드 역할 갱신 ────────────────────────────────────────────────────────────

/**
 * 현재 그래프 토폴로지를 기반으로 각 노드의 isRoot / isLeaf를 갱신합니다.
 * 실제로 변경된 노드가 있을 때만 새 배열을 반환하여 불필요한 렌더링을 방지합니다.
 */
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
        const handleCounts = resolveNodeHandleCounts(n, edges, magicTypes);
        if (
            n.data.isRoot === role.isRoot &&
            n.data.isLeaf === role.isLeaf &&
            n.data.inputHandleCount === handleCounts.inputHandleCount &&
            n.data.outputHandleCount === handleCounts.outputHandleCount
        ) return n;
        changed = true;
        return { ...n, data: { ...n.data, ...role, ...handleCounts } };
    });

    return { nodes: updated, changed };
}

function nextVisibleHandleCount(usedCount: number, limit: number | null): number {
    if (limit === null) return usedCount + 1;
    return Math.max(1, Math.min(limit, usedCount + 1));
}

export function resolveNodeHandleCounts(
    node: MagicNode,
    edges: Edge[],
    magicTypes: MagicTypeLookup
): { inputHandleCount: number; outputHandleCount: number } {
    const maxInputs = resolveNodeConnectionLimit(node, magicTypes, 'inputs');
    const maxOutputs = resolveNodeConnectionLimit(node, magicTypes, 'outputs');
    const usedInputs = new Set(edges
        .filter(edge => edge.target === node.id)
        .map(edge => edge.targetHandle ?? DEFAULT_INPUT_HANDLE_ID));
    const usedOutputs = new Set(edges
        .filter(edge => edge.source === node.id)
        .map(edge => edge.sourceHandle ?? DEFAULT_OUTPUT_HANDLE_ID));

    return {
        inputHandleCount: nextVisibleHandleCount(usedInputs.size, maxInputs),
        outputHandleCount: nextVisibleHandleCount(usedOutputs.size, maxOutputs),
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
    const handlePrefix = direction === 'source' ? 'output' : 'input';
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

// ── 엣지 필터링 ───────────────────────────────────────────────────────────────

/**
 * 삭제된 노드 id 집합에 연결된 엣지를 모두 제거한 새 배열을 반환합니다.
 */
export function filterEdgesForDeletedNodes(
    deletedIds: Set<string>,
    edges: Edge[]
): Edge[] {
    return edges.filter(e => !deletedIds.has(e.source) && !deletedIds.has(e.target));
}
