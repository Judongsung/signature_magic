import {
    MAGIC_CIRCLE_NODE_CONFIG,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../constants/graphConfigs';
import {
    MAGIC_CIRCLE_METADATA_CONFIG,
    MAGIC_NODE_EDITOR_CONTROLS,
} from '../../constants/nodeEditorConfigs';
import {
    CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS,
    CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS,
} from '../../constants/circleSystemMagicNodeConfigs';
import {
    type MagicGraphPresetConfig,
} from '../graph/presets/magicGraphPresetTypes';
import {
    type MagicTypeConfig,
} from '../../types/magicTypeConfig';
import { getMagicNodeEditorFields } from '../graph/model/magicNodeData';
import {
    isMagicCirclePortHandleId,
    isMagicTypeAllowedInCircleSequence,
    resolveMagicCircleRequiredHeight,
} from '../graph/model/magicCircleGraph';
import {
    analyzeMagicGraphControlPairs,
    findNonContiguousMagicGraphSequenceCircleIds,
    hasValidMagicGraphConnectionJoinSlots,
    hasValidMagicGraphExternalFlow,
    isMagicGraphExternalCircleEdge,
} from '../graph/model/magicGraphSnapshotRules';
import {
    collectDuplicateErrors,
    isFiniteNumber,
    isNonEmptyString,
    isPlainObject,
    isPlainObjectArray,
    result,
    type DataValidationResult,
} from './commonValidation';

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
    const errors = collectDuplicateErrors(
        presets.map(preset => preset.id),
        'magic graph preset id'
    );

    presets.forEach(preset => {
        if (!isNonEmptyString(preset.id)) {
            errors.push(`Invalid magic graph preset id: ${preset.id}`);
        }
        if (!isNonEmptyString(preset.label)) {
            errors.push(`Missing magic graph preset label: ${preset.id}`);
        }
        errors.push(...validateLegacySystemNodePositions(preset));
        errors.push(...validatePresetCircles(preset, magicTypes));
        errors.push(...validatePresetNodes(preset, magicTypes));
        errors.push(...validatePresetEdges(preset));
        errors.push(...validatePresetReferences(preset, magicTypes));
    });

    return result(errors);
}

function isMagicGraphPresetArray(
    value: unknown
): value is Record<string, unknown>[] {
    if (!isPlainObjectArray(value)) return false;

    return value.every(preset =>
        isPlainObjectArray(preset.circles) &&
        isPlainObjectArray(preset.nodes) &&
        isPlainObjectArray(preset.edges) &&
        (
            preset.systemNodePositions === undefined ||
            isPlainObjectArray(preset.systemNodePositions)
        )
    );
}

function validatePresetCircles(
    preset: MagicGraphPresetConfig,
    magicTypes: MagicTypeConfig[]
): string[] {
    const errors = collectDuplicateErrors(
        preset.circles.map(circle => circle.id),
        `magic graph preset circle id: ${preset.id}`
    );

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
                preset.nodes.filter(node =>
                    node.circleId === circle.id
                ).length + CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS.length
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
            editableNodeCount,
            magicTypes
        ));
        if (
            circle.name !== undefined &&
            (
                !isNonEmptyString(circle.name) ||
                circle.name.trim().length >
                    MAGIC_CIRCLE_METADATA_CONFIG.NAME_MAX_LENGTH
            )
        ) {
            errors.push(`Invalid magic graph preset circle name: ${preset.id} -> ${circle.id}`);
        }
        if (
            circle.caption !== undefined &&
            (
                !isNonEmptyString(circle.caption) ||
                circle.caption.trim().length >
                    MAGIC_CIRCLE_METADATA_CONFIG.CAPTION_MAX_LENGTH
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
    editableNodeCount: number,
    magicTypes: MagicTypeConfig[]
): string[] {
    if (!Array.isArray(slots)) {
        return [
            `Invalid magic graph preset system node slots: ${presetId} -> ${circleId}`,
        ];
    }

    const errors: string[] = [];
    const expectedMagicTypes = new Set(
        CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS.map(config => config.magicType)
    );
    const actualMagicTypes = new Set<string>();

    slots.forEach(slot => {
        const systemNodeConfig = CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS.find(
            config => config.magicType === slot?.magicType
        );
        if (
            !slot ||
            typeof slot !== 'object' ||
            !isNonEmptyString(slot.magicType) ||
            !expectedMagicTypes.has(slot.magicType) ||
            actualMagicTypes.has(slot.magicType) ||
            !Number.isInteger(slot.slotIndex) ||
            slot.slotIndex < 0 ||
            slot.slotIndex > editableNodeCount ||
            (
                systemNodeConfig?.fixedAtSequenceEnd === true &&
                slot.slotIndex !== editableNodeCount
            )
        ) {
            errors.push(`Invalid magic graph preset system node slot: ${presetId} -> ${circleId}`);
            return;
        }

        actualMagicTypes.add(slot.magicType);
        errors.push(...validatePresetSettings(
            presetId,
            `${circleId}:${slot.magicType}`,
            slot.magicType,
            slot.settings,
            [...CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS, ...magicTypes]
        ));
    });

    if (
        slots.length !== expectedMagicTypes.size ||
        actualMagicTypes.size !== expectedMagicTypes.size
    ) {
        errors.push(`Missing magic graph preset system node slot: ${presetId} -> ${circleId}`);
    }

    return errors;
}

function isSafeMagicTypesForPresetValidation(
    value: unknown
): value is Record<string, unknown>[] {
    if (!isPlainObjectArray(value)) return false;

    return value.every(magicType => {
        const instanceEditor = magicType.instanceEditor;
        if (
            instanceEditor === undefined ||
            !isPlainObject(instanceEditor)
        ) {
            return true;
        }

        return instanceEditor.fields === undefined ||
            isPlainObjectArray(instanceEditor.fields);
    });
}

function validateLegacySystemNodePositions(
    preset: MagicGraphPresetConfig
): string[] {
    const legacyPositions = (
        preset as unknown as Record<string, unknown>
    ).systemNodePositions;

    return Array.isArray(legacyPositions) && legacyPositions.length > 0
        ? [`Unsupported magic graph preset system node positions: ${preset.id}`]
        : [];
}

function validatePresetNodes(
    preset: MagicGraphPresetConfig,
    magicTypes: MagicTypeConfig[]
): string[] {
    const errors = collectDuplicateErrors(
        preset.nodes.map(node => node.id),
        `magic graph preset node id: ${preset.id}`
    );

    preset.nodes.forEach(node => {
        if (!isNonEmptyString(node.id)) {
            errors.push(`Invalid magic graph preset node id: ${preset.id} -> ${node.id}`);
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
        errors.push(...validatePresetNodeSettings(
            preset.id,
            node,
            magicTypes
        ));
        if (
            node.controlPair !== undefined &&
            (
                !isPlainObject(node.controlPair) ||
                !isNonEmptyString(node.controlPair.id) ||
                (
                    node.controlPair.role !== MAGIC_CONTROL_PAIR_ROLES.START &&
                    node.controlPair.role !== MAGIC_CONTROL_PAIR_ROLES.END
                )
            )
        ) {
            errors.push(`Invalid magic graph preset control pair: ${preset.id} -> ${node.id}`);
        }
    });

    findNonContiguousMagicGraphSequenceCircleIds(
        preset.nodes,
        preset.circles.map(circle => circle.id)
    ).forEach(circleId => {
        errors.push(
            `Non-contiguous magic graph preset sequence: ${preset.id} -> ${circleId}`
        );
    });

    const pairAnalysis = analyzeMagicGraphControlPairs(preset.nodes);
    pairAnalysis.invalidNodeIds.forEach(nodeId => {
        errors.push(
            `Invalid magic graph preset paired node: ${preset.id} -> ${nodeId}`
        );
    });
    pairAnalysis.invalidPairIds.forEach(pairId => {
        errors.push(
            `Invalid magic graph preset pair structure: ${preset.id} -> ${pairId}`
        );
    });
    if (pairAnalysis.hasCrossedRepeatPairs) {
        errors.push(`Crossed magic graph preset repeat pairs: ${preset.id}`);
    }

    return errors;
}

function validatePresetNodeSettings(
    presetId: string,
    node: MagicGraphPresetConfig['nodes'][number],
    magicTypes: MagicTypeConfig[]
): string[] {
    return validatePresetSettings(
        presetId,
        node.id,
        node.magicType,
        node.settings,
        magicTypes
    );
}

function validatePresetSettings(
    presetId: string,
    subjectId: string,
    magicType: string,
    settings: unknown,
    magicTypes: readonly MagicTypeConfig[]
): string[] {
    if (settings === undefined) return [];
    if (!isPlainObject(settings)) {
        return [
            `Invalid magic graph preset node settings: ${presetId} -> ${subjectId}`,
        ];
    }

    const errors: string[] = [];
    const config = magicTypes.find(candidate =>
        candidate.type === magicType
    );
    const fieldByKey = new Map(
        getMagicNodeEditorFields(config).map(field => [field.key, field])
    );

    Object.entries(settings).forEach(([key, value]) => {
        const field = fieldByKey.get(key);
        if (!field) {
            errors.push(`Unknown magic graph preset node setting: ${presetId} -> ${subjectId} -> ${key}`);
            return;
        }
        if (!isNonEmptyString(value)) {
            errors.push(`Invalid magic graph preset node setting value: ${presetId} -> ${subjectId} -> ${key}`);
            return;
        }
        if (
            field.control === MAGIC_NODE_EDITOR_CONTROLS.TEXT &&
            field.maxLength !== undefined &&
            value.trim().length > field.maxLength
        ) {
            errors.push(`Magic graph preset node setting is too long: ${presetId} -> ${subjectId} -> ${key}`);
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
                errors.push(`Invalid magic graph preset stepper setting: ${presetId} -> ${subjectId} -> ${key}`);
            }
        }
    });

    return errors;
}

function validatePresetEdges(preset: MagicGraphPresetConfig): string[] {
    const errors = collectDuplicateErrors(
        preset.edges.map(edge => edge.id),
        `magic graph preset edge id: ${preset.id}`
    );
    const circleIds = new Set(preset.circles.map(circle => circle.id));

    preset.edges.forEach(edge => {
        if (!isNonEmptyString(edge.id)) {
            errors.push(`Invalid magic graph preset edge id: ${preset.id} -> ${edge.id}`);
        }
        if (!isMagicGraphExternalCircleEdge(edge, circleIds)) {
            errors.push(`Invalid magic graph preset external edge: ${preset.id} -> ${edge.id}`);
        } else if (!isMagicCirclePortHandleId(
            edge.sourceHandle,
            'output'
        )) {
            errors.push(`Invalid magic graph preset source handle: ${preset.id} -> ${edge.id} -> ${edge.sourceHandle}`);
        } else if (!isMagicCirclePortHandleId(
            edge.targetHandle,
            'input'
        )) {
            errors.push(`Invalid magic graph preset target handle: ${preset.id} -> ${edge.id} -> ${edge.targetHandle}`);
        } else if (
            !hasValidMagicGraphConnectionJoinSlots(
                [edge],
                preset.nodes
            )
        ) {
            errors.push(`Invalid magic graph preset join slot: ${preset.id} -> ${edge.id} -> ${edge.joinSlotIndex}`);
        }
    });
    if (
        !hasValidMagicGraphExternalFlow(
            preset.circles.map(circle => circle.id),
            preset.edges
        )
    ) {
        errors.push(`Invalid magic graph preset circle flow: ${preset.id}`);
    }

    return errors;
}

function validatePresetReferences(
    preset: MagicGraphPresetConfig,
    magicTypes: readonly MagicTypeConfig[]
): string[] {
    const errors: string[] = [];
    const magicTypeIds = new Set(magicTypes.map(config => config.type));
    const allowedNodeIds = new Set([
        ...preset.circles.map(circle => circle.id),
        ...preset.nodes.map(node => node.id),
    ]);

    preset.nodes.forEach(node => {
        if (node.magicType && !magicTypeIds.has(node.magicType)) {
            errors.push(`Unknown magic graph preset node type: ${preset.id} -> ${node.id} -> ${node.magicType}`);
        }
        if (!isMagicTypeAllowedInCircleSequence(node.magicType)) {
            errors.push(`Disabled magic graph preset node type: ${preset.id} -> ${node.id} -> ${node.magicType}`);
        }
        if (!preset.circles.some(circle => circle.id === node.circleId)) {
            errors.push(`Unknown magic graph preset node circle: ${preset.id} -> ${node.id} -> ${node.circleId}`);
        }
    });

    preset.edges.forEach(edge => {
        if (!allowedNodeIds.has(edge.source)) {
            errors.push(`Unknown magic graph preset edge source: ${preset.id} -> ${edge.id} -> ${edge.source}`);
        }
        if (!allowedNodeIds.has(edge.target)) {
            errors.push(`Unknown magic graph preset edge target: ${preset.id} -> ${edge.id} -> ${edge.target}`);
        }
    });

    return errors;
}
