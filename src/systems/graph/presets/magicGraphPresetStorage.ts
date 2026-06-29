import type { MagicGraphPresetConfig } from '../../../types/magic';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import {
    isMagicCirclePortHandleId,
    isMagicNodePortHandleId,
    isMagicTypeAllowedInCircleSequence,
} from '../model/magicCircleGraph';

const MAGIC_GRAPH_PRESET_STORAGE_KEY = 'beautiful-galileo.magicGraphPresets.v3';

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

    return hasKnownParents &&
        hasContiguousSequences &&
        preset.edges.every(edge => isStoredExternalEdge(edge, circleIds));
}

function isStoredExternalEdge(
    edge: MagicGraphPresetConfig['edges'][number],
    circleIds: ReadonlySet<string>
): boolean {
    const sourceIsCircle = circleIds.has(edge.source);
    const targetIsCircle = circleIds.has(edge.target);

    return (
        edge.source === SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id &&
        targetIsCircle &&
        isMagicNodePortHandleId(edge.sourceHandle, 'output') &&
        isMagicCirclePortHandleId(edge.targetHandle, 'input')
    ) || (
        sourceIsCircle &&
        targetIsCircle &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        isMagicCirclePortHandleId(edge.targetHandle, 'input')
    ) || (
        sourceIsCircle &&
        edge.target === SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        isMagicNodePortHandleId(edge.targetHandle, 'input')
    );
}

function isMagicGraphPresetCircleConfig(value: unknown): boolean {
    if (!isRecord(value) || !isRecord(value.position)) return false;

    return typeof value.id === 'string' &&
        Number.isFinite(value.position.x) &&
        Number.isFinite(value.position.y) &&
        Number.isFinite(value.width) &&
        Number.isFinite(value.height);
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
        Number.isInteger(value.sequenceIndex) &&
        Number(value.sequenceIndex) >= 0;
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
