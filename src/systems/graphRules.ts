/**
 * graphRules.ts
 *
 * DAG(비순환 방향 그래프) 연결 규칙을 정의하는 순수 함수 모음입니다.
 * 외부 상태에 의존하지 않으며, 입력을 받아 결과를 반환합니다.
 */

import type { Connection, Edge } from '@xyflow/svelte';

/**
 * DFS로 `from` 노드에서 `to` 노드까지 도달 가능한지 확인합니다.
 * 새 엣지를 추가하기 전 사이클 발생 여부를 사전에 검사하기 위해 사용됩니다.
 */
function canReach(
    from: string,
    to: string,
    adj: Map<string, string[]>,
    visited = new Set<string>()
): boolean {
    if (from === to) return true;
    if (visited.has(from)) return false;
    visited.add(from);
    return (adj.get(from) ?? []).some(neighbor => canReach(neighbor, to, adj, visited));
}

/**
 * 현재 엣지 목록을 기반으로 인접 리스트(adjacency list)를 생성합니다.
 */
function buildAdjacency(edges: Edge[]): Map<string, string[]> {
    const adj = new Map<string, string[]>();
    edges.forEach(e => {
        if (!adj.has(e.source)) adj.set(e.source, []);
        adj.get(e.source)!.push(e.target);
    });
    return adj;
}

/**
 * 해당 소스 노드가 이미 출력(outgoing edge)을 가지고 있는지 확인합니다.
 * 나가는 선분은 1개만 허용되는 규칙을 구현합니다.
 */
export function isOutputLimitReached(sourceId: string, edges: Edge[]): boolean {
    return edges.some(e => e.source === sourceId);
}

/**
 * 새 연결(connection)을 추가했을 때 사이클이 발생하는지 확인합니다.
 * source → target 연결을 추가하면, target에서 다시 source로 돌아오는
 * 경로가 존재할 경우 사이클이 됩니다.
 */
export function hasCycleDFS(connection: Connection, edges: Edge[]): boolean {
    const { source, target } = connection;
    if (!source || !target) return true;
    const adj = buildAdjacency(edges);
    return canReach(target, source, adj);
}

/**
 * 새 연결이 모든 DAG 규칙을 통과하는지 종합적으로 검증합니다.
 *
 * 규칙:
 * 1. source와 target이 존재해야 하며, 자기 자신에게 연결 불가
 * 2. 출력 선분은 1개만 허용 (source 노드가 이미 outgoing edge를 가지면 불가)
 * 3. 사이클 형성 불가 (DFS로 검사)
 */
export function isConnectionValid(connection: Connection, edges: Edge[]): boolean {
    const { source, target } = connection;

    if (!source || !target || source === target) return false;
    if (isOutputLimitReached(source, edges)) return false;
    if (hasCycleDFS(connection, edges)) return false;

    return true;
}
