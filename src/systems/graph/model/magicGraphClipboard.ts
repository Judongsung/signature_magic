import {
    GRAPH_EDGE_TYPES,
    MAGIC_CIRCLE_ID_PREFIX,
    MAGIC_CONTROL_PAIR_CONFIG,
    MAGIC_CONTROL_PAIR_ROLES,
    MAGIC_EDGE_ID_PREFIX,
    MAGIC_NODE_ID_PREFIX,
} from '../../../constants/graphConfigs';
import {
    type MagicEditorNode,
    type MagicNode,
} from '../magicGraphTypes';
import {
    type MagicGraphPresetCircleConfig,
    type MagicGraphPresetConfig,
    type MagicGraphPresetEdgeConfig,
    type MagicGraphPresetNodeConfig,
} from '../presets/magicGraphPresetTypes';
import type { MagicGraphEdge } from '../magicGraphTypes';
import {
    createMagicGraphPresetCircleSnapshot,
    createMagicGraphPresetEdgeSnapshot,
    createMagicGraphPresetNodeSnapshot,
    createMagicGraphPresetNodeSnapshots,
    createMagicGraphFromPreset,
} from '../presets/magicGraphPresets';
import {
    resolveUppermostSelectedCircle,
} from '../editor/magicGraphSelection';
import { createNode } from './graphActions';
import { createMagicGraphIdSegment } from './magicGraphIds';
import { isCircleSystemMagicNode } from './circleSystemMagicNodes';
import {
    getCircleEditableSequenceNodes,
} from './circleSystemMagicNodes';
import {
    getMagicCircleNodes,
    getMagicUnitNodes,
    isMagicTypeAllowedInCircleSequence,
    orderMagicEditorNodes,
    readMagicCircleSequenceIndex,
} from './magicCircleGraph';
import {
    insertMagicNodesIntoCircle,
    normalizeMagicCircleSequences,
} from './magicCircleGraphActions';
import {
    expandMagicControlPairNodeIds,
    isMagicControlPairGraphValid,
} from './magicControlPairs';
import {
    createUserMagicNodeData,
    normalizeMagicNodeSettings,
} from './magicNodeData';
import {
    readMagicTypeConfigByType,
    type MagicTypeLookup,
} from './magicTypeLookup';
import {
    findNonContiguousMagicGraphSequenceCircleIds,
    hasValidMagicGraphConnectionJoinSlots,
    hasValidMagicGraphControlPairs,
    hasValidMagicGraphSystemNodeSlots,
    isMagicGraphExternalCircleEdge,
} from './magicGraphSnapshotRules';

export const MAGIC_GRAPH_CLIPBOARD_MIME_TYPE =
    'application/x-beautiful-galileo-magic-graph+json';

export const MAGIC_GRAPH_CLIPBOARD_CONFIG = {
    KIND: 'beautiful-galileo.magic-graph-selection',
    VERSION: 1,
    PASTE_OFFSET_PX: 40,
} as const;

export const MAGIC_GRAPH_CLIPBOARD_MODES = {
    CIRCLES: 'circles',
    UNITS: 'units',
} as const;

export type MagicGraphClipboardMode =
    (typeof MAGIC_GRAPH_CLIPBOARD_MODES)[keyof typeof MAGIC_GRAPH_CLIPBOARD_MODES];

export interface MagicGraphClipboardPayload {
    kind: typeof MAGIC_GRAPH_CLIPBOARD_CONFIG.KIND;
    version: typeof MAGIC_GRAPH_CLIPBOARD_CONFIG.VERSION;
    mode: MagicGraphClipboardMode;
    circles: MagicGraphPresetCircleConfig[];
    nodes: MagicGraphPresetNodeConfig[];
    edges: MagicGraphPresetEdgeConfig[];
}

export interface MagicGraphClipboardSnapshot {
    nodes: MagicEditorNode[];
    edges: MagicGraphEdge[];
    selectedNodeIds: ReadonlySet<string>;
}

export interface MagicGraphClipboardPasteResult
    extends Omit<MagicGraphClipboardSnapshot, 'selectedNodeIds'> {
    activeCircleId: string;
    selectedNodeIds: string[];
}

export type MagicGraphClipboardIdFactory = () => string;

export function createMagicGraphClipboardPayload(
    snapshot: MagicGraphClipboardSnapshot
): MagicGraphClipboardPayload | false {
    const selectedCircles = getMagicCircleNodes(snapshot.nodes)
        .filter(circle => snapshot.selectedNodeIds.has(circle.id));
    if (selectedCircles.length > 0) {
        return createCircleClipboardPayload(snapshot, selectedCircles);
    }

    return createUnitClipboardPayload(
        snapshot.nodes,
        snapshot.selectedNodeIds
    );
}

function createCircleClipboardPayload(
    snapshot: MagicGraphClipboardSnapshot,
    selectedCircles: MagicGraphPresetSourceCircle[]
): MagicGraphClipboardPayload {
    const selectedCircleIds = new Set(
        selectedCircles.map(circle => circle.id)
    );

    return {
        kind: MAGIC_GRAPH_CLIPBOARD_CONFIG.KIND,
        version: MAGIC_GRAPH_CLIPBOARD_CONFIG.VERSION,
        mode: MAGIC_GRAPH_CLIPBOARD_MODES.CIRCLES,
        circles: selectedCircles.map(circle =>
            createMagicGraphPresetCircleSnapshot(circle, snapshot.nodes)
        ),
        nodes: selectedCircles.flatMap(circle =>
            createMagicGraphPresetNodeSnapshots(snapshot.nodes, circle)
        ),
        edges: snapshot.edges
            .filter(edge =>
                selectedCircleIds.has(edge.source) &&
                selectedCircleIds.has(edge.target)
            )
            .map(edge => createMagicGraphPresetEdgeSnapshot(
                edge,
                snapshot.nodes
            )),
    };
}

type MagicGraphPresetSourceCircle =
    ReturnType<typeof getMagicCircleNodes>[number];

function createUnitClipboardPayload(
    nodes: readonly MagicEditorNode[],
    selectedNodeIds: ReadonlySet<string>
): MagicGraphClipboardPayload | false {
    const selectedUnits = getMagicUnitNodes(nodes)
        .filter(node =>
            selectedNodeIds.has(node.id) &&
            node.parentId &&
            !isCircleSystemMagicNode(node)
        );
    const sourceCircleIds = new Set(
        selectedUnits.map(node => node.parentId!)
    );
    if (selectedUnits.length === 0 || sourceCircleIds.size !== 1) {
        return false;
    }

    const expandedIds = expandMagicControlPairNodeIds(
        nodes,
        new Set(selectedUnits.map(node => node.id))
    );
    const sourceCircleId = selectedUnits[0].parentId!;
    const copiedUnits = getCircleEditableSequenceNodes(
        nodes,
        sourceCircleId
    ).filter(node => expandedIds.has(node.id));

    return {
        kind: MAGIC_GRAPH_CLIPBOARD_CONFIG.KIND,
        version: MAGIC_GRAPH_CLIPBOARD_CONFIG.VERSION,
        mode: MAGIC_GRAPH_CLIPBOARD_MODES.UNITS,
        circles: [],
        nodes: copiedUnits.map((node, sequenceIndex) =>
            createMagicGraphPresetNodeSnapshot(node, sequenceIndex)
        ),
        edges: [],
    };
}

export function serializeMagicGraphClipboardPayload(
    payload: MagicGraphClipboardPayload
): string {
    return JSON.stringify(payload);
}

export function parseMagicGraphClipboardPayload(
    serialized: string
): MagicGraphClipboardPayload | false {
    try {
        const value: unknown = JSON.parse(serialized);
        return isMagicGraphClipboardPayload(value)
            ? value
            : false;
    } catch {
        return false;
    }
}

export function pasteMagicGraphClipboardPayload(
    snapshot: MagicGraphClipboardSnapshot,
    payload: MagicGraphClipboardPayload,
    magicTypes: MagicTypeLookup,
    pasteCount: number,
    createId: MagicGraphClipboardIdFactory = createMagicGraphIdSegment
): MagicGraphClipboardPasteResult | false {
    if (!isSupportedClipboardPayload(payload, magicTypes)) return false;

    return payload.mode === MAGIC_GRAPH_CLIPBOARD_MODES.CIRCLES
        ? pasteCircleClipboardPayload(
            snapshot,
            payload,
            magicTypes,
            pasteCount,
            createId
        )
        : pasteUnitClipboardPayload(
            snapshot,
            payload,
            magicTypes,
            createId
        );
}

function pasteCircleClipboardPayload(
    snapshot: MagicGraphClipboardSnapshot,
    payload: MagicGraphClipboardPayload,
    magicTypes: MagicTypeLookup,
    pasteCount: number,
    createId: MagicGraphClipboardIdFactory
): MagicGraphClipboardPasteResult | false {
    const circleIdMap = new Map(payload.circles.map(circle => [
        circle.id,
        `${MAGIC_CIRCLE_ID_PREFIX}-${createId()}`,
    ]));
    const nodeIdMap = new Map(payload.nodes.map(node => [
        node.id,
        `${MAGIC_NODE_ID_PREFIX}-${createId()}`,
    ]));
    const pairIdMap = createControlPairIdMap(payload.nodes, createId);
    const offset =
        Math.max(1, pasteCount) *
        MAGIC_GRAPH_CLIPBOARD_CONFIG.PASTE_OFFSET_PX;
    const preset: MagicGraphPresetConfig = {
        id: `clipboard-${createId()}`,
        label: 'Clipboard',
        circles: payload.circles.map(circle => ({
            ...circle,
            id: circleIdMap.get(circle.id)!,
            position: {
                x: circle.position.x + offset,
                y: circle.position.y + offset,
            },
            systemNodeSlots: circle.systemNodeSlots.map(slot => ({
                ...slot,
                ...(slot.settings
                    ? { settings: { ...slot.settings } }
                    : {}),
            })),
        })),
        nodes: payload.nodes.map(node => ({
            ...node,
            id: nodeIdMap.get(node.id)!,
            circleId: circleIdMap.get(node.circleId)!,
            ...(node.settings
                ? { settings: { ...node.settings } }
                : {}),
            ...(node.controlPair
                ? {
                    controlPair: {
                        ...node.controlPair,
                        id: pairIdMap.get(node.controlPair.id)!,
                    },
                }
                : {}),
        })),
        edges: payload.edges.map(edge => ({
            ...edge,
            id: `${MAGIC_EDGE_ID_PREFIX}-${createId()}`,
            source: circleIdMap.get(edge.source)!,
            target: circleIdMap.get(edge.target)!,
        })),
    };
    const pasted = createMagicGraphFromPreset(preset, magicTypes);
    if (!isMagicControlPairGraphValid(pasted.nodes)) return false;

    const pastedCircleIds = new Set(circleIdMap.values());
    const nodes = normalizeMagicCircleSequences(orderMagicEditorNodes([
        ...snapshot.nodes,
        ...pasted.nodes,
    ]));
    const selectedNodeIds = [...pastedCircleIds];

    return {
        nodes,
        edges: [
            ...snapshot.edges,
            ...pasted.edges.map(edge => ({
                ...edge,
                type: GRAPH_EDGE_TYPES.MAGIC_EDGE,
            })),
        ],
        activeCircleId: resolveUppermostSelectedCircle(
            getMagicCircleNodes(nodes),
            new Set(selectedNodeIds)
        )!.id,
        selectedNodeIds,
    };
}

function pasteUnitClipboardPayload(
    snapshot: MagicGraphClipboardSnapshot,
    payload: MagicGraphClipboardPayload,
    magicTypes: MagicTypeLookup,
    createId: MagicGraphClipboardIdFactory
): MagicGraphClipboardPasteResult | false {
    const target = resolveUnitPasteTarget(
        snapshot.nodes,
        snapshot.selectedNodeIds
    );
    if (!target) return false;

    const pairIdMap = createControlPairIdMap(payload.nodes, createId);
    const insertedNodes = [...payload.nodes]
        .sort((left, right) => left.sequenceIndex - right.sequenceIndex)
        .map(node => createPastedUnitNode(
            node,
            pairIdMap,
            magicTypes,
            createId
        ));
    const update = insertMagicNodesIntoCircle(
        snapshot.nodes,
        insertedNodes,
        target.circleId,
        target.insertionIndex
    );
    if (!update.added) return false;

    return {
        nodes: update.nodes,
        edges: snapshot.edges,
        activeCircleId: target.circleId,
        selectedNodeIds: insertedNodes.map(node => node.id),
    };
}

function createPastedUnitNode(
    node: MagicGraphPresetNodeConfig,
    pairIdMap: ReadonlyMap<string, string>,
    magicTypes: MagicTypeLookup,
    createId: MagicGraphClipboardIdFactory
): MagicNode {
    const config = readMagicTypeConfigByType(node.magicType, magicTypes);
    const settings = normalizeMagicNodeSettings(config, node.settings);
    const created = createNode(node.magicType, { x: 0, y: 0 }, createId);

    return {
        ...created,
        data: {
            ...createUserMagicNodeData(node.magicType, settings),
            ...(node.controlPair
                ? {
                    controlPair: {
                        ...node.controlPair,
                        id: pairIdMap.get(node.controlPair.id)!,
                    },
                    ...(node.controlPair.role ===
                        MAGIC_CONTROL_PAIR_ROLES.END
                        ? { excludeFromStatScaling: true }
                        : {}),
                }
                : {}),
        },
    };
}

function resolveUnitPasteTarget(
    nodes: readonly MagicEditorNode[],
    selectedNodeIds: ReadonlySet<string>
): {
    circleId: string;
    insertionIndex?: number;
} | undefined {
    const selectedUnits = getMagicUnitNodes(nodes).filter(node =>
        selectedNodeIds.has(node.id) &&
        node.parentId &&
        !isCircleSystemMagicNode(node)
    );
    if (selectedUnits.length > 0) {
        const parentIds = new Set(
            selectedUnits.map(node => node.parentId!)
        );
        if (parentIds.size !== 1) return undefined;

        return {
            circleId: selectedUnits[0].parentId!,
            insertionIndex: Math.max(
                ...selectedUnits.map(readMagicCircleSequenceIndex)
            ) + 1,
        };
    }

    const circle = resolveUppermostSelectedCircle(
        getMagicCircleNodes(nodes),
        selectedNodeIds
    );
    return circle ? { circleId: circle.id } : undefined;
}

function isSupportedClipboardPayload(
    payload: MagicGraphClipboardPayload,
    magicTypes: MagicTypeLookup
): boolean {
    return payload.nodes.every(node =>
        Boolean(readMagicTypeConfigByType(node.magicType, magicTypes)) &&
        isMagicTypeAllowedInCircleSequence(node.magicType)
    );
}

function createControlPairIdMap(
    nodes: readonly MagicGraphPresetNodeConfig[],
    createId: MagicGraphClipboardIdFactory
): Map<string, string> {
    return new Map(
        [...new Set(nodes.flatMap(node =>
            node.controlPair ? [node.controlPair.id] : []
        ))].map(pairId => [
            pairId,
            `${MAGIC_CONTROL_PAIR_CONFIG.ID_PREFIX}-${createId()}`,
        ])
    );
}

function isMagicGraphClipboardPayload(
    value: unknown
): value is MagicGraphClipboardPayload {
    if (!isRecord(value)) return false;
    if (
        value.kind !== MAGIC_GRAPH_CLIPBOARD_CONFIG.KIND ||
        value.version !== MAGIC_GRAPH_CLIPBOARD_CONFIG.VERSION ||
        (
            value.mode !== MAGIC_GRAPH_CLIPBOARD_MODES.CIRCLES &&
            value.mode !== MAGIC_GRAPH_CLIPBOARD_MODES.UNITS
        ) ||
        !Array.isArray(value.circles) ||
        !Array.isArray(value.nodes) ||
        !Array.isArray(value.edges)
    ) {
        return false;
    }
    if (
        !value.circles.every(isClipboardCircle) ||
        !value.nodes.every(isClipboardNode) ||
        !value.edges.every(isClipboardEdge)
    ) {
        return false;
    }

    const payload = value as unknown as MagicGraphClipboardPayload;
    const circleIds = new Set(payload.circles.map(circle => circle.id));
    const nodeIds = new Set(payload.nodes.map(node => node.id));
    if (
        circleIds.size !== payload.circles.length ||
        nodeIds.size !== payload.nodes.length ||
        payload.nodes.some(node => circleIds.has(node.id)) ||
        !hasValidMagicGraphControlPairs(payload.nodes)
    ) {
        return false;
    }

    if (payload.mode === MAGIC_GRAPH_CLIPBOARD_MODES.UNITS) {
        const sourceCircleIds = [...new Set(
            payload.nodes.map(node => node.circleId)
        )];
        return payload.circles.length === 0 &&
            payload.edges.length === 0 &&
            payload.nodes.length > 0 &&
            sourceCircleIds.length === 1 &&
            findNonContiguousMagicGraphSequenceCircleIds(
                payload.nodes,
                sourceCircleIds
            ).length === 0;
    }

    return payload.circles.length > 0 &&
        payload.nodes.every(node => circleIds.has(node.circleId)) &&
        findNonContiguousMagicGraphSequenceCircleIds(
            payload.nodes,
            [...circleIds]
        ).length === 0 &&
        payload.circles.every(circle =>
            hasValidMagicGraphSystemNodeSlots(
                circle.systemNodeSlots,
                payload.nodes.filter(node =>
                    node.circleId === circle.id
                ).length
            )
        ) &&
        payload.edges.every(edge =>
            isMagicGraphExternalCircleEdge(edge, circleIds)
        ) &&
        hasValidMagicGraphConnectionJoinSlots(
            payload.edges,
            payload.nodes
        );
}

function isClipboardCircle(
    value: unknown
): value is MagicGraphPresetCircleConfig {
    return isRecord(value) &&
        typeof value.id === 'string' &&
        isRecord(value.position) &&
        Number.isFinite(value.position.x) &&
        Number.isFinite(value.position.y) &&
        Number.isFinite(value.width) &&
        Number(value.width) > 0 &&
        Number.isFinite(value.height) &&
        Number(value.height) > 0 &&
        (value.name === undefined || typeof value.name === 'string') &&
        (value.caption === undefined || typeof value.caption === 'string') &&
        Array.isArray(value.systemNodeSlots) &&
        value.systemNodeSlots.every(slot =>
            isRecord(slot) &&
            typeof slot.magicType === 'string' &&
            Number.isInteger(slot.slotIndex) &&
            Number(slot.slotIndex) >= 0 &&
            isOptionalStringRecord(slot.settings)
        );
}

function isClipboardNode(
    value: unknown
): value is MagicGraphPresetNodeConfig {
    return isRecord(value) &&
        typeof value.id === 'string' &&
        typeof value.magicType === 'string' &&
        typeof value.circleId === 'string' &&
        Number.isInteger(value.sequenceIndex) &&
        Number(value.sequenceIndex) >= 0 &&
        isOptionalStringRecord(value.settings) &&
        (
            value.controlPair === undefined ||
            (
                isRecord(value.controlPair) &&
                typeof value.controlPair.id === 'string' &&
                (
                    value.controlPair.role ===
                        MAGIC_CONTROL_PAIR_ROLES.START ||
                    value.controlPair.role ===
                        MAGIC_CONTROL_PAIR_ROLES.END
                )
            )
        );
}

function isClipboardEdge(
    value: unknown
): value is MagicGraphPresetEdgeConfig {
    return isRecord(value) &&
        typeof value.id === 'string' &&
        typeof value.source === 'string' &&
        typeof value.target === 'string' &&
        typeof value.sourceHandle === 'string' &&
        typeof value.targetHandle === 'string' &&
        (
            value.joinSlotIndex === undefined ||
            (
                Number.isInteger(value.joinSlotIndex) &&
                Number(value.joinSlotIndex) >= 0
            )
        );
}

function isOptionalStringRecord(value: unknown): boolean {
    return value === undefined ||
        (
            isRecord(value) &&
            Object.values(value).every(item => typeof item === 'string')
        );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) &&
        typeof value === 'object' &&
        !Array.isArray(value);
}
