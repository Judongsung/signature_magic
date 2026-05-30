/**
 * graphStore.svelte.ts
 *
 * 마법 그래프의 반응형 상태 저장소입니다. (Svelte 5 클래스 패턴)
 *
 * 역할: 라우터 (Router / Coordinator)
 * - 상태(nodes, edges)를 보유합니다.
 * - 컴포넌트 이벤트를 받아 systems/ 함수에 위임하고, 반환값으로 상태를 갱신합니다.
 * - 비즈니스 로직을 직접 포함하지 않습니다.
 */

import { type Connection, type Edge } from '@xyflow/svelte';
import type { OnBeforeConnect } from '@xyflow/svelte';
import { calculateCircles } from '../systems/graph/magicCalculator';
import { isConnectionValid } from '../systems/graph/graphRules';
import {
    createNode,
    createEdgeUpdate,
    filterEdgesForDeletedNodes,
    normalizeEdgeHandles,
    refreshNodeRoles,
} from '../systems/graph/graphActions';
import { magicTypes } from '../systems/graph/magicTypeRegistry';
import type { CirclePath, MagicNode, MagicType } from '../types/magic';

class GraphStore {
    // ── 상태 ──────────────────────────────────────────────────────────────
    // SvelteFlow 공식 권장: $state.raw를 사용해야 합니다.
    nodes = $state.raw<MagicNode[]>([]);
    edges = $state.raw<Edge[]>([]);
    private topologySyncScheduled = false;

    // ── 파생 상태 ─────────────────────────────────────────────────────────
    readonly circles: CirclePath[] = $derived(
        calculateCircles(this.nodes, this.edges)
    );

    // ── 액션 (컴포넌트가 호출하는 유일한 인터페이스) ──────────────────────

    /** 지정한 타입과 위치에 새 노드를 추가합니다. */
    addNode(magicType: MagicType, position: { x: number; y: number }): void {
        this.nodes = [...this.nodes, createNode(magicType, position)];
        this.syncRoles();
    }

    /**
     * isValidConnection prop용 검증 함수입니다.
     * Edge | Connection 양쪽으로 호출될 수 있습니다.
     */
    checkConnection(edge: Edge | Connection): boolean {
        const conn: Connection = {
            source: edge.source,
            target: edge.target ?? (edge as Connection).target,
            sourceHandle: edge.sourceHandle ?? null,
            targetHandle: edge.targetHandle ?? null,
        };
        return isConnectionValid(conn, this.edges, this.nodes, magicTypes);
    }

    /**
     * onbeforeconnect 훅: 연결 직전 호출됩니다.
     * 반환한 Edge가 SvelteFlow 내부에 추가됩니다.
     * false 반환 시 연결이 취소됩니다.
     */
    prepareEdge(connection: Connection): Edge | false {
        const update = createEdgeUpdate(connection, this.edges, this.nodes, magicTypes);
        if (!update) return false;
        this.edges = update.edges;
        return update.edge;
    }

    /**
     * onconnect 훅: 엣지 추가 후 노드 역할을 동기화합니다.
     * (엣지 추가 자체는 onbeforeconnect → SvelteFlow가 담당)
     */
    onEdgeConnected(_connection: Connection): void {
        this.scheduleTopologySync();
    }

    /**
     * ondelete 훅: 노드·엣지 삭제 후 상태를 동기화합니다.
     */
    onDelete(deletedNodes: MagicNode[], deletedEdges: Edge[]): void {
        if (deletedNodes.length) {
            const ids = new Set(deletedNodes.map(n => n.id));
            this.nodes = this.nodes.filter(n => !ids.has(n.id));
            this.edges = filterEdgesForDeletedNodes(ids, this.edges);
        }
        if (deletedEdges.length) {
            const ids = new Set(deletedEdges.map(e => e.id));
            this.edges = this.edges.filter(e => !ids.has(e.id));
        }
        this.scheduleTopologySync();
    }

    /** 캔버스 전체를 초기화합니다. */
    clear(): void {
        this.nodes = [];
        this.edges = [];
    }

    // ── 내부 메서드 ────────────────────────────────────────────────────────

    /** 그래프 토폴로지 변경 후 노드 역할(isRoot/isLeaf)을 동기화합니다. */
    private syncRoles(): void {
        const { nodes, changed } = refreshNodeRoles(this.nodes, this.edges, magicTypes);
        if (changed) this.nodes = nodes;
    }

    private syncTopology(): void {
        const normalizedEdges = normalizeEdgeHandles(this.edges);
        if (!areEdgesEquivalent(this.edges, normalizedEdges)) {
            this.edges = normalizedEdges;
        }
        this.syncRoles();
    }

    private scheduleTopologySync(): void {
        if (this.topologySyncScheduled) return;
        this.topologySyncScheduled = true;
        setTimeout(() => {
            this.topologySyncScheduled = false;
            this.syncTopology();
        }, 0);
    }
}

function areEdgesEquivalent(a: Edge[], b: Edge[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((edge, index) => {
        const other = b[index];
        return Boolean(other) &&
            edge.id === other.id &&
            edge.source === other.source &&
            edge.target === other.target &&
            edge.sourceHandle === other.sourceHandle &&
            edge.targetHandle === other.targetHandle;
    });
}

// 앱 전체에서 공유하는 싱글턴 인스턴스
export const graphStore = new GraphStore();
