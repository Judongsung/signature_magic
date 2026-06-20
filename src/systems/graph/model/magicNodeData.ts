import {
    MAGIC_NODE_DEFAULT_CAPTION_EDITOR_FIELD,
    MAGIC_NODE_EDITOR_PRESENTATIONS,
} from '../../../constants/gameConfigs';
import {
    MAGIC_NODE_HANDLE_CONFIG,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import type {
    MagicNode,
    MagicNodeEditorFieldConfig,
    MagicNodeSettings,
    MagicType,
    MagicTypeConfig,
} from '../../../types/magic';
import { readMagicTypeConfig, type MagicTypeLookup } from './magicTypeLookup';

const SYSTEM_MAGIC_TYPE_IDS = new Set<string>([
    SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
    SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
]);

export function createUserMagicNodeData(
    magicType: MagicType,
    settings?: MagicNodeSettings
): MagicNode['data'] {
    return {
        magicType,
        ...(settings ? { settings: { ...settings } } : {}),
        nodeKind: MAGIC_NODE_KINDS.USER,
        isRoot: true,
        isLeaf: true,
        inputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
        outputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
    };
}

export function getMagicNodeEditorFields(
    config: MagicTypeConfig | undefined
): readonly MagicNodeEditorFieldConfig[] {
    if (!config) return [];

    const configuredFields = config.instanceEditor?.fields ?? [];
    const hasCaptionOverride = configuredFields.some(field =>
        field.key === MAGIC_NODE_DEFAULT_CAPTION_EDITOR_FIELD.key ||
        field.presentation === MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_CAPTION
    );

    if (SYSTEM_MAGIC_TYPE_IDS.has(config.type) || hasCaptionOverride) {
        return configuredFields;
    }

    return [...configuredFields, MAGIC_NODE_DEFAULT_CAPTION_EDITOR_FIELD];
}

export function normalizeMagicNodeSettings(
    config: MagicTypeConfig | undefined,
    settings: Readonly<MagicNodeSettings> | undefined
): MagicNodeSettings | undefined {
    if (!settings) return undefined;

    const normalized = Object.fromEntries(
        getMagicNodeEditorFields(config).flatMap(field => {
            const rawValue = settings[field.key];
            if (typeof rawValue !== 'string') return [];

            const trimmedValue = rawValue.trim();
            const value = field.maxLength === undefined
                ? trimmedValue
                : trimmedValue.slice(0, field.maxLength);

            return value ? [[field.key, value]] : [];
        })
    );

    return Object.keys(normalized).length > 0
        ? normalized
        : undefined;
}

export function resolveMagicNodeLabel(
    data: MagicNode['data'],
    config: MagicTypeConfig | undefined
): string {
    const customLabel = resolveMagicNodePresentationValue(
        data,
        config,
        MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL
    );

    return customLabel || config?.label || data.magicType;
}

export function resolveMagicNodeCaption(
    data: MagicNode['data'],
    config: MagicTypeConfig | undefined
): string | undefined {
    return resolveMagicNodePresentationValue(
        data,
        config,
        MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_CAPTION
    );
}

export function updateMagicNodeSettings(
    nodes: MagicNode[],
    nodeId: string,
    settings: Readonly<MagicNodeSettings> | undefined,
    magicTypes: MagicTypeLookup
): MagicNode[] {
    let changed = false;
    const updatedNodes = nodes.map(node => {
        if (node.id !== nodeId) return node;

        const config = readMagicTypeConfig(node, magicTypes);
        const normalizedSettings = normalizeMagicNodeSettings(config, settings);
        if (areMagicNodeSettingsEqual(node.data.settings, normalizedSettings)) return node;

        changed = true;
        const { settings: _currentSettings, ...dataWithoutSettings } = node.data;
        return {
            ...node,
            data: {
                ...dataWithoutSettings,
                ...(normalizedSettings ? { settings: normalizedSettings } : {}),
            },
        };
    });

    return changed ? updatedNodes : nodes;
}

function areMagicNodeSettingsEqual(
    left: Readonly<MagicNodeSettings> | undefined,
    right: Readonly<MagicNodeSettings> | undefined
): boolean {
    if (left === right) return true;
    const leftEntries = Object.entries(left ?? {});
    const rightEntries = Object.entries(right ?? {});
    if (leftEntries.length !== rightEntries.length) return false;

    return leftEntries.every(([key, value]) => right?.[key] === value);
}

function resolveMagicNodePresentationValue(
    data: MagicNode['data'],
    config: MagicTypeConfig | undefined,
    presentation: MagicNodeEditorFieldConfig['presentation']
): string | undefined {
    const field = getMagicNodeEditorFields(config).find(
        candidate => candidate.presentation === presentation
    );
    const value = field ? data.settings?.[field.key]?.trim() : undefined;

    return value || undefined;
}
