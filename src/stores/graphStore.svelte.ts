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
    getMagicCircleNodes,
    isMagicCircleNode,
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
    activateCircleForUnitSelection,
    normalizeMagicGraphSelection,
    resolveSelectedUnitCircleId,
    resolveMagicGraphSelectionTargetCircleId,
    selectOnlyCircle,
    type MagicGraphSelectionScope,
} from '../systems/graph/editor/magicGraphSelection';
import type {
    MagicNodeSequenceDrop,
} from '../systems/graph/editor/magicCircleEditorInteraction';
import {
    acceptMagicGraphFlowEdges,
    acceptMagicGraphFlowNodes,
    projectMagicGraphFlowEdges,
    projectMagicGraphFlowNodes,
    promoteMagicCircleFlowPositions,
    readSelectedMagicGraphNodeIds,
    selectMagicGraphFlowNodes,
} from '../systems/graph/editor/magicGraphFlowState';
import {
    createMagicGraphClipboardPayload,
    parseMagicGraphClipboardPayload,
    pasteMagicGraphClipboardPayload,
    serializeMagicGraphClipboardPayload,
} from '../systems/graph/model/magicGraphClipboard';
import {
    createMagicGraphDocument,
    type MagicGraphDocument,
    type MagicGraphDocumentSource,
} from '../systems/graph/model/magicGraphDocument';
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
    nodes: MagicGraphDocument['nodes'];
    edges: MagicGraphDocument['edges'];
    key: string;
    result: boolean;
}

type MagicGraphCalculationSnapshot = MagicGraphDocument;

const initialGraph = createInitialMagicCircleGraph();
const initialDocument = createMagicGraphDocument(initialGraph);
const initialCircleId = getMagicCircleNodes(initialGraph.nodes)[0]?.id;
const initialFlowNodes = selectOnlyCircle(
    initialGraph.nodes,
    initialCircleId
);

class GraphStore {
    private graphDocument = $state.raw<MagicGraphDocument>(initialDocument);
    private flowNodes = $state.raw<MagicEditorNode[]>(
        projectMagicGraphFlowNodes(initialDocument.nodes, initialFlowNodes)
    );
    private flowEdges = $state.raw<Edge[]>(
        projectMagicGraphFlowEdges(initialDocument.edges, initialGraph.edges)
    );
    private selectedNodeIds = $state.raw<Set<string>>(
        readSelectedMagicGraphNodeIds(this.flowNodes)
    );
    externalStatEffects = $state.raw(createEmptyMagicStatEffectBundle());
    private calculationSnapshot: MagicGraphCalculationSnapshot = {
        nodes: initialDocument.nodes,
        edges: initialDocument.edges,
    };
    private calculationResult = $state.raw<MagicCalculationResult>(
        calculateMagic(
            this.calculationSnapshot.nodes,
            this.calculationSnapshot.edges,
            magicTypes,
            this.externalStatEffects
        )
    );
    signatureMetadata = $state.raw<MagicSignatureMetadata>(createEmptySignatureMetadata());
    private connectionValidationCache: ConnectionValidationCache | undefined;
    private clipboardFallback: string | undefined;
    private clipboardPasteCount = 0;

    get nodes(): MagicEditorNode[] {
        return this.flowNodes;
    }

    get edges(): Edge[] {
        return this.flowEdges;
    }

    get calculation(): MagicCalculationResult {
        return this.calculationResult;
    }

    readonly circles: CirclePath[] = $derived(this.calculationResult.circles);
    readonly circleStates: MagicCircleState[] = $derived(this.calculationResult.circleStates);
    readonly totalStats: MagicStats = $derived(this.calculationResult.totalStats);
    readonly totalStatAdjustments: MagicStats = $derived(this.calculationResult.totalStatAdjustments);
    readonly hasUserContent: boolean = $derived(
        hasUserMagicGraphContent(this.graphDocument.nodes)
    );
    activeCircleId = $state<string | undefined>(
        initialCircleId
    );
    sequenceDropPreview = $state<MagicNodeSequenceDrop | undefined>();

    acceptFlowNodes(nodes: MagicEditorNode[]): void {
        this.replaceFlowNodes(acceptMagicGraphFlowNodes(
            this.graphDocument.nodes,
            nodes
        ));
    }

    acceptFlowEdges(edges: Edge[]): void {
        this.replaceFlowEdges(acceptMagicGraphFlowEdges(
            this.graphDocument.edges,
            edges
        ));
    }

    setExternalStatEffects(statEffects: MagicStatEffectBundle): void {
        this.externalStatEffects = statEffects;
        this.recalculate();
    }

    setSignatureMetadata(metadata: MagicSignatureMetadata): void {
        this.signatureMetadata = {
            name: metadata.name,
            description: metadata.description,
        };
    }

    addCircle(position: { x: number; y: number }): string {
        const update = addMagicCircle(
            this.graphDocument.nodes,
            position
        );
        this.replaceDocumentNodes(update.nodes);
        this.replaceFlowNodes(selectOnlyCircle(
            this.flowNodes,
            update.circleId
        ));
        this.activeCircleId = update.circleId;
        this.commitCalculationSnapshot();
        return update.circleId;
    }

    selectCircle(
        circleId: string | undefined,
        preserveUnitSelection = false
    ): void {
        this.activeCircleId = circleId;
        this.replaceFlowNodes(preserveUnitSelection
            ? activateCircleForUnitSelection(this.nodes)
            : selectOnlyCircle(this.nodes, circleId));
    }

    syncActiveCircleFromSelectedUnits(): void {
        this.selectCircle(
            resolveSelectedUnitCircleId(this.nodes),
            true
        );
    }

    applySelectionScope(scope: MagicGraphSelectionScope): void {
        this.replaceFlowNodes(
            normalizeMagicGraphSelection(this.nodes, scope)
        );
        this.replaceFlowEdges(this.edges.map(edge =>
            edge.selected ? { ...edge, selected: false } : edge
        ));
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
        const payload = createMagicGraphClipboardPayload(
            this.clipboardSnapshot()
        );
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
            this.clipboardSnapshot(),
            payload,
            magicTypeMap,
            pasteCount
        );
        if (!update) return false;

        this.replaceDocument(
            update,
            {
                nodes: selectMagicGraphFlowNodes(
                    update.nodes,
                    new Set(update.selectedNodeIds)
                ),
                edges: update.edges,
            }
        );
        this.activeCircleId = update.activeCircleId;
        this.clipboardFallback = clipboardText;
        this.clipboardPasteCount = pasteCount;
        this.syncTopology();
        this.commitCalculationSnapshot();
        return true;
    }

    addNode(
        magicType: MagicType,
        circleId: string | undefined = this.activeCircleId,
        insertionIndex?: number
    ): boolean {
        const update = addMagicNodeToCircle(
            this.graphDocument.nodes,
            magicType,
            circleId,
            insertionIndex
        );
        if (!update.added) return false;

        this.replaceDocumentNodes(update.nodes);
        this.syncTopology();
        this.commitCalculationSnapshot();
        return true;
    }

    moveNodeGroup(
        origins: readonly MagicNodeSequenceOrigin[],
        targetCircleId: string | undefined,
        insertionIndex: number
    ): boolean {
        const update = moveMagicNodeGroup(
            this.documentSnapshot(),
            origins,
            targetCircleId,
            insertionIndex
        );
        this.replaceDocument(update);
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
        if (update.moved) {
            this.commitCalculationSnapshot();
        }
        return update.moved;
    }

    commitCircleLayoutChanges(): void {
        const commit = promoteMagicCircleFlowPositions(
            this.graphDocument.nodes,
            this.flowNodes
        );
        if (!commit.changed) return;

        this.replaceDocumentNodes(commit.nodes);
        this.commitCalculationSnapshot();
    }

    resizeCircle(
        circleId: string,
        size: { width: number; height: number }
    ): void {
        this.replaceDocumentNodes(resizeMagicCircleSequence(
            this.graphDocument.nodes,
            circleId,
            size
        ));
    }

    updateCircleMetadata(
        circleId: string,
        metadata: MagicCircleMetadata
    ): void {
        this.replaceDocumentNodes(updateMagicCircleMetadata(
            this.graphDocument.nodes,
            circleId,
            metadata
        ));
    }

    setSequenceDropPreview(
        preview: MagicNodeSequenceDrop | undefined
    ): void {
        this.sequenceDropPreview = preview;
    }

    updateNodeSettings(nodeId: string, settings: MagicNodeSettings | undefined): void {
        const updatedNodes = updateMagicNodeSettings(
            this.graphDocument.nodes,
            nodeId,
            settings,
            magicTypeMap
        );
        if (updatedNodes === this.graphDocument.nodes) return;

        this.replaceDocumentNodes(updatedNodes);
        this.commitCalculationSnapshot();
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
            this.connectionValidationCache?.nodes ===
                this.graphDocument.nodes &&
            this.connectionValidationCache.edges ===
                this.graphDocument.edges &&
            this.connectionValidationCache.key === cacheKey
        ) {
            return this.connectionValidationCache.result;
        }

        const result = measureGraphOperation(
            GRAPH_PERFORMANCE_OPERATION_IDS.CHECK_CONNECTION,
            {
                nodeCount: this.graphDocument.nodes.length,
                edgeCount: this.graphDocument.edges.length,
            },
            () => isGraphConnectionValid(
                conn,
                this.documentSnapshot()
            )
        );

        this.connectionValidationCache = {
            nodes: this.graphDocument.nodes,
            edges: this.graphDocument.edges,
            key: cacheKey,
            result,
        };
        return result;
    }

    prepareEdge(connection: Connection): Edge | false {
        const update = prepareGraphEdge(
            connection,
            this.documentSnapshot()
        );
        if (!update) return false;

        this.replaceDocumentEdges([
            ...update.edges,
            update.edge,
        ]);
        return update.edge;
    }

    onEdgeConnected(_connection: Connection): void {
        this.syncTopology();
        this.commitCalculationSnapshot();
    }

    onDelete(deletedNodes: MagicEditorNode[], deletedEdges: Edge[]): void {
        const next = removeDeletedGraphElements(
            this.documentSnapshot(),
            deletedNodes,
            deletedEdges
        );
        this.replaceDocument({
            nodes: normalizeMagicCircleSequences(next.nodes),
            edges: next.edges,
        });
        this.sequenceDropPreview = undefined;
        if (
            this.activeCircleId &&
            !getMagicCircleNodes(this.nodes).some(circle =>
                circle.id === this.activeCircleId
            )
        ) {
            this.activeCircleId = undefined;
        }
        this.syncTopology();
        this.commitCalculationSnapshot();
    }

    deleteEditorNodeById(nodeId: string): boolean {
        const node = this.graphDocument.nodes.find(candidate =>
            candidate.id === nodeId
        );
        if (!node || node.deletable === false) return false;

        this.onDelete([node as MagicEditorNode], []);
        return true;
    }

    clear(): void {
        const initial = createInitialMagicCircleGraph();
        const firstCircleId = getMagicCircleNodes(initial.nodes)[0]?.id;
        this.replaceDocument(initial, {
            nodes: selectOnlyCircle(initial.nodes, firstCircleId),
            edges: initial.edges,
        });
        this.activeCircleId = firstCircleId;
        this.sequenceDropPreview = undefined;
        this.signatureMetadata = createEmptySignatureMetadata();
        this.commitCalculationSnapshot();
    }

    loadPreset(preset: MagicGraphPresetConfig): void {
        const next = createMagicGraphFromPreset(preset, magicTypeMap);
        const firstCircleId = getMagicCircleNodes(next.nodes)[0]?.id;
        const selectedNodes = selectOnlyCircle(
            next.nodes,
            firstCircleId
        );

        this.replaceDocument(next, {
            nodes: selectedNodes,
            edges: next.edges,
        });
        this.activeCircleId = firstCircleId;
        this.sequenceDropPreview = undefined;
        this.signatureMetadata = createEmptySignatureMetadata();
        this.syncTopology();
        this.commitCalculationSnapshot();
    }

    createPresetSnapshot(label: string): MagicGraphPresetConfig | false {
        return createMagicGraphPresetSnapshot(
            label,
            this.documentSnapshot()
        );
    }

    private syncTopology(): void {
        const update = syncGraphTopology(this.documentSnapshot());
        if (!update.changed) return;

        this.replaceDocument(update);
    }

    private commitCalculationSnapshot(): void {
        this.calculationSnapshot = {
            nodes: this.graphDocument.nodes,
            edges: this.graphDocument.edges,
        };
        this.recalculate();
    }

    private recalculate(): void {
        this.calculationResult = calculateMagic(
            this.calculationSnapshot.nodes,
            this.calculationSnapshot.edges,
            magicTypes,
            this.externalStatEffects
        );
    }

    private documentSnapshot(): {
        nodes: MagicEditorNode[];
        edges: Edge[];
    } {
        return {
            nodes: this.graphDocument.nodes as MagicEditorNode[],
            edges: this.graphDocument.edges as Edge[],
        };
    }

    private clipboardSnapshot() {
        return {
            ...this.documentSnapshot(),
            selectedNodeIds: this.selectedNodeIds,
        };
    }

    private replaceDocument(
        source: MagicGraphDocumentSource,
        viewSource: {
            nodes: readonly MagicEditorNode[];
            edges: readonly Edge[];
        } = {
            nodes: this.flowNodes,
            edges: this.flowEdges,
        }
    ): void {
        const document = createMagicGraphDocument(source);
        this.graphDocument = document;
        this.replaceFlowNodes(projectMagicGraphFlowNodes(
            document.nodes,
            viewSource.nodes
        ));
        this.replaceFlowEdges(projectMagicGraphFlowEdges(
            document.edges,
            viewSource.edges
        ));
    }

    private replaceDocumentNodes(
        nodes: readonly MagicEditorNode[],
        viewNodes: readonly MagicEditorNode[] = this.flowNodes
    ): void {
        this.replaceDocument(
            {
                nodes,
                edges: this.graphDocument.edges as Edge[],
            },
            {
                nodes: viewNodes,
                edges: this.flowEdges,
            }
        );
    }

    private replaceDocumentEdges(
        edges: readonly Edge[]
    ): void {
        this.replaceDocument(
            {
                nodes: this.graphDocument.nodes as MagicEditorNode[],
                edges,
            }
        );
    }

    private replaceFlowNodes(nodes: MagicEditorNode[]): void {
        this.flowNodes = nodes;
        this.selectedNodeIds = readSelectedMagicGraphNodeIds(nodes);
    }

    private replaceFlowEdges(edges: Edge[]): void {
        this.flowEdges = edges;
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
