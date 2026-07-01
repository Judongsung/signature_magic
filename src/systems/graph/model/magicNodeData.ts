import {
    MAGIC_NODE_DEFAULT_CAPTION_EDITOR_FIELD,
    MAGIC_NODE_EDITOR_BEHAVIORS,
    MAGIC_NODE_EDITOR_CONTROLS,
    MAGIC_NODE_EDITOR_PRESENTATIONS,
    MAGIC_NODE_WEIGHT_CONFIG,
    MAGIC_NODE_WEIGHT_EDITOR_FIELD,
    MAGIC_REPEAT_CONFIG,
} from '../../../constants/nodeEditorConfigs';
import { MAGIC_NODE_KINDS } from '../../../constants/graphConfigs';
import {
    type MagicEditorNode,
    type MagicNode,
    type MagicNodeData,
    type MagicUserNodeData,
} from '../magicGraphTypes';
import {
    type MagicNodeEditorFieldConfig,
    type MagicNodeSettings,
    type MagicNodeStepperEditorFieldConfig,
    type MagicType,
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import { readMagicTypeConfig, type MagicTypeLookup } from './magicTypeLookup';
import { isMagicCircleNode } from './magicCircleGraph';
import { canMagicTypeUseNodeWeight } from './magicNodeWeight';
import {
    isRegisteredCircleSystemMagicType,
} from './circleSystemMagicTypePolicy';

export function createUserMagicNodeData(
    magicType: MagicType,
    settings?: MagicNodeSettings
): MagicUserNodeData {
    return {
        magicType,
        ...(settings ? { settings: { ...settings } } : {}),
        nodeKind: MAGIC_NODE_KINDS.USER,
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
    const commonFields = canMagicTypeUseNodeWeight(config)
        ? [MAGIC_NODE_WEIGHT_EDITOR_FIELD]
        : [];

    if (
        isRegisteredCircleSystemMagicType(config.type) ||
        hasCaptionOverride
    ) {
        return [...configuredFields, ...commonFields];
    }

    return [
        ...configuredFields,
        ...commonFields,
        MAGIC_NODE_DEFAULT_CAPTION_EDITOR_FIELD,
    ];
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

            const value = normalizeMagicNodeEditorFieldValue(field, rawValue);

            return value ? [[field.key, value]] : [];
        })
    );

    return Object.keys(normalized).length > 0
        ? normalized
        : undefined;
}

export function resolveMagicNodeLabel(
    data: Pick<MagicNodeData, 'magicType' | 'settings'>,
    config: MagicTypeConfig | undefined
): string {
    const customLabel = resolveMagicNodePresentationValue(
        data,
        config,
        MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL
    );

    const baseLabel = customLabel || config?.label || data.magicType;
    const suffixField = getMagicNodeEditorFields(config).find(
        candidate =>
            candidate.presentation ===
            MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL_SUFFIX
    );
    if (!suffixField) return baseLabel;

    const suffixValue = getMagicNodeEditorFieldDraftValue(
        suffixField,
        data.settings
    ).trim();
    if (
        suffixField.behavior === MAGIC_NODE_EDITOR_BEHAVIORS.NODE_WEIGHT &&
        Number(suffixValue) === MAGIC_NODE_WEIGHT_CONFIG.DEFAULT
    ) {
        return baseLabel;
    }

    const suffix = formatMagicNodeLabelSuffix(suffixField, suffixValue);

    return `${baseLabel} ${suffix}`;
}

export function resolveMagicNodeCaption(
    data: Pick<MagicNodeData, 'magicType' | 'settings'>,
    config: MagicTypeConfig | undefined
): string | undefined {
    return resolveMagicNodePresentationValue(
        data,
        config,
        MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_CAPTION
    );
}

export function getMagicNodeEditorFieldDraftValue(
    field: MagicNodeEditorFieldConfig,
    settings: Readonly<MagicNodeSettings> | undefined
): string {
    const storedValue = settings?.[field.key];
    if (typeof storedValue === 'string') return storedValue;

    return field.control === MAGIC_NODE_EDITOR_CONTROLS.STEPPER
        ? String(field.defaultValue)
        : '';
}

export function resolveMagicNodeRepeatCount(
    data: Pick<MagicNodeData, 'magicType' | 'settings'>,
    config: MagicTypeConfig | undefined
): number | undefined {
    const field = getMagicNodeEditorFields(config).find(
        candidate => candidate.behavior === MAGIC_NODE_EDITOR_BEHAVIORS.REPEAT_COUNT
    );
    if (!field || field.control !== MAGIC_NODE_EDITOR_CONTROLS.STEPPER) return undefined;

    return normalizeMagicNodeStepperValue(
        field,
        getMagicNodeEditorFieldDraftValue(field, data.settings)
    );
}

export function updateMagicNodeSettings(
    nodes: MagicEditorNode[],
    nodeId: string,
    settings: Readonly<MagicNodeSettings> | undefined,
    magicTypes: MagicTypeLookup
): MagicEditorNode[] {
    let changed = false;
    const updatedNodes = nodes.map(node => {
        if (node.id !== nodeId) return node;
        if (isMagicCircleNode(node)) return node;

        const config = readMagicTypeConfig(node, magicTypes);
        const normalizedSettings = normalizeMagicNodeSettings(config, settings);
        if (areMagicNodeSettingsEqual(node.data.settings, normalizedSettings)) return node;

        changed = true;
        if (node.data.nodeKind === MAGIC_NODE_KINDS.USER) {
            const {
                settings: _currentSettings,
                ...dataWithoutSettings
            } = node.data;
            return {
                ...node,
                data: {
                    ...dataWithoutSettings,
                    ...(normalizedSettings
                        ? { settings: normalizedSettings }
                        : {}),
                },
            };
        }

        const {
            settings: _currentSettings,
            ...dataWithoutSettings
        } = node.data;
        return {
            ...node,
            data: {
                ...dataWithoutSettings,
                ...(normalizedSettings
                    ? { settings: normalizedSettings }
                    : {}),
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
    data: Pick<MagicNodeData, 'magicType' | 'settings'>,
    config: MagicTypeConfig | undefined,
    presentation: MagicNodeEditorFieldConfig['presentation']
): string | undefined {
    const field = getMagicNodeEditorFields(config).find(
        candidate => candidate.presentation === presentation
    );
    const value = field
        ? getMagicNodeEditorFieldDraftValue(field, data.settings).trim()
        : undefined;

    return value || undefined;
}

function formatMagicNodeLabelSuffix(
    field: MagicNodeEditorFieldConfig,
    value: string
): string {
    if (field.behavior === MAGIC_NODE_EDITOR_BEHAVIORS.NODE_WEIGHT) {
        return `${MAGIC_NODE_WEIGHT_CONFIG.LABEL_PREFIX}${value}`;
    }
    if (field.behavior === MAGIC_NODE_EDITOR_BEHAVIORS.REPEAT_COUNT) {
        return Number(value) === MAGIC_REPEAT_CONFIG.INFINITE_COUNT
            ? MAGIC_REPEAT_CONFIG.INFINITE_LABEL
            : `${MAGIC_REPEAT_CONFIG.FINITE_LABEL_PREFIX}${value}`;
    }

    return value;
}

function normalizeMagicNodeEditorFieldValue(
    field: MagicNodeEditorFieldConfig,
    rawValue: string
): string | undefined {
    if (field.control === MAGIC_NODE_EDITOR_CONTROLS.TEXT) {
        const trimmedValue = rawValue.trim();
        const value = field.maxLength === undefined
            ? trimmedValue
            : trimmedValue.slice(0, field.maxLength);

        return value || undefined;
    }

    const value = normalizeMagicNodeStepperValue(field, rawValue);
    return value === field.defaultValue ? undefined : String(value);
}

function normalizeMagicNodeStepperValue(
    field: MagicNodeStepperEditorFieldConfig,
    rawValue: string
): number {
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) return field.defaultValue;

    const steppedValue = field.min + Math.round((parsedValue - field.min) / field.step) * field.step;
    return Math.min(field.max, Math.max(field.min, steppedValue));
}
