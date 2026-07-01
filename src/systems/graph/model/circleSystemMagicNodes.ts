import {
    GRAPH_NODE_TYPES,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import {
    CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS,
    CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS,
    type CircleSystemMagicNodeConfig,
} from '../../../constants/circleSystemMagicNodeConfigs';
import {
    type MagicCircleNode,
    type MagicCircleSystemNode,
    type MagicCircleSystemNodeData,
    type MagicEditorNode,
    type MagicNode,
    type MagicNodeData,
} from '../magicGraphTypes';
import {
    type MagicGraphPresetCircleSystemNodeSlotConfig,
} from '../presets/magicGraphPresetTypes';
import {
    type MagicNodeSettings,
    type MagicType,
} from '../../../types/magicTypeConfig';
import {
    attachNodeToCircle,
    getCircleChildNodes,
    isMagicCircleNode,
} from './magicCircleGraph';
import { normalizeMagicNodeSettings } from './magicNodeData';

const DEFAULT_CIRCLE_SYSTEM_NODE_CONFIGS =
    CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS;

export function isCircleSystemMagicType(
    magicType: MagicType,
    configs: readonly CircleSystemMagicNodeConfig[] =
        DEFAULT_CIRCLE_SYSTEM_NODE_CONFIGS
): boolean {
    return configs.some(config => config.magicType === magicType);
}

export function createCircleSystemMagicNodeId(
    circleId: string,
    config: Pick<CircleSystemMagicNodeConfig, 'idSuffix'>
): string {
    return `${circleId}-${config.idSuffix}`;
}

export function isCircleSystemMagicNode(
    node: MagicEditorNode,
    configs: readonly CircleSystemMagicNodeConfig[] =
        DEFAULT_CIRCLE_SYSTEM_NODE_CONFIGS
): node is MagicCircleSystemNode {
    return !isMagicCircleNode(node) &&
        isCircleSystemMagicNodeData(node.data, configs);
}

export function isCircleSystemMagicNodeData(
    data: MagicNodeData,
    configs: readonly CircleSystemMagicNodeConfig[] =
        DEFAULT_CIRCLE_SYSTEM_NODE_CONFIGS
): data is MagicCircleSystemNodeData {
    return data.nodeKind === MAGIC_NODE_KINDS.SYSTEM &&
        isCircleSystemMagicType(data.magicType, configs);
}

export function getCircleEditableSequenceNodes(
    nodes: readonly MagicEditorNode[],
    circleId: string
): MagicNode[] {
    return getCircleChildNodes(nodes, circleId)
        .filter(node => !isCircleSystemMagicNode(node));
}

export function resolveCircleSystemNodeSlots(
    nodes: readonly MagicEditorNode[],
    circleId: string,
    configs: readonly CircleSystemMagicNodeConfig[] =
        DEFAULT_CIRCLE_SYSTEM_NODE_CONFIGS
): MagicGraphPresetCircleSystemNodeSlotConfig[] {
    return resolveCircleSystemNodeSlotsFromChildren(
        getCircleChildNodes(nodes, circleId),
        configs
    );
}

export function resolveCircleSystemNodeSlotsFromChildren(
    children: readonly MagicNode[],
    configs: readonly CircleSystemMagicNodeConfig[] =
        DEFAULT_CIRCLE_SYSTEM_NODE_CONFIGS
): MagicGraphPresetCircleSystemNodeSlotConfig[] {
    const editableChildren = children.filter(node =>
        !isCircleSystemMagicNode(node, configs)
    );

    return configs.map(config => {
        const systemNodeIndex = children.findIndex(node =>
            isCircleSystemMagicNode(node, [config])
        );
        if (systemNodeIndex < 0) {
            return {
                magicType: config.magicType,
                slotIndex: editableChildren.length,
            };
        }

        return {
            magicType: config.magicType,
            slotIndex: children
                .slice(0, systemNodeIndex)
                .filter(node => !isCircleSystemMagicNode(node, configs))
                .length,
            ...(children[systemNodeIndex].data.settings
                ? {
                    settings: {
                        ...children[systemNodeIndex].data.settings,
                    },
                }
                : {}),
        };
    });
}

export function normalizeCircleSystemNodeChildren(
    circle: MagicCircleNode,
    orderedChildren: readonly MagicNode[],
    configs: readonly CircleSystemMagicNodeConfig[] =
        DEFAULT_CIRCLE_SYSTEM_NODE_CONFIGS
): MagicNode[] {
    const editableChildren = orderedChildren.filter(
        node => !isCircleSystemMagicNode(node, configs)
    );
    const slots = resolveSystemNodeSlotsFromChildren(
        orderedChildren,
        editableChildren.length,
        configs
    );
    const systemNodeByMagicType = new Map(
        configs.map(config => [
            config.magicType,
            normalizeCircleSystemMagicNode(
                orderedChildren.find(node =>
                    isCircleSystemMagicNode(node, [config])
                ),
                circle,
                config
            ),
        ])
    );

    return buildChildrenFromSlots(
        editableChildren,
        slots,
        systemNodeByMagicType
    );
}

export function createCircleSystemMagicNode(
    circle: MagicCircleNode,
    config: CircleSystemMagicNodeConfig,
    sequenceIndex: number,
    settings?: MagicNodeSettings
): MagicNode {
    return attachNodeToCircle(
        normalizeCircleSystemMagicNode(
            undefined,
            circle,
            config,
            settings
        ),
        circle,
        sequenceIndex
    );
}

export function normalizeCircleSystemNodeSlots(
    slots: readonly MagicGraphPresetCircleSystemNodeSlotConfig[],
    editableNodeCount: number,
    configs: readonly CircleSystemMagicNodeConfig[] =
        DEFAULT_CIRCLE_SYSTEM_NODE_CONFIGS
): MagicGraphPresetCircleSystemNodeSlotConfig[] {
    return configs.map(config => {
        const slot = slots.find(item => item.magicType === config.magicType);
        return {
            magicType: config.magicType,
            slotIndex: clampSlotIndex(slot?.slotIndex, editableNodeCount),
            ...(slot?.settings
                ? { settings: { ...slot.settings } }
                : {}),
        };
    });
}

export function resolveRuntimeSequenceIndex(
    sequenceIndex: number,
    systemNodeSlots: readonly MagicGraphPresetCircleSystemNodeSlotConfig[]
): number {
    return sequenceIndex +
        systemNodeSlots.filter(slot => slot.slotIndex <= sequenceIndex).length;
}

export function resolveSystemNodeRuntimeSequenceIndex(
    targetSlot: MagicGraphPresetCircleSystemNodeSlotConfig,
    systemNodeSlots: readonly MagicGraphPresetCircleSystemNodeSlotConfig[]
): number {
    const orderedSlots = orderSystemNodeSlots(systemNodeSlots);
    const slotOrderIndex = orderedSlots.findIndex(slot =>
        slot.magicType === targetSlot.magicType
    );

    return targetSlot.slotIndex + Math.max(0, slotOrderIndex);
}

function resolveSystemNodeSlotsFromChildren(
    orderedChildren: readonly MagicNode[],
    editableNodeCount: number,
    configs: readonly CircleSystemMagicNodeConfig[]
): MagicGraphPresetCircleSystemNodeSlotConfig[] {
    const editableBefore = (systemNodeIndex: number): number =>
        orderedChildren
            .slice(0, systemNodeIndex)
            .filter(node => !isCircleSystemMagicNode(node, configs))
            .length;

    return configs.map(config => {
        const systemNodeIndex = orderedChildren.findIndex(node =>
            isCircleSystemMagicNode(node, [config])
        );

        return {
            magicType: config.magicType,
            slotIndex: systemNodeIndex < 0
                ? editableNodeCount
                : editableBefore(systemNodeIndex),
        };
    });
}

function buildChildrenFromSlots(
    editableChildren: readonly MagicNode[],
    slots: readonly MagicGraphPresetCircleSystemNodeSlotConfig[],
    systemNodeByMagicType: ReadonlyMap<MagicType, MagicNode>
): MagicNode[] {
    const orderedSlots = orderSystemNodeSlots(slots);

    return Array.from(
        { length: editableChildren.length + 1 },
        (_, slotIndex) => [
            ...orderedSlots
                .filter(slot => slot.slotIndex === slotIndex)
                .flatMap(slot => {
                    const node = systemNodeByMagicType.get(slot.magicType);
                    return node ? [node] : [];
                }),
            ...(slotIndex < editableChildren.length
                ? [editableChildren[slotIndex]]
                : []),
        ]
    ).flat();
}

function normalizeCircleSystemMagicNode(
    existing: MagicNode | undefined,
    circle: MagicCircleNode,
    config: CircleSystemMagicNodeConfig,
    settings = existing?.data.settings
): MagicCircleSystemNode {
    const {
        settings: _settings,
        controlPair: _controlPair,
        ...existingData
    } = existing?.data ?? {
        magicType: config.magicType,
    };
    const typeConfig = CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS.find(candidate =>
        candidate.type === config.magicType
    );
    const normalizedSettings = normalizeMagicNodeSettings(
        typeConfig,
        settings
    );

    return {
        ...(existing ?? {
            position: { x: 0, y: 0 },
        }),
        id: createCircleSystemMagicNodeId(circle.id, config),
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        connectable: false,
        deletable: false,
        selectable: true,
        data: {
            ...existingData,
            magicType: config.magicType,
            nodeKind: MAGIC_NODE_KINDS.SYSTEM,
            showTooltip: true,
            excludeFromStatScaling: true,
            ...(normalizedSettings
                ? { settings: normalizedSettings }
                : {}),
        },
    };
}

function orderSystemNodeSlots(
    slots: readonly MagicGraphPresetCircleSystemNodeSlotConfig[]
): MagicGraphPresetCircleSystemNodeSlotConfig[] {
    return [...slots].sort((left, right) =>
        left.slotIndex - right.slotIndex
    );
}

function clampSlotIndex(
    slotIndex: number | undefined,
    editableNodeCount: number
): number {
    if (!Number.isInteger(slotIndex)) return editableNodeCount;
    return Math.max(0, Math.min(slotIndex as number, editableNodeCount));
}
