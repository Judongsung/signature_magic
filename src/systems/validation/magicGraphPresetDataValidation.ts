import {
    MAGIC_CIRCLE_NODE_CONFIG,
    MAGIC_CONTROL_PAIR_NODE_TYPES,
    MAGIC_CONTROL_PAIR_ROLES,
    MAGIC_NODE_HANDLE_CONFIG,
} from '../../constants/graphConfigs';
import {
    MAGIC_CIRCLE_METADATA_CONFIG,
    MAGIC_NODE_EDITOR_CONTROLS,
} from '../../constants/nodeEditorConfigs';
import {
    CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS,
    INITIAL_SYSTEM_MAGIC_NODE_CONFIGS,
} from '../../constants/systemMagicNodeConfigs';
import type { MagicGraphPresetConfig, MagicTypeConfig } from '../../types/magic';
import { getMagicNodeEditorFields } from '../graph/model/magicNodeData';
import {
    isMagicCirclePortHandleId,
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
    ...INITIAL_SYSTEM_MAGIC_NODE_CONFIGS.map(node => node.id),
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
                preset.nodes.filter(node => node.circleId === circle.id).length +
                    CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS.length
            )
        ) {
            errors.push(`Invalid magic graph preset circle height: ${preset.id} -> ${circle.id}`);
        }
        const editableNodeCount = preset.nodes.filter(node =>
            node.circleId === circle.id
        ).length;
        errors.push(...validatePresetCircleSystemNodeSlots(
            preset.id,
            circle.id,
            circle.systemNodeSlots,
            editableNodeCount
        ));
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

function validatePresetCircleSystemNodeSlots(
    presetId: string,
    circleId: string,
    slots: MagicGraphPresetConfig['circles'][number]['systemNodeSlots'],
    editableNodeCount: number
): string[] {
    const errors: string[] = [];
    if (!Array.isArray(slots)) {
        return [`Invalid magic graph preset system node slots: ${presetId} -> ${circleId}`];
    }

    const expectedMagicTypes = new Set(
        CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS.map(config => config.magicType)
    );
    const actualMagicTypes = new Set<string>();

    slots.forEach(slot => {
        if (
            !slot ||
            typeof slot !== 'object' ||
            !isNonEmptyString(slot.magicType) ||
            !expectedMagicTypes.has(slot.magicType) ||
            actualMagicTypes.has(slot.magicType) ||
            !Number.isInteger(slot.slotIndex) ||
            slot.slotIndex < 0 ||
            slot.slotIndex > editableNodeCount
        ) {
            errors.push(`Invalid magic graph preset system node slot: ${presetId} -> ${circleId}`);
            return;
        }

        actualMagicTypes.add(slot.magicType);
    });

    if (
        slots.length !== expectedMagicTypes.size ||
        actualMagicTypes.size !== expectedMagicTypes.size
    ) {
        errors.push(`Missing magic graph preset system node slot: ${presetId} -> ${circleId}`);
    }

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
        if (node.controlPair !== undefined && (
            !isPlainObject(node.controlPair) ||
            !isNonEmptyString(node.controlPair.id) ||
            (
                node.controlPair.role !== MAGIC_CONTROL_PAIR_ROLES.START &&
                node.controlPair.role !== MAGIC_CONTROL_PAIR_ROLES.END
            )
        )) {
            errors.push(`Invalid magic graph preset control pair: ${preset.id} -> ${node.id}`);
        }
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

    errors.push(...validatePresetControlPairs(preset));

    return errors;
}

function validatePresetControlPairs(
    preset: MagicGraphPresetConfig
): string[] {
    const errors: string[] = [];
    const specialTypes = new Set<string>(
        Object.values(MAGIC_CONTROL_PAIR_NODE_TYPES)
    );
    const specialNodes = preset.nodes.filter(node =>
        specialTypes.has(node.magicType)
    );

    preset.nodes.forEach(node => {
        if (specialTypes.has(node.magicType) !== Boolean(node.controlPair)) {
            errors.push(`Invalid magic graph preset paired node: ${preset.id} -> ${node.id}`);
        }
    });

    const pairIds = new Set(
        specialNodes.flatMap(node =>
            node.controlPair ? [node.controlPair.id] : []
        )
    );
    const repeatIntervals: Array<{
        circleId: string;
        start: number;
        end: number;
    }> = [];

    pairIds.forEach(pairId => {
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
            errors.push(`Invalid magic graph preset pair structure: ${preset.id} -> ${pairId}`);
            return;
        }
        if (
            start.magicType === MAGIC_CONTROL_PAIR_NODE_TYPES.REPEAT &&
            start.sequenceIndex >= end.sequenceIndex
        ) {
            errors.push(`Invalid magic graph preset pair structure: ${preset.id} -> ${pairId}`);
            return;
        }
        if (start.magicType === MAGIC_CONTROL_PAIR_NODE_TYPES.REPEAT) {
            repeatIntervals.push({
                circleId: start.circleId,
                start: start.sequenceIndex,
                end: end.sequenceIndex,
            });
        }
    });

    repeatIntervals.forEach((left, index) => {
        repeatIntervals.slice(index + 1).forEach(right => {
            const crosses = left.circleId === right.circleId && (
                (
                    left.start < right.start &&
                    right.start < left.end &&
                    left.end < right.end
                ) || (
                    right.start < left.start &&
                    left.start < right.end &&
                    right.end < left.end
                )
            );
            if (crosses) {
                errors.push(`Crossed magic graph preset repeat pairs: ${preset.id}`);
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
    const sourceIsCircle = circleIds.has(edge.source);
    const targetIsCircle = circleIds.has(edge.target);

    return (
        sourceIsCircle &&
        targetIsCircle &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        isMagicCirclePortHandleId(edge.targetHandle, 'input')
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
