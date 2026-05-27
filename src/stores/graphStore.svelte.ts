/**
 * graphStore.svelte.ts
 *
 * 마법 그래프의 단일 반응형 상태 저장소입니다. (Svelte 5 클래스 패턴)
 * - systems/ 함수를 호출하여 비즈니스 로직을 실행합니다.
 * - 컴포넌트는 이 store의 상태를 읽고, 액션 메서드만 호출합니다.
 */

import { type Connection, type Edge } from '@xyflow/svelte';
import type { OnBeforeConnect } from '@xyflow/svelte';
import {
    calculateCircles,
    computeNodeRoles,
    type CirclePath,
    type MagicNode,
    type MagicType,
} from '../systems/magicCalculator';
import { isConnectionValid } from '../systems/graphRules';

class GraphStore {
    // ── 상태 ──────────────────────────────────────────────────────────────
    // SvelteFlow 공식 권장: $state.raw를 사용해야 합니다.
    // $state(deeply reactive proxy)를 쓰면 내부 structuredClone이 실패하고
    // 엣지 타입/스타일이 렌더링에 반영되지 않습니다.
    nodes = $state.raw<MagicNode[]>([]);
    edges = $state.raw<Edge[]>([]);

    // ── 파생 상태 ─────────────────────────────────────────────────────────
    // nodes / edges가 변경될 때마다 자동으로 재계산됩니다.
    readonly circles: CirclePath[] = $derived(
        calculateCircles(this.nodes, this.edges)
    );

    // ── 액션 (컴포넌트가 호출하는 유일한 인터페이스) ──────────────────────

    /** 지정한 타입과 위치에 새 노드를 추가합니다. */
    addNode(magicType: MagicType, position: { x: number; y: number }): void {
        const id = `node-${Date.now()}`;
        this.nodes = [
            ...this.nodes,
            {
                id,
                type: 'magicNode',
                position,
                data: { magicType, isRoot: true, isLeaf: true },
            },
        ];
        this.refreshRoles();
    }

    /**
     * 연결이 현재 DAG 규칙에 유효한지 반환합니다.
     * SvelteFlow의 isValidConnection prop에 전달되어 드래그 중 시각적 피드백을 제공합니다.
     */
    checkConnection(edge: Edge | Connection): boolean {
        // isValidConnection은 Edge | Connection 양측으로 호출될 수 있습니다.
        const conn: Connection = {
            source: edge.source,
            target: edge.target ?? (edge as Connection).target,
            sourceHandle: edge.sourceHandle ?? null,
            targetHandle: edge.targetHandle ?? null,
        };
        return isConnectionValid(conn, this.edges);
    }

    /**
     * onbeforeconnect 훅: 연결 직전에 호출되며 엣지 객체를 커스터마이징합니다.
     * - 반환한 Edge가 실제 SvelteFlow내부에 추가됨
     * - false/null/undefined 반환 시 연결 취소
     */
    prepareEdge(connection: Connection): Edge | false {
        if (!isConnectionValid(connection, this.edges)) return false;
        return {
            id: `e-${connection.source}-${connection.target}-${Date.now()}`,
            source: connection.source!,
            target: connection.target!,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            // CustomEdge: 직선 + 끝 화살표, 선택 하이라이트 내장
            type: 'magicEdge',
        };
    }

    /**
     * 검증 후 역할(isRoot/isLeaf)을 갱신합니다.
     * SvelteFlow의 onconnect 콜백에 전달됩니다.
     * (엣지 추가 자체는 onbeforeconnect → SvelteFlow가 담당)
     */
    tryConnect(_connection: Connection): void {
        // onbeforeconnect가 엣지를 이미 추가했으므로 역할만 갱신합니다.
        this.refreshRoles();
    }

    /**
     * 노드를 삭제합니다. 연결된 엣지도 함께 제거합니다.
     * SvelteFlow의 onnodesdelete 콜백에 전달됩니다.
     */
    removeNodes(deletedNodes: MagicNode[]): void {
        const ids = new Set(deletedNodes.map(n => n.id));
        this.nodes = this.nodes.filter(n => !ids.has(n.id));
        this.edges = this.edges.filter(e => !ids.has(e.source) && !ids.has(e.target));
        this.refreshRoles();
    }

    /**
     * 엣지를 삭제합니다.
     * SvelteFlow의 onedgesdelete 콜백에 전달됩니다.
     */
    removeEdges(deletedEdges: Edge[]): void {
        const ids = new Set(deletedEdges.map(e => e.id));
        this.edges = this.edges.filter(e => !ids.has(e.id));
        this.refreshRoles();
    }

    /** 캔버스 전체를 초기화합니다. */
    clear(): void {
        this.nodes = [];
        this.edges = [];
    }

    // ── 내부 메서드 ────────────────────────────────────────────────────────

    /**
     * 현재 그래프 토폴로지를 기반으로 각 노드의 isRoot / isLeaf를 갱신합니다.
     * 노드 데이터가 실제로 변경된 경우에만 nodes를 교체하여 불필요한 렌더링을 방지합니다.
     */
    private refreshRoles(): void {
        const roles = computeNodeRoles(this.nodes, this.edges);
        let changed = false;

        const updated = this.nodes.map(n => {
            const role = roles.get(n.id);
            if (!role) return n;
            if (n.data.isRoot === role.isRoot && n.data.isLeaf === role.isLeaf) return n;
            changed = true;
            return { ...n, data: { ...n.data, ...role } };
        });

        if (changed) this.nodes = updated;
    }
}

// 앱 전체에서 공유하는 싱글턴 인스턴스
export const graphStore = new GraphStore();
