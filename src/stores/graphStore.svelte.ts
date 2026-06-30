import { type Connection, type Edge } from '@xyflow/svelte';
import { updateMagicNodeSettings } from '../systems/graph/model/magicNodeData';
import {
    isGraphConnectionValid,
    prepareGraphEdge,
    removeDeletedGraphElements,
    syncGraphTopology,
} from '../systems/graph/model/graphEventHandlers';
import { calculateMagic } from '../systems/graph/calculation/magicCalculator';
import { magicTypeMap, magicTypes } from '../systems/graph/registry/magicTypeRegistry';
import {
    activateCircleForUnitSelection,
    getMagicCircleNodes,
    isMagicCircleNode,
    resolveSelectedUnitCircleId,
    selectOnlyCircle,
} from '../systems/graph/model/magicCircleGraph';
import {
    addMagicCircle,
    addMagicNodeToCircle,
    createInitialMagicCircleGraph,
    moveMagicNodeGroup,
    normalizeMagicCircleSequences,
    resizeMagicCircleSequence,
    updateMagicCircleMetadata,
    type MagicNodeSequenceOrigin,
} from '../systems/graph/model/magicCircleGraphActions';
import {
    GRAPH_PERFORMANCE_OPERATION_IDS,
    measureGraphOperation,
} from '../systems/graph/diagnostics/graphPerformance';
import {
    createEmptyMagicStatEffectBundle,
} from '../systems/graph/calculation/magicStatEffectBundles';
import {
    MAGIC_GRAPH_SELECTION_MODES,
    normalizeMagicGraphSelection,
    resolveMagicGraphSelectionTargetCircleId,
    type MagicGraphSelectionScope,
} from '../systems/graph/editor/magicGraphSelection';
import {
    createMagicGraphClipboardPayload,
    parseMagicGraphClipboardPayload,
    pasteMagicGraphClipboardPayload,
    serializeMagicGraphClipboardPayload,
} from '../systems/graph/model/magicGraphClipboard';
import {
    createMagicGraphFromPreset,
    createMagicGraphPresetSnapshot,
    hasUserMagicGraphContent,
} from '../systems/graph/presets/magicGraphPresets';
import type {
    CirclePath,
    MagicCircleMetadata,
    MagicCircleState,
    MagicEditorNode,
    MagicSignatureMetadata,
    MagicCalculationResult,
    MagicGraphPresetConfig,
    MagicNodeSettings,
    MagicStatEffectBundle,
    MagicStats,
    MagicType,
} from '../types/magic';
import { EMPTY_MAGIC_SIGNATURE_METADATA } from '../types/magic';

const CONNECTION_VALIDATION_CACHE_KEY_SEPARATOR = '|';

interface ConnectionValidationCache {
    nodes: MagicEditorNode[];
    edges: Edge[];
    key: string;
    result: boolean;
}

const initialGraph = createInitialMagicCircleGraph();

class GraphStore {
    nodes = $state.raw<MagicEditorNode[]>(initialGraph.nodes);
    edges = $state.raw<Edge[]>(initialGraph.edges);
    externalStatEffects = $state.raw(createEmptyMagicStatEffectBundle());
    signatureMetadata = $state.raw<MagicSignatureMetadata>(createEmptySignatureMetadata());
    private topologySyncScheduled = false;
    private connectionValidationCache: ConnectionValidationCache | undefined;
    private clipboardFallback: string | undefined;
    private clipboardPasteCount = 0;

    readonly calculation: MagicCalculationResult = $derived(
        calculateMagic(this.nodes, this.edges, magicTypes, this.externalStatEffects)
    );
    readonly circles: CirclePath[] = $derived(this.calculation.circles);
    readonly circleStates: MagicCircleState[] = $derived(this.calculation.circleStates);
    readonly totalStats: MagicStats = $derived(this.calculation.totalStats);
    readonly totalStatAdjustments: MagicStats = $derived(this.calculation.totalStatAdjustments);
    readonly hasUserContent: boolean = $derived(hasUserMagicGraphContent(this.nodes));
    activeCircleId = $state<string | undefined>(
        getMagicCircleNodes(this.nodes)[0]?.id
    );
    sequenceDropPreview = $state<{
        circleId: string;
        y: number;
        beforeNodeId?: string;
        afterNodeId?: string;
    } | undefined>();

    setExternalStatEffects(statEffects: MagicStatEffectBundle): void {
        this.externalStatEffects = statEffects;
    }

    setSignatureMetadata(metadata: MagicSignatureMetadata): void {
        this.signatureMetadata = {
            name: metadata.name,
            description: metadata.description,
        };
    }

    addCircle(position: { x: number; y: number }): string {
        const update = addMagicCircle(this.nodes, position);
        this.nodes = update.nodes;
        this.activeCircleId = update.circleId;
        return update.circleId;
    }

    selectCircle(
        circleId: string | undefined,
        preserveUnitSelection = false
    ): void {
        this.activeCircleId = circleId;
        this.nodes = preserveUnitSelection
            ? activateCircleForUnitSelection(this.nodes)
            : selectOnlyCircle(this.nodes, circleId);
    }

    syncActiveCircleFromSelectedUnits(): void {
        this.selectCircle(
            resolveSelectedUnitCircleId(this.nodes),
            true
        );
    }

    applySelectionScope(scope: MagicGraphSelectionScope): void {
        this.nodes = normalizeMagicGraphSelection(this.nodes, scope);
        this.edges = this.edges.map(edge =>
            edge.selected ? { ...edge, selected: false } : edge
        );
        this.activeCircleId =
            resolveMagicGraphSelectionTargetCircleId(this.nodes);
    }

    syncSelectionForNode(nodeId: string): void {
        const node = this.nodes.find(candidate => candidate.id === nodeId);
        if (!node) return;

        this.applySelectionScope(
            isMagicCircleNode(node)
                ? { mode: MAGIC_GRAPH_SELECTION_MODES.CIRCLES }
                : {
                    mode: MAGIC_GRAPH_SELECTION_MODES.UNITS,
                    circleId: node.parentId ?? '',
                }
        );
    }

    copySelection(): string | false {
        const payload = createMagicGraphClipboardPayload(this.snapshot());
        if (!payload) return false;

        const serialized = serializeMagicGraphClipboardPayload(payload);
        this.clipboardFallback = serialized;
        this.clipboardPasteCount = 0;
        return serialized;
    }

    pasteSelection(serialized?: string): boolean {
        const clipboardText = serialized || this.clipboardFallback;
        if (!clipboardText) return false;

        const payload = parseMagicGraphClipboardPayload(clipboardText);
        if (!payload) return false;

        const isNewClipboardPayload =
            clipboardText !== this.clipboardFallback;
        const pasteCount = isNewClipboardPayload
            ? 1
            : this.clipboardPasteCount + 1;
        const update = pasteMagicGraphClipboardPayload(
            this.snapshot(),
            payload,
            magicTypeMap,
            pasteCount
        );
        if (!update) return false;

        this.nodes = update.nodes;
        this.edges = update.edges;
        this.activeCircleId = update.activeCircleId;
        this.clipboardFallback = clipboardText;
        this.clipboardPasteCount = pasteCount;
        this.syncTopology();
        return true;
    }

    addNode(
        magicType: MagicType,
        circleId: string | undefined = this.activeCircleId,
        insertionIndex?: number
    ): boolean {
        const update = addMagicNodeToCircle(
            this.nodes,
            magicType,
            circleId,
            insertionIndex
        );
        if (!update.added) return false;

        this.nodes = update.nodes;
        this.syncTopology();
        return true;
    }

    moveNodeGroup(
        origins: readonly MagicNodeSequenceOrigin[],
        targetCircleId: string | undefined,
        insertionIndex: number
    ): boolean {
        const update = moveMagicNodeGroup(
            this.snapshot(),
            origins,
            targetCircleId,
            insertionIndex
        );
        this.nodes = update.nodes;
        this.edges = update.edges;
        const originCircleIds = new Set(origins.map(origin => origin.circleId));
        this.selectCircle(
            update.moved
                ? targetCircleId
                : originCircleIds.size === 1
                    ? origins[0]?.circleId
                    : undefined,
            true
        );
        this.syncTopology();
        return update.moved;
    }

    resizeCircle(
        circleId: string,
        size: { width: number; height: number }
    ): void {
        this.nodes = resizeMagicCircleSequence(
            this.nodes,
            circleId,
            size
        );
    }

    updateCircleMetadata(
        circleId: string,
        metadata: MagicCircleMetadata
    ): void {
        this.nodes = updateMagicCircleMetadata(
            this.nodes,
            circleId,
            metadata
        );
    }

    setSequenceDropPreview(
        preview: {
            circleId: string;
            y: number;
            beforeNodeId?: string;
            afterNodeId?: string;
        } | undefined
    ): void {
        this.sequenceDropPreview = preview;
    }

    updateNodeSettings(nodeId: string, settings: MagicNodeSettings | undefined): void {
        this.nodes = updateMagicNodeSettings(this.nodes, nodeId, settings, magicTypeMap);
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
            () => isGraphConnectionValid(
                conn,
                this.snapshot(),
                magicTypeMap
            )
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

    onDelete(deletedNodes: MagicEditorNode[], deletedEdges: Edge[]): void {
        const next = removeDeletedGraphElements(this.snapshot(), deletedNodes, deletedEdges);
        this.nodes = normalizeMagicCircleSequences(next.nodes);
        this.edges = next.edges;
        this.sequenceDropPreview = undefined;
        if (
            this.activeCircleId &&
            !getMagicCircleNodes(this.nodes).some(circle =>
                circle.id === this.activeCircleId
            )
        ) {
            this.activeCircleId = undefined;
        }
        this.scheduleTopologySync();
    }

    deleteEditorNodeById(nodeId: string): boolean {
        const node = this.nodes.find(candidate => candidate.id === nodeId);
        if (!node || node.deletable === false) return false;

        this.onDelete([node], []);
        return true;
    }

    clear(): void {
        const initial = createInitialMagicCircleGraph();
        this.nodes = initial.nodes;
        this.edges = initial.edges;
        this.activeCircleId = getMagicCircleNodes(initial.nodes)[0]?.id;
        this.sequenceDropPreview = undefined;
        this.signatureMetadata = createEmptySignatureMetadata();
    }

    loadPreset(preset: MagicGraphPresetConfig): void {
        const next = createMagicGraphFromPreset(preset, magicTypeMap);
        const firstCircleId = getMagicCircleNodes(next.nodes)[0]?.id;

        this.nodes = selectOnlyCircle(next.nodes, firstCircleId);
        this.edges = next.edges;
        this.activeCircleId = firstCircleId;
        this.sequenceDropPreview = undefined;
        this.signatureMetadata = createEmptySignatureMetadata();
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

    private snapshot(): { nodes: MagicEditorNode[]; edges: Edge[] } {
        return {
            nodes: this.nodes,
            edges: this.edges,
        };
    }
}

export const graphStore = new GraphStore();

function createEmptySignatureMetadata(): MagicSignatureMetadata {
    return { ...EMPTY_MAGIC_SIGNATURE_METADATA };
}

function createConnectionValidationCacheKey(connection: Connection): string {
    return [
        connection.source ?? '',
        connection.target ?? '',
        connection.sourceHandle ?? '',
        connection.targetHandle ?? '',
    ].join(CONNECTION_VALIDATION_CACHE_KEY_SEPARATOR);
}
