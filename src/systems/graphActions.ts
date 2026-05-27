/**
 * graphActions.ts
 *
 * 그래프 요소 생성·변환에 관한 순수 함수 모음입니다.
 * 외부 상태(store)에 의존하지 않으며, 입력을 받아 결과를 반환합니다.
 * graphStore는 이 함수들을 호출하고 반환값으로 상태를 갱신합니다.
 */

import type { Connection, Edge } from '@xyflow/svelte';
import { isConnectionValid } from './graphRules';
import { computeNodeRoles, type MagicNode, type MagicType } from './magicCalculator';

// ── 노드 생성 ─────────────────────────────────────────────────────────────────

/**
 * 새 마법 노드 객체를 생성하여 반환합니다.
 * 초기 상태는 항상 isRoot=true, isLeaf=true (연결 없음)입니다.
 */
export function createNode(
    magicType: MagicType,
    position: { x: number; y: number }
): MagicNode {
    return {
        id: `node-${Date.now()}`,
        type: 'magicNode',
        position,
        data: { magicType, isRoot: true, isLeaf: true },
    };
}

// ── 엣지 생성 ─────────────────────────────────────────────────────────────────

/**
 * 연결 요청을 검증한 뒤 새 엣지 객체를 반환합니다.
 * 유효하지 않으면 false를 반환합니다. (SvelteFlow onbeforeconnect 규약)
 */
export function createEdge(connection: Connection, edges: Edge[]): Edge | false {
    if (!isConnectionValid(connection, edges)) return false;
    return {
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'magicEdge',
    };
}

// ── 노드 역할 갱신 ────────────────────────────────────────────────────────────

/**
 * 현재 그래프 토폴로지를 기반으로 각 노드의 isRoot / isLeaf를 갱신합니다.
 * 실제로 변경된 노드가 있을 때만 새 배열을 반환하여 불필요한 렌더링을 방지합니다.
 */
export function refreshNodeRoles(
    nodes: MagicNode[],
    edges: Edge[]
): { nodes: MagicNode[]; changed: boolean } {
    const roles = computeNodeRoles(nodes, edges);
    let changed = false;

    const updated = nodes.map(n => {
        const role = roles.get(n.id);
        if (!role) return n;
        if (n.data.isRoot === role.isRoot && n.data.isLeaf === role.isLeaf) return n;
        changed = true;
        return { ...n, data: { ...n.data, ...role } };
    });

    return { nodes: updated, changed };
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
