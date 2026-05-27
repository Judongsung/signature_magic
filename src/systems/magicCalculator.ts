/**
 * magicCalculator.ts
 *
 * 마법 그래프로부터 게임 데이터를 계산하는 순수 함수 모음입니다.
 * 연결 규칙(validation)은 graphRules.ts에서 담당합니다.
 */

import type { Node, Edge } from '@xyflow/svelte';

// ── 타입 정의 ────────────────────────────────────────────────────────────────

export type MagicType = 'fire' | 'water' | 'wind' | 'earth' | 'arcane';

export interface MagicNodeData extends Record<string, unknown> {
    magicType: MagicType;
    isRoot?: boolean; // 입력이 없는 시작 노드
    isLeaf?: boolean; // 출력이 없는 종단 노드
}

export type MagicNode = Node<MagicNodeData>;

/** 하나의 서클을 구성하는 노드들의 순서 목록 */
export interface CirclePath {
    id: string;
    nodes: MagicNode[];
}

// ── 계산 함수 ────────────────────────────────────────────────────────────────

/**
 * 그래프를 분석하여 서클(Circle) 목록을 계산합니다.
 *
 * N서클 = (입력이 없는 노드 수) + (입력이 2개 이상인 노드 수)
 * 각 서클은 시작 노드에서 출발하여 다음 서클 시작점 직전까지의 노드 체인입니다.
 */
export function calculateCircles(nodes: MagicNode[], edges: Edge[]): CirclePath[] {
    if (nodes.length === 0) return [];

    const inDegree = new Map<string, number>();
    const outEdge = new Map<string, string>(); // source → target (출력 1개이므로 단일값)
    const nodeMap = new Map<string, MagicNode>();

    nodes.forEach(n => {
        inDegree.set(n.id, 0);
        nodeMap.set(n.id, n);
    });

    edges.forEach(e => {
        inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
        outEdge.set(e.source, e.target);
    });

    // 서클 시작점: 입력이 0개이거나 2개 이상인 노드
    const startingNodes = nodes.filter(n => {
        const deg = inDegree.get(n.id) ?? 0;
        return deg === 0 || deg > 1;
    });

    return startingNodes.map((startNode, index) => {
        const chain: MagicNode[] = [];
        let current: MagicNode | undefined = startNode;

        while (current) {
            chain.push(current);
            const nextId = outEdge.get(current.id);
            if (!nextId) break;

            // 다음 노드가 새 서클의 시작점이면 현재 서클은 여기서 종료
            const nextInDegree = inDegree.get(nextId) ?? 0;
            if (nextInDegree > 1) break;

            current = nodeMap.get(nextId);
        }

        return { id: `circle-${index}`, nodes: chain };
    });
}

/**
 * 각 노드의 isRoot / isLeaf 상태를 계산하여 반환합니다.
 * - isRoot: 입력이 없는 노드 (그래프의 시작점)
 * - isLeaf: 출력이 없는 노드 (그래프의 종단점)
 */
export function computeNodeRoles(
    nodes: MagicNode[],
    edges: Edge[]
): Map<string, { isRoot: boolean; isLeaf: boolean }> {
    const inDegree = new Map<string, number>();
    const hasSomeOutput = new Set<string>();

    nodes.forEach(n => inDegree.set(n.id, 0));
    edges.forEach(e => {
        inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
        hasSomeOutput.add(e.source);
    });

    const roles = new Map<string, { isRoot: boolean; isLeaf: boolean }>();
    nodes.forEach(n => {
        roles.set(n.id, {
            isRoot: (inDegree.get(n.id) ?? 0) === 0,
            isLeaf: !hasSomeOutput.has(n.id),
        });
    });
    return roles;
}
