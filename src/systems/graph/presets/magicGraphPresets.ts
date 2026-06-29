import type { Edge } from '@xyflow/svelte';
import {
    GRAPH_EDGE_TYPES,
    GRAPH_NODE_TYPES,
    MAGIC_EDGE_ID_PREFIX,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import {
    CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS,
    INITIAL_SYSTEM_MAGIC_NODE_CONFIGS,
} from '../../../constants/systemMagicNodeConfigs';
import type {
    MagicGraphPresetConfig,
    MagicGraphPresetCircleConfig,
    MagicGraphPresetEdgeConfig,
    MagicGraphPresetNodeConfig,
    MagicGraphPresetSystemNodePositionConfig,
    MagicCircleNode,
    MagicEditorNode,
    MagicNode,
    MagicTypeConfig,
} from '../../../types/magic';
import { createUniqueId } from '../model/graphActions';
import { createInitialSystemNodes, isSystemMagicNode } from '../model/systemMagicNodes';
import type { GraphSnapshot } from '../model/graphEventHandlers';
import { createUserMagicNodeData, normalizeMagicNodeSettings } from '../model/magicNodeData';
import { readMagicTypeConfigByType, type MagicTypeLookup } from '../model/magicTypeLookup';
import {
    attachNodeToCircle,
    createMagicCircleNodeFromGeometry,
    getMagicCircleNodes,
    getMagicUnitNodes,
    isMagicTypeAllowedInCircleSequence,
    isMagicCircleNode,
} from '../model/magicCircleGraph';
import { isExplicitMagicCircleExternalConnection } from '../model/magicCircleConnectionRules';
import { normalizeMagicCircleSequences } from '../model/magicCircleGraphActions';
import {
    createCircleSystemMagicNode,
    getCircleEditableSequenceNodes,
    normalizeCircleSystemNodeSlots,
    resolveCircleSystemNodeSlots,
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
const SYSTEM_NODE_IDS = [
    ...INITIAL_SYSTEM_MAGIC_NODE_CONFIGS.map(node => node.id),
] as const;

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
    return {
        value: createMagicGraphPresetOptionValue(source, preset.id),
        label: preset.label,
        source,
        preset,
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
            ...createSystemNodesFromPreset(preset.systemNodePositions),
            ...circles,
            ...createUserNodesFromPreset(
                preset.nodes,
                circles,
                circleConfigById,
                magicTypes
            ),
            ...createCircleSystemNodesFromPreset(
                preset.nodes,
                circles,
                circleConfigById
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
    const circleNodes = getMagicCircleNodes(snapshot.nodes);
    const unitNodes = getMagicUnitNodes(snapshot.nodes);
    const userNodes = unitNodes.filter(node => !isSystemMagicNode(node));
    const systemNodes = unitNodes.filter(node =>
        isSystemMagicNode(node) && !node.parentId
    );
    if (!trimmedLabel || userNodes.length === 0) return false;

    const allowedNodeIds = new Set([
        ...SYSTEM_NODE_IDS,
        ...circleNodes.map(circle => circle.id),
        ...userNodes.map(node => node.id),
    ]);

    return {
        id: `${USER_PRESET_ID_PREFIX}-${createId() || USER_PRESET_DEFAULT_ID_SEGMENT}`,
        label: trimmedLabel,
        circles: circleNodes.map(circle =>
            createPresetCircleFromGraph(circle, snapshot.nodes)
        ),
        systemNodePositions: systemNodes.map(createPresetSystemNodePositionFromGraph),
        nodes: circleNodes.flatMap(circle =>
            createPresetNodesFromGraph(snapshot.nodes, circle)
        ),
        edges: snapshot.edges
            .filter(edge =>
                allowedNodeIds.has(edge.source) &&
                allowedNodeIds.has(edge.target) &&
                isExplicitMagicCircleExternalConnection(
                    {
                        source: edge.source,
                        target: edge.target,
                        sourceHandle: edge.sourceHandle ?? null,
                        targetHandle: edge.targetHandle ?? null,
                    },
                    snapshot.nodes
                )
            )
            .map(createPresetEdgeFromGraph),
    };
}

export function hasUserMagicGraphContent(nodes: readonly MagicEditorNode[]): boolean {
    return getMagicUnitNodes(nodes).some(node => !isSystemMagicNode(node));
}

export function getPresetAllowedNodeIds(
    preset: Pick<MagicGraphPresetConfig, 'circles' | 'nodes'>
): Set<string> {
    return new Set([
        ...SYSTEM_NODE_IDS,
        ...preset.circles.map(circle => circle.id),
        ...preset.nodes.map(node => node.id),
    ]);
}

export function collectMagicGraphPresetReferenceErrors(
    preset: MagicGraphPresetConfig,
    magicTypes: readonly MagicTypeConfig[]
): string[] {
    const errors: string[] = [];
    const magicTypeIds = new Set(magicTypes.map(magicType => magicType.type));
    const allowedNodeIds = getPresetAllowedNodeIds(preset);

    preset.nodes.forEach(node => {
        if (node.magicType && !magicTypeIds.has(node.magicType)) {
            errors.push(`Unknown magic graph preset node type: ${preset.id} -> ${node.id} -> ${node.magicType}`);
        }
        if (!isMagicTypeAllowedInCircleSequence(node.magicType)) {
            errors.push(`Disabled magic graph preset node type: ${preset.id} -> ${node.id} -> ${node.magicType}`);
        }
        if (!preset.circles.some(circle => circle.id === node.circleId)) {
            errors.push(`Unknown magic graph preset node circle: ${preset.id} -> ${node.id} -> ${node.circleId}`);
        }
    });

    preset.edges.forEach(edge => {
        if (!allowedNodeIds.has(edge.source)) {
            errors.push(`Unknown magic graph preset edge source: ${preset.id} -> ${edge.id} -> ${edge.source}`);
        }
        if (!allowedNodeIds.has(edge.target)) {
            errors.push(`Unknown magic graph preset edge target: ${preset.id} -> ${edge.id} -> ${edge.target}`);
        }
    });

    return errors;
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

function createUserNodesFromPreset(
    nodes: readonly MagicGraphPresetNodeConfig[],
    circles: readonly MagicCircleNode[],
    circleConfigById: ReadonlyMap<string, MagicGraphPresetCircleConfig>,
    magicTypes?: MagicTypeLookup
): MagicNode[] {
    const circleById = new Map(
        circles.map(circle => [circle.id, circle])
    );

    return nodes.flatMap(node => {
        const circle = circleById.get(node.circleId);
        const circleConfig = circleConfigById.get(node.circleId);
        if (!circle || !circleConfig) return [];

        const editableNodeCount = nodes.filter(candidate =>
            candidate.circleId === node.circleId
        ).length;
        const systemNodeSlots = normalizeCircleSystemNodeSlots(
            circleConfig.systemNodeSlots,
            editableNodeCount
        );
        const runtimeSequenceIndex = resolveRuntimeSequenceIndex(
            node.sequenceIndex,
            systemNodeSlots
        );

        return [
            createUserNodeFromPreset(
                node,
                circle,
                runtimeSequenceIndex,
                magicTypes
            ),
        ];
    });
}

function createCircleSystemNodesFromPreset(
    nodes: readonly MagicGraphPresetNodeConfig[],
    circles: readonly MagicCircleNode[],
    circleConfigById: ReadonlyMap<string, MagicGraphPresetCircleConfig>
): MagicNode[] {
    const configByType = new Map(
        CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS.map(config => [
            config.magicType,
            config,
        ])
    );

    return circles.flatMap(circle => {
        const editableNodeCount = nodes.filter(node =>
            node.circleId === circle.id
        ).length;
        const systemNodeSlots = normalizeCircleSystemNodeSlots(
            circleConfigById.get(circle.id)?.systemNodeSlots ?? [],
            editableNodeCount
        );

        return systemNodeSlots.flatMap(slot => {
            const config = configByType.get(slot.magicType);
            if (!config) return [];

            return [createCircleSystemMagicNode(
                circle,
                config,
                resolveSystemNodeRuntimeSequenceIndex(
                    slot,
                    systemNodeSlots
                )
            )];
        });
    });
}

function createSystemNodesFromPreset(
    systemNodePositions: MagicGraphPresetSystemNodePositionConfig[] = []
): MagicNode[] {
    const positionById = new Map(systemNodePositions.map(item => [item.id, item.position]));

    return createInitialSystemNodes().map(node => ({
        ...node,
        position: { ...(positionById.get(node.id) ?? node.position) },
        data: { ...node.data },
    }));
}

function createEdgeFromPreset(edge: MagicGraphPresetEdgeConfig): Edge {
    return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: GRAPH_EDGE_TYPES.MAGIC_EDGE,
    };
}

function createPresetSystemNodePositionFromGraph(node: MagicNode): MagicGraphPresetSystemNodePositionConfig {
    return {
        id: node.id,
        position: { ...node.position },
    };
}

function createPresetCircleFromGraph(
    circle: MagicCircleNode,
    nodes: readonly MagicEditorNode[]
): MagicGraphPresetCircleConfig {
    return {
        id: circle.id,
        position: { ...circle.position },
        width: circle.width,
        height: circle.height,
        systemNodeSlots: resolveCircleSystemNodeSlots(
            nodes,
            circle.id
        ),
        ...(circle.data.name ? { name: circle.data.name } : {}),
        ...(circle.data.caption ? { caption: circle.data.caption } : {}),
    };
}

function createPresetNodesFromGraph(
    nodes: readonly MagicEditorNode[],
    circle: MagicCircleNode
): MagicGraphPresetNodeConfig[] {
    return getCircleEditableSequenceNodes(nodes, circle.id)
        .map((node, sequenceIndex) =>
            createPresetNodeFromGraph(node, sequenceIndex)
        );
}

function createPresetNodeFromGraph(
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

function createPresetEdgeFromGraph(edge: Edge): MagicGraphPresetEdgeConfig {
    return {
        id: edge.id || `${MAGIC_EDGE_ID_PREFIX}-${createUniqueId()}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle!,
        targetHandle: edge.targetHandle!,
    };
}
