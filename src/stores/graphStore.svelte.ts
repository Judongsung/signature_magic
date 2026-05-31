import { type Connection, type Edge } from '@xyflow/svelte';
import type { OnBeforeConnect } from '@xyflow/svelte';
import { createNode } from '../systems/graph/graphActions';
import {
    prepareGraphEdge,
    removeDeletedGraphElements,
    syncGraphTopology,
} from '../systems/graph/graphEventHandlers';
import { calculateMagic } from '../systems/graph/magicCalculator';
import { isConnectionValid } from '../systems/graph/graphRules';
import { magicTypes } from '../systems/graph/magicTypeRegistry';
import type { CirclePath, MagicCalculationResult, MagicNode, MagicStats, MagicType } from '../types/magic';

class GraphStore {
    nodes = $state.raw<MagicNode[]>([]);
    edges = $state.raw<Edge[]>([]);
    private topologySyncScheduled = false;

    readonly calculation: MagicCalculationResult = $derived(
        calculateMagic(this.nodes, this.edges, magicTypes)
    );
    readonly circles: CirclePath[] = $derived(this.calculation.circles);
    readonly totalStats: MagicStats = $derived(this.calculation.totalStats);

    addNode(magicType: MagicType, position: { x: number; y: number }): void {
        this.nodes = [...this.nodes, createNode(magicType, position)];
        this.syncTopology();
    }

    checkConnection(edge: Edge | Connection): boolean {
        const conn: Connection = {
            source: edge.source,
            target: edge.target ?? (edge as Connection).target,
            sourceHandle: edge.sourceHandle ?? null,
            targetHandle: edge.targetHandle ?? null,
        };

        return isConnectionValid(conn, this.edges, this.nodes, magicTypes);
    }

    prepareEdge(connection: Connection): Edge | false {
        const update = prepareGraphEdge(connection, this.snapshot(), magicTypes);
        if (!update) return false;

        this.edges = update.edges;
        return update.edge;
    }

    onEdgeConnected(_connection: Connection): void {
        this.scheduleTopologySync();
    }

    onDelete(deletedNodes: MagicNode[], deletedEdges: Edge[]): void {
        const next = removeDeletedGraphElements(this.snapshot(), deletedNodes, deletedEdges);
        this.nodes = next.nodes;
        this.edges = next.edges;
        this.scheduleTopologySync();
    }

    clear(): void {
        this.nodes = [];
        this.edges = [];
    }

    private syncTopology(): void {
        const update = syncGraphTopology(this.snapshot(), magicTypes);
        if (!update.changed) return;

        this.nodes = update.nodes;
        this.edges = update.edges;
    }

    private scheduleTopologySync(): void {
        if (this.topologySyncScheduled) return;

        this.topologySyncScheduled = true;
        setTimeout(() => {
            this.topologySyncScheduled = false;
            this.syncTopology();
        }, 0);
    }

    private snapshot(): { nodes: MagicNode[]; edges: Edge[] } {
        return {
            nodes: this.nodes,
            edges: this.edges,
        };
    }
}

export const graphStore = new GraphStore();
