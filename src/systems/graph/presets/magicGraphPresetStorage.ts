import type { MagicGraphPresetConfig } from '../../../types/magic';

const MAGIC_GRAPH_PRESET_STORAGE_KEY = 'beautiful-galileo.magicGraphPresets';

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
    if (!Array.isArray(value.nodes) || !Array.isArray(value.edges)) return false;
    if (
        value.systemNodePositions !== undefined &&
        !Array.isArray(value.systemNodePositions)
    ) {
        return false;
    }

    return (value.systemNodePositions ?? []).every(isMagicGraphPresetSystemNodePositionConfig) &&
        value.nodes.every(isMagicGraphPresetNodeConfig) &&
        value.edges.every(isMagicGraphPresetEdgeConfig);
}

function isMagicGraphPresetSystemNodePositionConfig(value: unknown): boolean {
    if (!isRecord(value) || !isRecord(value.position)) return false;

    return typeof value.id === 'string' &&
        Number.isFinite(value.position.x) &&
        Number.isFinite(value.position.y);
}

function isMagicGraphPresetNodeConfig(value: unknown): boolean {
    if (!isRecord(value) || !isRecord(value.position)) return false;

    return typeof value.id === 'string' &&
        typeof value.magicType === 'string' &&
        Number.isFinite(value.position.x) &&
        Number.isFinite(value.position.y);
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

    return isOptionalString(value.sourceHandle) &&
        isOptionalString(value.targetHandle);
}

function isOptionalString(value: unknown): boolean {
    return value === undefined || typeof value === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
