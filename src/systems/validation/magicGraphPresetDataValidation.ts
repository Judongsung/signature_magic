import { MAGIC_NODE_HANDLE_CONFIG } from '../../constants/graphConfigs';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../constants/systemMagicNodeConfigs';
import type { MagicGraphPresetConfig, MagicTypeConfig } from '../../types/magic';
import { getMagicNodeEditorFields } from '../graph/model/magicNodeData';
import { collectMagicGraphPresetReferenceErrors } from '../graph/presets/magicGraphPresets';
import {
    collectDuplicateErrors,
    isFiniteNumber,
    isNonEmptyString,
    isPlainObject,
    result,
    type DataValidationResult,
} from './commonValidation';

const HANDLE_ID_PATTERN = /^\w+-\d+$/;
const SYSTEM_NODE_IDS = new Set<string>([
    SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
    SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
]);

export function validateMagicGraphPresets(
    presets: MagicGraphPresetConfig[],
    magicTypes: MagicTypeConfig[]
): DataValidationResult {
    const errors: string[] = [];

    errors.push(...collectDuplicateErrors(
        presets.map(preset => preset.id),
        'magic graph preset id'
    ));

    presets.forEach(preset => {
        if (!isNonEmptyString(preset.id)) {
            errors.push(`Invalid magic graph preset id: ${preset.id}`);
        }
        if (!isNonEmptyString(preset.label)) {
            errors.push(`Missing magic graph preset label: ${preset.id}`);
        }
        errors.push(...validatePresetSystemNodePositions(preset));
        errors.push(...validatePresetNodes(preset, magicTypes));
        errors.push(...validatePresetEdges(preset));
        errors.push(...collectMagicGraphPresetReferenceErrors(preset, magicTypes));
    });

    return result(errors);
}

function validatePresetSystemNodePositions(preset: MagicGraphPresetConfig): string[] {
    const errors: string[] = [];
    const systemNodePositions = preset.systemNodePositions ?? [];

    errors.push(...collectDuplicateErrors(
        systemNodePositions.map(node => node.id),
        `magic graph preset system node id: ${preset.id}`
    ));

    systemNodePositions.forEach(node => {
        if (!isNonEmptyString(node.id)) {
            errors.push(`Invalid magic graph preset system node id: ${preset.id} -> ${node.id}`);
        }
        if (isNonEmptyString(node.id) && !SYSTEM_NODE_IDS.has(node.id)) {
            errors.push(`Unknown magic graph preset system node id: ${preset.id} -> ${node.id}`);
        }
        if (!isFiniteNumber(node.position?.x)) {
            errors.push(`Invalid magic graph preset system node x: ${preset.id} -> ${node.id}`);
        }
        if (!isFiniteNumber(node.position?.y)) {
            errors.push(`Invalid magic graph preset system node y: ${preset.id} -> ${node.id}`);
        }
    });

    return errors;
}

function validatePresetNodes(
    preset: MagicGraphPresetConfig,
    magicTypes: MagicTypeConfig[]
): string[] {
    const errors: string[] = [];

    errors.push(...collectDuplicateErrors(
        preset.nodes.map(node => node.id),
        `magic graph preset node id: ${preset.id}`
    ));

    preset.nodes.forEach(node => {
        if (!isNonEmptyString(node.id)) {
            errors.push(`Invalid magic graph preset node id: ${preset.id} -> ${node.id}`);
        }
        if (SYSTEM_NODE_IDS.has(node.id)) {
            errors.push(`Reserved magic graph preset node id: ${preset.id} -> ${node.id}`);
        }
        if (!isNonEmptyString(node.magicType)) {
            errors.push(`Invalid magic graph preset node type: ${preset.id} -> ${node.id}`);
        }
        if (!isFiniteNumber(node.position?.x)) {
            errors.push(`Invalid magic graph preset node x: ${preset.id} -> ${node.id}`);
        }
        if (!isFiniteNumber(node.position?.y)) {
            errors.push(`Invalid magic graph preset node y: ${preset.id} -> ${node.id}`);
        }
        errors.push(...validatePresetNodeSettings(preset.id, node, magicTypes));
    });

    return errors;
}

function validatePresetNodeSettings(
    presetId: string,
    node: MagicGraphPresetConfig['nodes'][number],
    magicTypes: MagicTypeConfig[]
): string[] {
    if (node.settings === undefined) return [];
    if (!isPlainObject(node.settings)) {
        return [`Invalid magic graph preset node settings: ${presetId} -> ${node.id}`];
    }

    const errors: string[] = [];
    const config = magicTypes.find(magicType => magicType.type === node.magicType);
    const fieldByKey = new Map(
        getMagicNodeEditorFields(config).map(field => [field.key, field])
    );

    Object.entries(node.settings).forEach(([key, value]) => {
        const field = fieldByKey.get(key);
        if (!field) {
            errors.push(`Unknown magic graph preset node setting: ${presetId} -> ${node.id} -> ${key}`);
            return;
        }
        if (!isNonEmptyString(value)) {
            errors.push(`Invalid magic graph preset node setting value: ${presetId} -> ${node.id} -> ${key}`);
            return;
        }
        if (field.maxLength !== undefined && value.trim().length > field.maxLength) {
            errors.push(`Magic graph preset node setting is too long: ${presetId} -> ${node.id} -> ${key}`);
        }
    });

    return errors;
}

function validatePresetEdges(preset: MagicGraphPresetConfig): string[] {
    const errors: string[] = [];

    errors.push(...collectDuplicateErrors(
        preset.edges.map(edge => edge.id),
        `magic graph preset edge id: ${preset.id}`
    ));

    preset.edges.forEach(edge => {
        if (!isNonEmptyString(edge.id)) {
            errors.push(`Invalid magic graph preset edge id: ${preset.id} -> ${edge.id}`);
        }
        if (!isValidHandleId(edge.sourceHandle, MAGIC_NODE_HANDLE_CONFIG.OUTPUT_PREFIX)) {
            errors.push(`Invalid magic graph preset source handle: ${preset.id} -> ${edge.id} -> ${edge.sourceHandle}`);
        }
        if (!isValidHandleId(edge.targetHandle, MAGIC_NODE_HANDLE_CONFIG.INPUT_PREFIX)) {
            errors.push(`Invalid magic graph preset target handle: ${preset.id} -> ${edge.id} -> ${edge.targetHandle}`);
        }
    });

    return errors;
}

function isValidHandleId(handleId: string | undefined, expectedPrefix: string): boolean {
    if (handleId === undefined) return true;
    if (!HANDLE_ID_PATTERN.test(handleId)) return false;

    return handleId.startsWith(`${expectedPrefix}-`);
}
