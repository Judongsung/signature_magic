import {
    MAGIC_CIRCLE_NODE_CONFIG,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import {
    MAGIC_CIRCLE_METADATA_CONFIG,
} from '../../../constants/nodeEditorConfigs';
import {
    CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS,
    INITIAL_SYSTEM_MAGIC_NODE_CONFIGS,
} from '../../../constants/systemMagicNodeConfigs';
import type {
    MagicGraphPresetCircleConfig,
    MagicGraphPresetConfig,
    MagicGraphPresetEdgeConfig,
    MagicGraphPresetNodeConfig,
    MagicGraphPresetSystemNodePositionConfig,
} from '../../../types/magic';
import {
    findNonContiguousMagicGraphSequenceCircleIds,
    hasValidMagicGraphControlPairs,
    hasValidMagicGraphSystemNodeSlots,
    isMagicGraphExternalCircleEdge,
    normalizeMagicGraphPresetSettings,
} from '../model/magicGraphSnapshotRules';
import {
    isMagicTypeAllowedInCircleSequence,
    resolveMagicCircleRequiredHeight,
} from '../model/magicCircleGraph';
import {
    readMagicTypeConfigByType,
    type MagicTypeLookup,
} from '../model/magicTypeLookup';

const SYSTEM_NODE_IDS = new Set(
    INITIAL_SYSTEM_MAGIC_NODE_CONFIGS.map(node => node.id)
);

export function decodeStoredMagicGraphPreset(
    value: unknown,
    magicTypes: MagicTypeLookup
): MagicGraphPresetConfig | false {
    if (!isStoredMagicGraphPresetShape(value, magicTypes)) return false;
    if (!hasValidStoredMagicGraphPreset(value)) return false;

    return normalizeMagicGraphPresetSettings(value, magicTypes);
}

function isStoredMagicGraphPresetShape(
    value: unknown,
    magicTypes: MagicTypeLookup
): value is MagicGraphPresetConfig {
    if (!isRecord(value)) return false;
    if (!isNonEmptyString(value.id) || !isNonEmptyString(value.label)) {
        return false;
    }
    if (
        !Array.isArray(value.circles) ||
        !Array.isArray(value.nodes) ||
        !Array.isArray(value.edges) ||
        (
            value.systemNodePositions !== undefined &&
            !Array.isArray(value.systemNodePositions)
        )
    ) {
        return false;
    }

    return value.circles.every(isStoredCircle) &&
        (value.systemNodePositions ?? []).every(isStoredSystemNodePosition) &&
        value.nodes.every(node => isStoredNode(node, magicTypes)) &&
        value.edges.every(isStoredEdge);
}

function hasValidStoredMagicGraphPreset(
    preset: MagicGraphPresetConfig
): boolean {
    const circleIds = new Set(preset.circles.map(circle => circle.id));
    const nodeIds = new Set(preset.nodes.map(node => node.id));
    const edgeIds = new Set(preset.edges.map(edge => edge.id));
    const systemPositionIds = new Set(
        (preset.systemNodePositions ?? []).map(position => position.id)
    );
    const graphIds = [
        ...circleIds,
        ...nodeIds,
    ];
    if (
        circleIds.size !== preset.circles.length ||
        nodeIds.size !== preset.nodes.length ||
        edgeIds.size !== preset.edges.length ||
        systemPositionIds.size !==
            (preset.systemNodePositions?.length ?? 0) ||
        new Set(graphIds).size !== graphIds.length
    ) {
        return false;
    }
    if (
        preset.circles.some(circle => SYSTEM_NODE_IDS.has(circle.id)) ||
        preset.nodes.some(node => SYSTEM_NODE_IDS.has(node.id)) ||
        (preset.systemNodePositions ?? []).some(position =>
            !SYSTEM_NODE_IDS.has(position.id)
        )
    ) {
        return false;
    }
    if (preset.nodes.some(node => !circleIds.has(node.circleId))) {
        return false;
    }
    if (
        findNonContiguousMagicGraphSequenceCircleIds(
            preset.nodes,
            [...circleIds]
        ).length > 0 ||
        !hasValidMagicGraphControlPairs(preset.nodes)
    ) {
        return false;
    }
    if (preset.circles.some(circle => {
        const editableNodeCount = preset.nodes.filter(node =>
            node.circleId === circle.id
        ).length;
        return circle.height < resolveMagicCircleRequiredHeight(
            editableNodeCount + CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS.length
        ) || !hasValidMagicGraphSystemNodeSlots(
            circle.systemNodeSlots,
            editableNodeCount
        );
    })) {
        return false;
    }

    return preset.edges.every(edge =>
        isMagicGraphExternalCircleEdge(edge, circleIds)
    );
}

function isStoredCircle(
    value: unknown
): value is MagicGraphPresetCircleConfig {
    if (!isRecord(value) || !isRecord(value.position)) return false;

    return isNonEmptyString(value.id) &&
        isFiniteNumber(value.position.x) &&
        isFiniteNumber(value.position.y) &&
        isFiniteNumber(value.width) &&
        value.width >= MAGIC_CIRCLE_NODE_CONFIG.MIN_SIZE.width &&
        isFiniteNumber(value.height) &&
        Array.isArray(value.systemNodeSlots) &&
        value.systemNodeSlots.every(isStoredSystemNodeSlot) &&
        isOptionalMetadata(
            value.name,
            MAGIC_CIRCLE_METADATA_CONFIG.NAME_MAX_LENGTH
        ) &&
        isOptionalMetadata(
            value.caption,
            MAGIC_CIRCLE_METADATA_CONFIG.CAPTION_MAX_LENGTH
        );
}

function isStoredSystemNodeSlot(value: unknown): boolean {
    return isRecord(value) &&
        isNonEmptyString(value.magicType) &&
        Number.isInteger(value.slotIndex) &&
        Number(value.slotIndex) >= 0 &&
        isOptionalStringRecord(value.settings);
}

function isStoredSystemNodePosition(
    value: unknown
): value is MagicGraphPresetSystemNodePositionConfig {
    return isRecord(value) &&
        isNonEmptyString(value.id) &&
        isRecord(value.position) &&
        isFiniteNumber(value.position.x) &&
        isFiniteNumber(value.position.y);
}

function isStoredNode(
    value: unknown,
    magicTypes: MagicTypeLookup
): value is MagicGraphPresetNodeConfig {
    return isRecord(value) &&
        isNonEmptyString(value.id) &&
        isNonEmptyString(value.magicType) &&
        Boolean(readMagicTypeConfigByType(value.magicType, magicTypes)) &&
        isMagicTypeAllowedInCircleSequence(value.magicType) &&
        isNonEmptyString(value.circleId) &&
        Number.isInteger(value.sequenceIndex) &&
        Number(value.sequenceIndex) >= 0 &&
        isOptionalStringRecord(value.settings) &&
        (
            value.controlPair === undefined ||
            (
                isRecord(value.controlPair) &&
                isNonEmptyString(value.controlPair.id) &&
                (
                    value.controlPair.role ===
                        MAGIC_CONTROL_PAIR_ROLES.START ||
                    value.controlPair.role ===
                        MAGIC_CONTROL_PAIR_ROLES.END
                )
            )
        );
}

function isStoredEdge(
    value: unknown
): value is MagicGraphPresetEdgeConfig {
    return isRecord(value) &&
        isNonEmptyString(value.id) &&
        isNonEmptyString(value.source) &&
        isNonEmptyString(value.target) &&
        isNonEmptyString(value.sourceHandle) &&
        isNonEmptyString(value.targetHandle);
}

function isOptionalStringRecord(value: unknown): boolean {
    return value === undefined ||
        (
            isRecord(value) &&
            Object.values(value).every(item => typeof item === 'string')
        );
}

function isOptionalMetadata(
    value: unknown,
    maxLength: number
): boolean {
    return value === undefined ||
        (
            isNonEmptyString(value) &&
            value.trim().length <= maxLength
        );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}
