import type { Edge } from '@xyflow/svelte';
import {
    GRAPH_EDGE_TYPES,
    GRAPH_NODE_TYPES,
    MAGIC_EDGE_ID_PREFIX,
    MAGIC_NODE_HANDLE_CONFIG,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import type {
    MagicGraphPresetConfig,
    MagicGraphPresetEdgeConfig,
    MagicGraphPresetNodeConfig,
    MagicGraphPresetSystemNodePositionConfig,
    MagicNode,
    MagicTypeConfig,
} from '../../../types/magic';
import { createUniqueId } from '../model/graphActions';
import { createInitialSystemNodes, isSystemMagicNode } from '../model/systemMagicNodes';
import type { GraphSnapshot } from '../model/graphEventHandlers';

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
    SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
    SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
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

export function createMagicGraphFromPreset(preset: MagicGraphPresetConfig): GraphSnapshot {
    return {
        nodes: [
            ...createSystemNodesFromPreset(preset.systemNodePositions),
            ...preset.nodes.map(createUserNodeFromPreset),
        ],
        edges: preset.edges.map(createEdgeFromPreset),
    };
}

export function createMagicGraphPresetSnapshot(
    label: string,
    snapshot: GraphSnapshot,
    createId: MagicGraphPresetIdFactory = createUniqueId
): MagicGraphPresetConfig | false {
    const trimmedLabel = label.trim();
    const userNodes = snapshot.nodes.filter(node => !isSystemMagicNode(node));
    const systemNodes = snapshot.nodes.filter(isSystemMagicNode);
    if (!trimmedLabel || userNodes.length === 0) return false;

    const allowedNodeIds = new Set([
        ...SYSTEM_NODE_IDS,
        ...userNodes.map(node => node.id),
    ]);

    return {
        id: `${USER_PRESET_ID_PREFIX}-${createId() || USER_PRESET_DEFAULT_ID_SEGMENT}`,
        label: trimmedLabel,
        systemNodePositions: systemNodes.map(createPresetSystemNodePositionFromGraph),
        nodes: userNodes.map(createPresetNodeFromGraph),
        edges: snapshot.edges
            .filter(edge => allowedNodeIds.has(edge.source) && allowedNodeIds.has(edge.target))
            .map(createPresetEdgeFromGraph),
    };
}

export function hasUserMagicGraphContent(nodes: readonly MagicNode[]): boolean {
    return nodes.some(node => !isSystemMagicNode(node));
}

export function getPresetAllowedNodeIds(preset: Pick<MagicGraphPresetConfig, 'nodes'>): Set<string> {
    return new Set([
        ...SYSTEM_NODE_IDS,
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

function createUserNodeFromPreset(node: MagicGraphPresetNodeConfig): MagicNode {
    return {
        id: node.id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position: { ...node.position },
        data: {
            magicType: node.magicType,
            nodeKind: MAGIC_NODE_KINDS.USER,
            isRoot: true,
            isLeaf: true,
            inputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
            outputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
        },
    };
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
        sourceHandle: edge.sourceHandle ?? MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
        targetHandle: edge.targetHandle ?? MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID,
        type: GRAPH_EDGE_TYPES.MAGIC_EDGE,
    };
}

function createPresetSystemNodePositionFromGraph(node: MagicNode): MagicGraphPresetSystemNodePositionConfig {
    return {
        id: node.id,
        position: { ...node.position },
    };
}

function createPresetNodeFromGraph(node: MagicNode): MagicGraphPresetNodeConfig {
    return {
        id: node.id,
        magicType: node.data.magicType,
        position: { ...node.position },
    };
}

function createPresetEdgeFromGraph(edge: Edge): MagicGraphPresetEdgeConfig {
    return {
        id: edge.id || `${MAGIC_EDGE_ID_PREFIX}-${createUniqueId()}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
        targetHandle: edge.targetHandle ?? MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID,
    };
}
