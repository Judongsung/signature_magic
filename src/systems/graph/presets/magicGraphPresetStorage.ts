import type { MagicGraphPresetConfig } from '../../../types/magic';
import { CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import {
    isMagicCirclePortHandleId,
    isMagicTypeAllowedInCircleSequence,
} from '../model/magicCircleGraph';
import {
    MAGIC_CONTROL_PAIR_NODE_TYPES,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';

const MAGIC_GRAPH_PRESET_STORAGE_KEY = 'beautiful-galileo.magicGraphPresets.v6';

export function loadStoredMagicGraphPresets(storage: Storage | undefined = getMagicGraphPresetStorage()): MagicGraphPresetConfig[] {
    if (!storage) return [];

    try {
        const parsed = JSON.parse(storage.getItem(MAGIC_GRAPH_PRESET_STORAGE_KEY) ?? '[]');
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(isMagicGraphPresetConfig);
    } catch {
        return [];
    }
}

export function saveStoredMagicGraphPreset(
    preset: MagicGraphPresetConfig,
    storage: Storage | undefined = getMagicGraphPresetStorage()
): MagicGraphPresetConfig[] {
    if (!storage) return [];

    const presets = loadStoredMagicGraphPresets(storage);
    const existingIndex = presets.findIndex(item => item.id === preset.id);
    const nextPresets = existingIndex >= 0
        ? presets.map(item => item.id === preset.id ? preset : item)
        : [...presets, preset];

    storage.setItem(MAGIC_GRAPH_PRESET_STORAGE_KEY, JSON.stringify(nextPresets));
    return nextPresets;
}

export function deleteStoredMagicGraphPreset(
    presetId: string,
    storage: Storage | undefined = getMagicGraphPresetStorage()
): MagicGraphPresetConfig[] {
    if (!storage) return [];

    const nextPresets = loadStoredMagicGraphPresets(storage)
        .filter(preset => preset.id !== presetId);

    storage.setItem(MAGIC_GRAPH_PRESET_STORAGE_KEY, JSON.stringify(nextPresets));
    return nextPresets;
}

function getMagicGraphPresetStorage(): Storage | undefined {
    if (typeof localStorage === 'undefined') return undefined;

    return localStorage;
}

function isMagicGraphPresetConfig(value: unknown): value is MagicGraphPresetConfig {
    if (!isRecord(value)) return false;
    if (typeof value.id !== 'string' || typeof value.label !== 'string') return false;
    if (
        !Array.isArray(value.circles) ||
        !Array.isArray(value.nodes) ||
        !Array.isArray(value.edges)
    ) return false;
    if (
        value.systemNodePositions !== undefined &&
        !Array.isArray(value.systemNodePositions)
    ) {
        return false;
    }

    const hasValidShapes = value.circles.every(isMagicGraphPresetCircleConfig) &&
        (value.systemNodePositions ?? []).every(isMagicGraphPresetSystemNodePositionConfig) &&
        value.nodes.every(isMagicGraphPresetNodeConfig) &&
        value.edges.every(isMagicGraphPresetEdgeConfig);
    if (!hasValidShapes) return false;

    const preset = value as unknown as MagicGraphPresetConfig;
    const circleIds = new Set(preset.circles.map(circle => circle.id));
    const hasKnownParents = preset.nodes.every(node =>
        circleIds.has(node.circleId)
    );
    const hasContiguousSequences = preset.circles.every(circle => {
        const indexes = preset.nodes
            .filter(node => node.circleId === circle.id)
            .map(node => node.sequenceIndex)
            .sort((left, right) => left - right);
        return indexes.every((sequenceIndex, expectedIndex) =>
            sequenceIndex === expectedIndex
        );
    });
    const hasValidSystemNodeSlots = preset.circles.every(circle =>
        hasValidCircleSystemNodeSlots(
            circle.systemNodeSlots,
            preset.nodes.filter(node => node.circleId === circle.id).length
        )
    );

    return hasKnownParents &&
        hasContiguousSequences &&
        hasValidSystemNodeSlots &&
        hasValidControlPairs(preset) &&
        preset.edges.every(edge => isStoredExternalEdge(edge, circleIds));
}

function isStoredExternalEdge(
    edge: MagicGraphPresetConfig['edges'][number],
    circleIds: ReadonlySet<string>
): boolean {
    const sourceIsCircle = circleIds.has(edge.source);
    const targetIsCircle = circleIds.has(edge.target);

    return (
        sourceIsCircle &&
        targetIsCircle &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        isMagicCirclePortHandleId(edge.targetHandle, 'input')
    );
}

function isMagicGraphPresetCircleConfig(value: unknown): boolean {
    if (!isRecord(value) || !isRecord(value.position)) return false;

    return typeof value.id === 'string' &&
        Number.isFinite(value.position.x) &&
        Number.isFinite(value.position.y) &&
        Number.isFinite(value.width) &&
        Number.isFinite(value.height) &&
        Array.isArray(value.systemNodeSlots) &&
        value.systemNodeSlots.every(isMagicGraphPresetCircleSystemNodeSlotConfig);
}

function isMagicGraphPresetCircleSystemNodeSlotConfig(value: unknown): boolean {
    if (!isRecord(value)) return false;

    return typeof value.magicType === 'string' &&
        Number.isInteger(value.slotIndex) &&
        Number(value.slotIndex) >= 0 &&
        isOptionalMagicNodeSettings(value.settings);
}

function hasValidCircleSystemNodeSlots(
    slots: MagicGraphPresetConfig['circles'][number]['systemNodeSlots'],
    editableNodeCount: number
): boolean {
    const expectedMagicTypes = new Set(
        CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS.map(config => config.magicType)
    );
    const actualMagicTypes = new Set(slots.map(slot => slot.magicType));

    if (slots.length !== expectedMagicTypes.size) return false;
    if (actualMagicTypes.size !== slots.length) return false;

    return slots.every(slot =>
        expectedMagicTypes.has(slot.magicType) &&
        Number.isInteger(slot.slotIndex) &&
        slot.slotIndex >= 0 &&
        slot.slotIndex <= editableNodeCount
    );
}

function isMagicGraphPresetSystemNodePositionConfig(value: unknown): boolean {
    if (!isRecord(value) || !isRecord(value.position)) return false;

    return typeof value.id === 'string' &&
        Number.isFinite(value.position.x) &&
        Number.isFinite(value.position.y);
}

function isMagicGraphPresetNodeConfig(value: unknown): boolean {
    if (!isRecord(value)) return false;

    return typeof value.id === 'string' &&
        typeof value.magicType === 'string' &&
        isMagicTypeAllowedInCircleSequence(value.magicType) &&
        typeof value.circleId === 'string' &&
        isOptionalMagicNodeSettings(value.settings) &&
        isOptionalMagicControlPair(value.controlPair) &&
        Number.isInteger(value.sequenceIndex) &&
        Number(value.sequenceIndex) >= 0;
}

function isOptionalMagicControlPair(value: unknown): boolean {
    if (value === undefined) return true;
    if (!isRecord(value)) return false;

    return typeof value.id === 'string' &&
        value.id.length > 0 &&
        (
            value.role === MAGIC_CONTROL_PAIR_ROLES.START ||
            value.role === MAGIC_CONTROL_PAIR_ROLES.END
        );
}

function hasValidControlPairs(preset: MagicGraphPresetConfig): boolean {
    const specialTypes = new Set<string>(
        Object.values(MAGIC_CONTROL_PAIR_NODE_TYPES)
    );
    const specialNodes = preset.nodes.filter(node =>
        specialTypes.has(node.magicType)
    );
    if (specialNodes.some(node => !node.controlPair)) return false;
    if (preset.nodes.some(node =>
        !specialTypes.has(node.magicType) && node.controlPair
    )) return false;

    const pairIds = new Set(
        specialNodes.map(node => node.controlPair!.id)
    );
    const intervals: Array<{
        magicType: string;
        circleId: string;
        start: number;
        end: number;
    }> = [];

    for (const pairId of pairIds) {
        const pairNodes = specialNodes.filter(node =>
            node.controlPair?.id === pairId
        );
        const start = pairNodes.find(node =>
            node.controlPair?.role === MAGIC_CONTROL_PAIR_ROLES.START
        );
        const end = pairNodes.find(node =>
            node.controlPair?.role === MAGIC_CONTROL_PAIR_ROLES.END
        );
        if (
            pairNodes.length !== 2 ||
            !start ||
            !end ||
            start.magicType !== end.magicType ||
            start.circleId !== end.circleId ||
            end.settings !== undefined
        ) {
            return false;
        }
        if (
            start.magicType === MAGIC_CONTROL_PAIR_NODE_TYPES.REPEAT &&
            start.sequenceIndex >= end.sequenceIndex
        ) {
            return false;
        }
        intervals.push({
            magicType: start.magicType,
            circleId: start.circleId,
            start: start.sequenceIndex,
            end: end.sequenceIndex,
        });
    }

    const repeatIntervals = intervals.filter(interval =>
        interval.magicType === MAGIC_CONTROL_PAIR_NODE_TYPES.REPEAT
    );
    return repeatIntervals.every((left, index) =>
        repeatIntervals.slice(index + 1).every(right =>
            left.circleId !== right.circleId ||
            !(
                left.start < right.start &&
                right.start < left.end &&
                left.end < right.end
            ) && !(
                right.start < left.start &&
                left.start < right.end &&
                right.end < left.end
            )
        )
    );
}

function isOptionalMagicNodeSettings(value: unknown): boolean {
    if (value === undefined) return true;
    if (!isRecord(value)) return false;

    return Object.values(value).every(settingValue => typeof settingValue === 'string');
}

function isMagicGraphPresetEdgeConfig(value: unknown): boolean {
    if (!isRecord(value)) return false;
    if (
        typeof value.id !== 'string' ||
        typeof value.source !== 'string' ||
        typeof value.target !== 'string'
    ) {
        return false;
    }

    return typeof value.sourceHandle === 'string' &&
        typeof value.targetHandle === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
