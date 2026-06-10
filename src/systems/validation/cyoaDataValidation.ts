import type {
    CyoaChoiceRowConfig,
    CyoaDialogueScriptConfig,
    CyoaDialogueTextSegment,
    CyoaRowVisibilityCondition,
} from '../../types/cyoa';
import {
    CYOA_CHOICE_IMAGE_PLACEMENTS,
    CYOA_CHOICE_IMAGE_SIZES,
    CYOA_DIALOGUE_TEXT_VARIANTS,
    CYOA_SELECTION_MODES,
} from '../../constants/gameConfigs';
import { getCyoaDialogueLineText } from '../cyoa/cyoaDialogueText';
import {
    MAGIC_STAT_EFFECT_OPERATIONS,
    MAGIC_STAT_EFFECT_PHASES,
    MAGIC_STAT_KEYS,
} from '../../types/magic';
import { isValidCyoaChoiceWidth } from '../cyoa/cyoaChoiceLayout';
import { getCyoaDialogueOptionRowConfigs } from '../cyoa/cyoaDialogueScripts';
import { findDuplicates, result, success, type DataValidationResult } from './commonValidation';

const MAX_INPUT_REQUIRED_COUNT = 1;
const CYOA_SELECTION_MODE_VALUES = new Set<string>(Object.values(CYOA_SELECTION_MODES));
const CYOA_CHOICE_IMAGE_SIZE_VALUES = new Set<string>(Object.values(CYOA_CHOICE_IMAGE_SIZES));
const CYOA_CHOICE_IMAGE_PLACEMENT_VALUES = new Set<string>(Object.values(CYOA_CHOICE_IMAGE_PLACEMENTS));
const CYOA_DIALOGUE_TEXT_VARIANT_VALUES = new Set<string>(Object.values(CYOA_DIALOGUE_TEXT_VARIANTS));

function isValidCyoaSelectionMode(selectionMode: unknown): boolean {
    return typeof selectionMode === 'string' && CYOA_SELECTION_MODE_VALUES.has(selectionMode);
}

function isValidCyoaChoiceImageSize(imageSize: unknown): boolean {
    return typeof imageSize === 'string' && CYOA_CHOICE_IMAGE_SIZE_VALUES.has(imageSize);
}

function isValidCyoaChoiceImagePlacement(imagePlacement: unknown): boolean {
    return typeof imagePlacement === 'string' && CYOA_CHOICE_IMAGE_PLACEMENT_VALUES.has(imagePlacement);
}

function validateCyoaStatEffects(choiceId: string, statEffects: unknown): string[] {
    if (statEffects === undefined) return [];
    if (!Array.isArray(statEffects)) {
        return [`Invalid CYOA stat effects: ${choiceId}`];
    }

    const errors: string[] = [];
    const validPhases = new Set<string>(MAGIC_STAT_EFFECT_PHASES);
    const validOperations = new Set<string>(MAGIC_STAT_EFFECT_OPERATIONS);
    const validStatKeys = new Set<string>(MAGIC_STAT_KEYS);

    statEffects.forEach((effect, index) => {
        if (!effect || typeof effect !== 'object' || Array.isArray(effect)) {
            errors.push(`Invalid CYOA stat effect: ${choiceId} -> ${index}`);
            return;
        }

        const { phase, operation, stat, value } = effect as Record<string, unknown>;

        if (!validPhases.has(String(phase))) {
            errors.push(`Invalid CYOA stat effect phase: ${choiceId} -> ${index} -> ${String(phase)}`);
        }
        if (!validOperations.has(String(operation))) {
            errors.push(`Invalid CYOA stat effect operation: ${choiceId} -> ${index} -> ${String(operation)}`);
        }
        if (!validStatKeys.has(String(stat))) {
            errors.push(`Unknown CYOA stat effect key: ${choiceId} -> ${index} -> ${String(stat)}`);
            return;
        }
        if (!Number.isFinite(value)) {
            errors.push(`Invalid CYOA stat effect value: ${choiceId} -> ${index} -> ${String(stat)}`);
        }
    });

    return errors;
}

function getVisibilityConditionChoiceIds(condition?: CyoaRowVisibilityCondition): string[] {
    if (!condition) return [];

    return [
        ...(condition.choiceSelected ? [condition.choiceSelected] : []),
        ...(condition.anyChoiceSelected ?? []),
        ...(condition.allChoicesSelected ?? []),
    ];
}

function isCyoaDialogueTextSegment(segment: unknown): segment is CyoaDialogueTextSegment {
    return Boolean(segment) && typeof segment === 'object' && !Array.isArray(segment);
}

function validateCyoaDialogueLine(
    line: unknown,
    label: string,
    required: boolean
): string[] {
    const errors: string[] = [];

    if (typeof line === 'string') {
        if (required && !line.trim()) {
            errors.push(`Missing CYOA dialogue ${label}`);
        }

        return errors;
    }

    if (!Array.isArray(line)) {
        return [`Invalid CYOA dialogue line: ${label}`];
    }

    if (line.length === 0) {
        errors.push(`Invalid CYOA dialogue line segments: ${label}`);
    }

    line.forEach((segment, index) => {
        if (!isCyoaDialogueTextSegment(segment)) {
            errors.push(`Invalid CYOA dialogue line segment: ${label} -> ${index}`);
            return;
        }

        if (typeof segment.text !== 'string' || !segment.text.trim()) {
            errors.push(`Invalid CYOA dialogue line segment text: ${label} -> ${index}`);
        }

        if (
            segment.variant !== undefined
            && (typeof segment.variant !== 'string' || !CYOA_DIALOGUE_TEXT_VARIANT_VALUES.has(segment.variant))
        ) {
            errors.push(`Invalid CYOA dialogue line segment variant: ${label} -> ${index} -> ${String(segment.variant)}`);
        }
    });

    if (
        required
        && errors.length === 0
        && !getCyoaDialogueLineText(line).trim()
    ) {
        errors.push(`Missing CYOA dialogue ${label}`);
    }

    return errors;
}

export function validateCyoaRows(
    rows: CyoaChoiceRowConfig[],
    isKnownImagePath: (imagePath: string) => boolean
): DataValidationResult {
    if (rows.length === 0) return success();

    const errors: string[] = [];
    const rowIds = rows.map(row => row.id);
    const choiceIds = rows.flatMap(row => (row.choices ?? []).map(choice => choice.id));
    const choiceIdSet = new Set(choiceIds);
    const inputIds = rows.flatMap(row => row.input ? [row.input.id] : []);

    findDuplicates(rowIds).forEach(id => {
        errors.push(`Duplicate CYOA row id: ${id}`);
    });

    findDuplicates(choiceIds).forEach(id => {
        errors.push(`Duplicate CYOA choice id: ${id}`);
    });

    findDuplicates(inputIds).forEach(id => {
        errors.push(`Duplicate CYOA input id: ${id}`);
    });

    rows.forEach(row => {
        if (row.description !== undefined && typeof row.description !== 'string') {
            errors.push(`Invalid CYOA row description: ${row.id}`);
        }
        if (row.requiredCount !== undefined && (!Number.isInteger(row.requiredCount) || row.requiredCount < 0)) {
            errors.push(`Invalid CYOA required count: ${row.id} -> ${row.requiredCount}`);
        }
        if (row.selectionMode !== undefined && !isValidCyoaSelectionMode(row.selectionMode)) {
            errors.push(`Invalid CYOA selection mode: ${row.id} -> ${String(row.selectionMode)}`);
        }
        if (row.input && (row.choices?.length ?? 0) > 0) {
            errors.push(`CYOA row cannot mix input and choices: ${row.id}`);
        }
        if (row.input && (row.requiredCount ?? 0) > MAX_INPUT_REQUIRED_COUNT) {
            errors.push(`Invalid CYOA input required count: ${row.id} -> ${row.requiredCount}`);
        }
        if (!row.input && row.requiredCount !== undefined && row.requiredCount > (row.choices?.length ?? 0)) {
            errors.push(`CYOA required count exceeds choices: ${row.id} -> ${row.requiredCount}`);
        }
        if (row.visibleWhen?.choiceSelected && !choiceIdSet.has(row.visibleWhen.choiceSelected)) {
            errors.push(`Unknown CYOA visibleWhen choice: ${row.id} -> ${row.visibleWhen.choiceSelected}`);
        }
        row.visibleWhen?.anyChoiceSelected?.forEach(choiceId => {
            if (!choiceIdSet.has(choiceId)) {
                errors.push(`Unknown CYOA visibleWhen any choice: ${row.id} -> ${choiceId}`);
            }
        });
        row.visibleWhen?.allChoicesSelected?.forEach(choiceId => {
            if (!choiceIdSet.has(choiceId)) {
                errors.push(`Unknown CYOA visibleWhen all choice: ${row.id} -> ${choiceId}`);
            }
        });

        (row.choices ?? []).forEach(choice => {
            if (choice.imagePath && !isKnownImagePath(choice.imagePath)) {
                errors.push(`Unknown CYOA image path: ${choice.id} -> ${choice.imagePath}`);
            }
            if (choice.imageSize !== undefined && !isValidCyoaChoiceImageSize(choice.imageSize)) {
                errors.push(`Invalid CYOA choice image size: ${choice.id} -> ${String(choice.imageSize)}`);
            }
            if (choice.imagePlacement !== undefined && !isValidCyoaChoiceImagePlacement(choice.imagePlacement)) {
                errors.push(`Invalid CYOA choice image placement: ${choice.id} -> ${String(choice.imagePlacement)}`);
            }
            if (choice.description !== undefined && typeof choice.description !== 'string') {
                errors.push(`Invalid CYOA choice description: ${choice.id}`);
            }
            if (choice.tooltip !== undefined && typeof choice.tooltip !== 'string') {
                errors.push(`Invalid CYOA choice tooltip: ${choice.id}`);
            }
            if (choice.width && !isValidCyoaChoiceWidth(choice.width)) {
                errors.push(`Invalid CYOA choice width: ${choice.id} -> ${choice.width}`);
            }
            errors.push(...validateCyoaStatEffects(choice.id, choice.statEffects));
        });
    });

    return result(errors);
}

export function validateCyoaDialogueScripts(
    scripts: CyoaDialogueScriptConfig[],
    isKnownImagePath: (imagePath: string) => boolean
): DataValidationResult {
    if (scripts.length === 0) return success();

    const errors: string[] = [];
    const scriptIds = scripts.map(script => script.id);

    findDuplicates(scriptIds).forEach(id => {
        errors.push(`Duplicate CYOA dialogue script id: ${id}`);
    });

    scripts.forEach(script => {
        if (script.imagePath && !isKnownImagePath(script.imagePath)) {
            errors.push(`Unknown CYOA dialogue image path: ${script.id} -> ${script.imagePath}`);
        }

        const optionRows = getCyoaDialogueOptionRowConfigs(script);
        const rowIds = optionRows.map(row => row.id);
        const options = optionRows.flatMap(row => row.options);
        const optionIds = options.map(option => option.id);
        const optionIdSet = new Set(optionIds);
        const parentOptionIds = new Set(
            optionRows.flatMap(row => getVisibilityConditionChoiceIds(row.visibleWhen))
        );

        findDuplicates(rowIds).forEach(id => {
            errors.push(`Duplicate CYOA dialogue option row id: ${script.id} -> ${id}`);
        });

        findDuplicates(optionIds).forEach(id => {
            errors.push(`Duplicate CYOA dialogue option id: ${script.id} -> ${id}`);
        });

        errors.push(...validateCyoaDialogueLine(
            script.defaultNpcLine,
            `default NPC line: ${script.id}`,
            true
        ));

        optionRows.forEach(row => {
            if (row.selectionMode !== undefined && !isValidCyoaSelectionMode(row.selectionMode)) {
                errors.push(`Invalid CYOA dialogue selection mode: ${script.id} -> ${row.id} -> ${String(row.selectionMode)}`);
            }

            getVisibilityConditionChoiceIds(row.visibleWhen).forEach(choiceId => {
                if (!optionIdSet.has(choiceId)) {
                    errors.push(`Unknown CYOA dialogue visibleWhen choice: ${script.id} -> ${row.id} -> ${choiceId}`);
                }
            });
        });

        options.forEach(option => {
            if (!option.playerLine.trim()) {
                errors.push(`Missing CYOA dialogue player line: ${script.id} -> ${option.id}`);
            }
            errors.push(...validateCyoaDialogueLine(
                option.npcLine,
                `NPC line: ${script.id} -> ${option.id}`,
                !parentOptionIds.has(option.id)
            ));
            if (option.npcImagePath && !isKnownImagePath(option.npcImagePath)) {
                errors.push(`Unknown CYOA dialogue option image path: ${script.id} -> ${option.id} -> ${option.npcImagePath}`);
            }
            if (option.npcImageAlt !== undefined && typeof option.npcImageAlt !== 'string') {
                errors.push(`Invalid CYOA dialogue option image alt: ${script.id} -> ${option.id}`);
            }
        });
    });

    return result(errors);
}
