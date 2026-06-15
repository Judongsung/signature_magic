import { type Connection, type Edge } from '@xyflow/svelte';
import type { OnBeforeConnect } from '@xyflow/svelte';
import { createNode } from '../systems/graph/model/graphActions';
import {
    prepareGraphEdge,
    removeDeletedGraphElements,
    syncGraphTopology,
} from '../systems/graph/model/graphEventHandlers';
import { calculateMagic } from '../systems/graph/calculation/magicCalculator';
import { isConnectionValid } from '../systems/graph/model/graphRules';
import { magicTypeMap, magicTypes } from '../systems/graph/registry/magicTypeRegistry';
import { createInitialSystemNodes } from '../systems/graph/model/systemMagicNodes';
import {
    GRAPH_PERFORMANCE_OPERATION_IDS,
    measureGraphOperation,
} from '../systems/graph/diagnostics/graphPerformance';
import {
    createMagicGraphFromPreset,
    createMagicGraphPresetSnapshot,
    hasUserMagicGraphContent,
} from '../systems/graph/presets/magicGraphPresets';
import type {
    CirclePath,
    MagicCalculationResult,
    MagicGraphPresetConfig,
    MagicNode,
    MagicStatEffectBundle,
    MagicStats,
    MagicType,
} from '../types/magic';

const EMPTY_EXTERNAL_STAT_EFFECTS: MagicStatEffectBundle = {
    nodeEffects: [],
    finalEffects: [],
};
const CONNECTION_VALIDATION_CACHE_KEY_SEPARATOR = '|';

interface ConnectionValidationCache {
    nodes: MagicNode[];
    edges: Edge[];
    key: string;
    result: boolean;
}

class GraphStore {
    nodes = $state.raw<MagicNode[]>(createInitialSystemNodes());
    edges = $state.raw<Edge[]>([]);
    externalStatEffects = $state.raw<MagicStatEffectBundle>(EMPTY_EXTERNAL_STAT_EFFECTS);
    private topologySyncScheduled = false;
    private connectionValidationCache: ConnectionValidationCache | undefined;

    readonly calculation: MagicCalculationResult = $derived(
        calculateMagic(this.nodes, this.edges, magicTypes, this.externalStatEffects)
    );
    readonly circles: CirclePath[] = $derived(this.calculation.circles);
    readonly totalStats: MagicStats = $derived(this.calculation.totalStats);
    readonly hasUserContent: boolean = $derived(hasUserMagicGraphContent(this.nodes));

    setExternalStatEffects(statEffects: MagicStatEffectBundle): void {
        this.externalStatEffects = statEffects;
    }

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

        const cacheKey = createConnectionValidationCacheKey(conn);
        if (
            this.connectionValidationCache?.nodes === this.nodes &&
            this.connectionValidationCache.edges === this.edges &&
            this.connectionValidationCache.key === cacheKey
        ) {
            return this.connectionValidationCache.result;
        }

        const result = measureGraphOperation(
            GRAPH_PERFORMANCE_OPERATION_IDS.CHECK_CONNECTION,
            {
                nodeCount: this.nodes.length,
                edgeCount: this.edges.length,
            },
            () => isConnectionValid(conn, this.edges, this.nodes, magicTypeMap)
        );

        this.connectionValidationCache = {
            nodes: this.nodes,
            edges: this.edges,
            key: cacheKey,
            result,
        };
        return result;
    }

    prepareEdge(connection: Connection): Edge | false {
        const update = prepareGraphEdge(connection, this.snapshot(), magicTypeMap);
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
        this.nodes = createInitialSystemNodes();
        this.edges = [];
    }

    loadPreset(preset: MagicGraphPresetConfig): void {
        const next = createMagicGraphFromPreset(preset);

        this.nodes = next.nodes;
        this.edges = next.edges;
        this.syncTopology();
    }

    createPresetSnapshot(label: string): MagicGraphPresetConfig | false {
        return createMagicGraphPresetSnapshot(label, this.snapshot());
    }

    private syncTopology(): void {
        const update = syncGraphTopology(this.snapshot(), magicTypeMap);
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

function createConnectionValidationCacheKey(connection: Connection): string {
    return [
        connection.source ?? '',
        connection.target ?? '',
        connection.sourceHandle ?? '',
        connection.targetHandle ?? '',
    ].join(CONNECTION_VALIDATION_CACHE_KEY_SEPARATOR);
}
