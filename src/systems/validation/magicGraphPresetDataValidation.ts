import {
    MAGIC_CIRCLE_NODE_CONFIG,
    MAGIC_NODE_HANDLE_CONFIG,
} from '../../constants/graphConfigs';
import {
    MAGIC_CIRCLE_METADATA_CONFIG,
    MAGIC_NODE_EDITOR_CONTROLS,
} from '../../constants/nodeEditorConfigs';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../constants/systemMagicNodeConfigs';
import type { MagicGraphPresetConfig, MagicTypeConfig } from '../../types/magic';
import { getMagicNodeEditorFields } from '../graph/model/magicNodeData';
import {
    isMagicCirclePortHandleId,
    isMagicNodePortHandleId,
    resolveMagicCircleRequiredHeight,
} from '../graph/model/magicCircleGraph';
import { collectMagicGraphPresetReferenceErrors } from '../graph/presets/magicGraphPresets';
import {
    collectDuplicateErrors,
    isFiniteNumber,
    isNonEmptyString,
    isPlainObject,
    isPlainObjectArray,
    result,
    type DataValidationResult,
} from './commonValidation';

const HANDLE_ID_PATTERN = /^\w+-\d+$/;
const SYSTEM_NODE_IDS = new Set<string>([
    SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
    SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
]);

export function validateMagicGraphPresets(
    presetsInput: unknown,
    magicTypesInput: unknown
): DataValidationResult {
    if (!isMagicGraphPresetArray(presetsInput)) {
        return result(['Invalid magic graph preset configs']);
    }
    if (!isSafeMagicTypesForPresetValidation(magicTypesInput)) {
        return result(['Invalid magic type configs for graph presets']);
    }

    const presets = presetsInput as unknown as MagicGraphPresetConfig[];
    const magicTypes = magicTypesInput as unknown as MagicTypeConfig[];
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
        errors.push(...validatePresetCircles(preset));
        errors.push(...validatePresetNodes(preset, magicTypes));
        errors.push(...validatePresetEdges(preset));
        errors.push(...collectMagicGraphPresetReferenceErrors(preset, magicTypes));
    });

    return result(errors);
}

function isMagicGraphPresetArray(value: unknown): value is Record<string, unknown>[] {
    if (!isPlainObjectArray(value)) return false;

    return value.every(preset =>
        isPlainObjectArray(preset.circles) &&
        isPlainObjectArray(preset.nodes) &&
        isPlainObjectArray(preset.edges) &&
        (preset.systemNodePositions === undefined || isPlainObjectArray(preset.systemNodePositions))
    );
}

function validatePresetCircles(preset: MagicGraphPresetConfig): string[] {
    const errors: string[] = [];

    errors.push(...collectDuplicateErrors(
        preset.circles.map(circle => circle.id),
        `magic graph preset circle id: ${preset.id}`
    ));

    preset.circles.forEach(circle => {
        if (!isNonEmptyString(circle.id)) {
            errors.push(`Invalid magic graph preset circle id: ${preset.id} -> ${circle.id}`);
        }
        if (!isFiniteNumber(circle.position?.x)) {
            errors.push(`Invalid magic graph preset circle x: ${preset.id} -> ${circle.id}`);
        }
        if (!isFiniteNumber(circle.position?.y)) {
            errors.push(`Invalid magic graph preset circle y: ${preset.id} -> ${circle.id}`);
        }
        if (
            !isFiniteNumber(circle.width) ||
            circle.width < MAGIC_CIRCLE_NODE_CONFIG.MIN_SIZE.width
        ) {
            errors.push(`Invalid magic graph preset circle width: ${preset.id} -> ${circle.id}`);
        }
        if (
            !isFiniteNumber(circle.height) ||
            circle.height < resolveMagicCircleRequiredHeight(
                preset.nodes.filter(node => node.circleId === circle.id).length
            )
        ) {
            errors.push(`Invalid magic graph preset circle height: ${preset.id} -> ${circle.id}`);
        }
        if (
            circle.name !== undefined &&
            (
                !isNonEmptyString(circle.name) ||
                circle.name.trim().length > MAGIC_CIRCLE_METADATA_CONFIG.NAME_MAX_LENGTH
            )
        ) {
            errors.push(`Invalid magic graph preset circle name: ${preset.id} -> ${circle.id}`);
        }
        if (
            circle.caption !== undefined &&
            (
                !isNonEmptyString(circle.caption) ||
                circle.caption.trim().length > MAGIC_CIRCLE_METADATA_CONFIG.CAPTION_MAX_LENGTH
            )
        ) {
            errors.push(`Invalid magic graph preset circle caption: ${preset.id} -> ${circle.id}`);
        }
    });

    return errors;
}

function isSafeMagicTypesForPresetValidation(value: unknown): value is Record<string, unknown>[] {
    if (!isPlainObjectArray(value)) return false;

    return value.every(magicType => {
        const instanceEditor = magicType.instanceEditor;
        if (instanceEditor === undefined || !isPlainObject(instanceEditor)) return true;

        return instanceEditor.fields === undefined || isPlainObjectArray(instanceEditor.fields);
    });
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
        if (!isNonEmptyString(node.circleId)) {
            errors.push(`Invalid magic graph preset node circle: ${preset.id} -> ${node.id}`);
        }
        if (
            !Number.isInteger(node.sequenceIndex) ||
            node.sequenceIndex < 0
        ) {
            errors.push(`Invalid magic graph preset node sequence: ${preset.id} -> ${node.id}`);
        }
        errors.push(...validatePresetNodeSettings(preset.id, node, magicTypes));
    });

    preset.circles.forEach(circle => {
        const sequence = preset.nodes
            .filter(node => node.circleId === circle.id)
            .map(node => node.sequenceIndex)
            .sort((left, right) => left - right);
        sequence.forEach((sequenceIndex, expectedIndex) => {
            if (sequenceIndex !== expectedIndex) {
                errors.push(`Non-contiguous magic graph preset sequence: ${preset.id} -> ${circle.id}`);
            }
        });
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
        if (
            field.control === MAGIC_NODE_EDITOR_CONTROLS.TEXT &&
            field.maxLength !== undefined &&
            value.trim().length > field.maxLength
        ) {
            errors.push(`Magic graph preset node setting is too long: ${presetId} -> ${node.id} -> ${key}`);
        }
        if (field.control === MAGIC_NODE_EDITOR_CONTROLS.STEPPER) {
            const numericValue = Number(value);
            const isAlignedToStep = Number.isInteger(numericValue) &&
                (numericValue - field.min) % field.step === 0;
            if (
                !isAlignedToStep ||
                numericValue < field.min ||
                numericValue > field.max
            ) {
                errors.push(`Invalid magic graph preset stepper setting: ${presetId} -> ${node.id} -> ${key}`);
            }
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
        if (!isValidExternalPresetEdge(edge, preset)) {
            errors.push(`Invalid magic graph preset external edge: ${preset.id} -> ${edge.id}`);
        } else if (!isValidHandleId(edge.sourceHandle, MAGIC_NODE_HANDLE_CONFIG.OUTPUT_PREFIX)) {
            errors.push(`Invalid magic graph preset source handle: ${preset.id} -> ${edge.id} -> ${edge.sourceHandle}`);
        } else if (!isValidHandleId(edge.targetHandle, MAGIC_NODE_HANDLE_CONFIG.INPUT_PREFIX)) {
            errors.push(`Invalid magic graph preset target handle: ${preset.id} -> ${edge.id} -> ${edge.targetHandle}`);
        }
    });

    return errors;
}

function isValidExternalPresetEdge(
    edge: MagicGraphPresetConfig['edges'][number],
    preset: MagicGraphPresetConfig
): boolean {
    const circleIds = new Set(preset.circles.map(circle => circle.id));
    const sourceIsMana = edge.source === SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id;
    const targetIsOutput = edge.target === SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id;
    const sourceIsCircle = circleIds.has(edge.source);
    const targetIsCircle = circleIds.has(edge.target);

    return (
        sourceIsMana &&
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
        targetIsOutput &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        isMagicNodePortHandleId(edge.targetHandle, 'input')
    );
}

function isValidHandleId(handleId: string, expectedPrefix: string): boolean {
    const isOutput = expectedPrefix === MAGIC_NODE_HANDLE_CONFIG.OUTPUT_PREFIX;
    const isCircleHandle = isOutput
        ? isMagicCirclePortHandleId(handleId, 'output')
        : isMagicCirclePortHandleId(handleId, 'input');
    if (isCircleHandle) {
        return true;
    }
    if (!HANDLE_ID_PATTERN.test(handleId)) return false;

    return handleId.startsWith(`${expectedPrefix}-`);
}
