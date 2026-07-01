import type { MagicGraphEdge } from '../magicGraphTypes';
import {
    GRAPH_EDGE_TYPES,
    GRAPH_NODE_TYPES,
    MAGIC_EDGE_ID_PREFIX,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import {
    CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS,
} from '../../../constants/circleSystemMagicNodeConfigs';
import {
    type MagicGraphPresetConfig,
    type MagicGraphPresetCircleConfig,
    type MagicGraphPresetEdgeConfig,
    type MagicGraphPresetNodeConfig,
} from './magicGraphPresetTypes';
import {
    type MagicCircleNode,
    type MagicEditorNode,
    type MagicNode,
} from '../magicGraphTypes';
import { createUniqueId } from '../model/graphActions';
import type { GraphSnapshot } from '../model/graphEventHandlers';
import { createUserMagicNodeData, normalizeMagicNodeSettings } from '../model/magicNodeData';
import { readMagicTypeConfigByType, type MagicTypeLookup } from '../model/magicTypeLookup';
import {
    attachNodeToCircle,
    createMagicCircleNodeFromGeometry,
    getCircleChildNodes,
    getMagicUnitNodes,
} from '../model/magicCircleGraph';
import { createMagicCircleGraphIndex } from '../model/magicCircleGraphIndex';
import { normalizeMagicCircleSequences } from '../model/magicCircleGraphActions';
import { isMagicGraphExternalCircleEdge } from '../model/magicGraphSnapshotRules';
import {
    createCircleSystemMagicNode,
    isCircleSystemMagicNode,
    normalizeCircleSystemNodeSlots,
    resolveCircleSystemNodeSlotsFromChildren,
    resolveRuntimeSequenceIndex,
    resolveSystemNodeRuntimeSequenceIndex,
} from '../model/circleSystemMagicNodes';

export const MAGIC_GRAPH_PRESET_SOURCES = {
    BUILT_IN: 'builtIn',
    USER: 'user',
} as const;

export type MagicGraphPresetSource =
    (typeof MAGIC_GRAPH_PRESET_SOURCES)[keyof typeof MAGIC_GRAPH_PRESET_SOURCES];

export interface MagicGraphPresetOption {
    value: string;
    label: string;
    source: MagicGraphPresetSource;
    preset: MagicGraphPresetConfig;
}

export type MagicGraphPresetIdFactory = () => string;

const USER_PRESET_ID_PREFIX = 'user-preset';
const PRESET_OPTION_VALUE_SEPARATOR = ':';
const USER_PRESET_DEFAULT_ID_SEGMENT = 'custom';
export function createMagicGraphPresetOptionValue(
    source: MagicGraphPresetSource,
    presetId: string
): string {
    return `${source}${PRESET_OPTION_VALUE_SEPARATOR}${presetId}`;
}

export function createMagicGraphPresetOption(
    preset: MagicGraphPresetConfig,
    source: MagicGraphPresetSource
): MagicGraphPresetOption {
    const currentPreset: MagicGraphPresetConfig = {
        id: preset.id,
        label: preset.label,
        circles: preset.circles,
        nodes: preset.nodes,
        edges: preset.edges,
    };

    return {
        value: createMagicGraphPresetOptionValue(source, preset.id),
        label: preset.label,
        source,
        preset: currentPreset,
    };
}

export function createMagicGraphFromPreset(
    preset: MagicGraphPresetConfig,
    magicTypes?: MagicTypeLookup
): GraphSnapshot {
    const circles = createCirclesFromPreset(preset.circles);
    const circleConfigById = new Map(
        preset.circles.map(circle => [circle.id, circle])
    );

    const nodes = normalizeMagicCircleSequences([
            ...circles,
            ...createCircleSequenceNodesFromPreset(
                preset.nodes,
                circles,
                circleConfigById,
                magicTypes
            ),
        ]);

    return {
        nodes,
        edges: preset.edges.map(createEdgeFromPreset),
    };
}

export function createMagicGraphPresetSnapshot(
    label: string,
    snapshot: GraphSnapshot,
    createId: MagicGraphPresetIdFactory = createUniqueId
): MagicGraphPresetConfig | false {
    const trimmedLabel = label.trim();
    const index = createMagicCircleGraphIndex(snapshot.nodes);
    const userNodes = index.unitNodes.filter(node =>
        !isCircleSystemMagicNode(node)
    );
    if (!trimmedLabel || userNodes.length === 0) return false;

    const circleIds = new Set(index.circles.map(circle => circle.id));

    return {
        id: `${USER_PRESET_ID_PREFIX}-${createId() || USER_PRESET_DEFAULT_ID_SEGMENT}`,
        label: trimmedLabel,
        circles: index.circles.map(circle =>
            createMagicGraphPresetCircleSnapshotFromChildren(
                circle,
                index.childrenByCircleId.get(circle.id) ?? []
            )
        ),
        nodes: index.circles.flatMap(circle =>
            createMagicGraphPresetNodeSnapshotsFromChildren(
                index.childrenByCircleId.get(circle.id) ?? []
            )
        ),
        edges: snapshot.edges
            .map(createMagicGraphPresetEdgeSnapshot)
            .filter(edge =>
                isMagicGraphExternalCircleEdge(edge, circleIds)
            ),
    };
}

export function hasUserMagicGraphContent(nodes: readonly MagicEditorNode[]): boolean {
    return getMagicUnitNodes(nodes).some(node =>
        !isCircleSystemMagicNode(node)
    );
}

function createUserNodeFromPreset(
    node: MagicGraphPresetNodeConfig,
    circle: MagicCircleNode,
    sequenceIndex: number,
    magicTypes?: MagicTypeLookup
): MagicNode {
    const config = magicTypes
        ? readMagicTypeConfigByType(node.magicType, magicTypes)
        : undefined;
    const settings = magicTypes
        ? normalizeMagicNodeSettings(config, node.settings)
        : node.settings;

    return attachNodeToCircle({
        id: node.id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position: { x: 0, y: 0 },
        data: {
            ...createUserMagicNodeData(node.magicType, settings),
            ...(node.controlPair
                ? {
                    controlPair: { ...node.controlPair },
                    ...(node.controlPair.role === MAGIC_CONTROL_PAIR_ROLES.END
                        ? { excludeFromStatScaling: true }
                        : {}),
                }
                : {}),
        },
    }, circle, sequenceIndex);
}

function createCirclesFromPreset(
    circles: readonly MagicGraphPresetCircleConfig[]
): MagicCircleNode[] {
    return circles.map(circle => createMagicCircleNodeFromGeometry(circle));
}

function createCircleSequenceNodesFromPreset(
    nodes: readonly MagicGraphPresetNodeConfig[],
    circles: readonly MagicCircleNode[],
    circleConfigById: ReadonlyMap<string, MagicGraphPresetCircleConfig>,
    magicTypes?: MagicTypeLookup
): MagicNode[] {
    const nodesByCircleId = new Map<
        string,
        MagicGraphPresetNodeConfig[]
    >();
    nodes.forEach(node => {
        const circleNodes = nodesByCircleId.get(node.circleId) ?? [];
        circleNodes.push(node);
        nodesByCircleId.set(node.circleId, circleNodes);
    });
    nodesByCircleId.forEach(circleNodes =>
        circleNodes.sort((left, right) =>
            left.sequenceIndex - right.sequenceIndex
        )
    );
    const systemConfigByType = new Map(
        CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS.map(config => [
            config.magicType,
            config,
        ])
    );

    return circles.flatMap(circle => {
        const circleNodes = nodesByCircleId.get(circle.id) ?? [];
        const circleConfig = circleConfigById.get(circle.id);
        if (!circleConfig) return [];

        const systemNodeSlots = normalizeCircleSystemNodeSlots(
            circleConfig.systemNodeSlots,
            circleNodes.length
        );
        const userNodes = circleNodes.map(node =>
            createUserNodeFromPreset(
                node,
                circle,
                resolveRuntimeSequenceIndex(
                    node.sequenceIndex,
                    systemNodeSlots
                ),
                magicTypes
            )
        );
        const systemNodes = systemNodeSlots.flatMap(slot => {
            const config = systemConfigByType.get(slot.magicType);
            if (!config) return [];

            return [createCircleSystemMagicNode(
                circle,
                config,
                resolveSystemNodeRuntimeSequenceIndex(
                    slot,
                    systemNodeSlots
                ),
                slot.settings
            )];
        });

        return [...userNodes, ...systemNodes];
    });
}

function createEdgeFromPreset(
    edge: MagicGraphPresetEdgeConfig
): MagicGraphEdge {
    return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: GRAPH_EDGE_TYPES.MAGIC_EDGE,
    };
}

export function createMagicGraphPresetCircleSnapshot(
    circle: MagicCircleNode,
    nodes: readonly MagicEditorNode[]
): MagicGraphPresetCircleConfig {
    return createMagicGraphPresetCircleSnapshotFromChildren(
        circle,
        getCircleChildNodes(nodes, circle.id)
    );
}

function createMagicGraphPresetCircleSnapshotFromChildren(
    circle: MagicCircleNode,
    children: readonly MagicNode[]
): MagicGraphPresetCircleConfig {
    return {
        id: circle.id,
        position: { ...circle.position },
        width: circle.width,
        height: circle.height,
        systemNodeSlots:
            resolveCircleSystemNodeSlotsFromChildren(children),
        ...(circle.data.name ? { name: circle.data.name } : {}),
        ...(circle.data.caption ? { caption: circle.data.caption } : {}),
    };
}

export function createMagicGraphPresetNodeSnapshots(
    nodes: readonly MagicEditorNode[],
    circle: MagicCircleNode
): MagicGraphPresetNodeConfig[] {
    return createMagicGraphPresetNodeSnapshotsFromChildren(
        getCircleChildNodes(nodes, circle.id)
    );
}

function createMagicGraphPresetNodeSnapshotsFromChildren(
    children: readonly MagicNode[]
): MagicGraphPresetNodeConfig[] {
    return children
        .filter(node => !isCircleSystemMagicNode(node))
        .map((node, sequenceIndex) =>
            createMagicGraphPresetNodeSnapshot(node, sequenceIndex)
        );
}

export function createMagicGraphPresetNodeSnapshot(
    node: MagicNode,
    sequenceIndex: number
): MagicGraphPresetNodeConfig {
    return {
        id: node.id,
        magicType: node.data.magicType,
        ...(node.data.settings ? { settings: { ...node.data.settings } } : {}),
        circleId: node.parentId!,
        sequenceIndex,
        ...(node.data.controlPair
            ? { controlPair: { ...node.data.controlPair } }
            : {}),
    };
}

export function createMagicGraphPresetEdgeSnapshot(
    edge: MagicGraphEdge
): MagicGraphPresetEdgeConfig {
    return {
        id: edge.id || `${MAGIC_EDGE_ID_PREFIX}-${createUniqueId()}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle!,
        targetHandle: edge.targetHandle!,
    };
}
