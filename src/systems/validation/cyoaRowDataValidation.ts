import type {
    CyoaChoiceBaseConfig,
    CyoaChoiceRowConfig,
    CyoaSubChoiceGroupConfig,
} from '../../types/cyoa';
import { CYOA_SELECTION_MODES } from '../../constants/gameConfigs';
import {
    MAGIC_STAT_EFFECT_OPERATIONS,
    MAGIC_STAT_EFFECT_PHASES,
    MAGIC_STAT_KEYS,
} from '../../types/magic';
import { isValidCyoaChoiceWidth } from '../cyoa/cyoaChoiceLayout';
import {
    collectDuplicateErrors,
    formatValidationError,
    formatValidationPath,
    isFiniteNumber,
    isPlainObject,
    result,
    success,
    type DataValidationResult,
} from './commonValidation';
import {
    isValidCyoaChoiceImagePlacement,
    isValidCyoaChoiceImageSize,
    isValidCyoaSelectionMode,
} from './cyoaValidationShared';

const MAX_INPUT_REQUIRED_COUNT = 1;
const DEFAULT_REQUIRED_COUNT = 1;

function getCyoaSubChoiceGroup(
    choice: CyoaChoiceBaseConfig
): CyoaSubChoiceGroupConfig | undefined {
    const group = (choice as CyoaChoiceBaseConfig & { subChoiceGroup?: unknown }).subChoiceGroup;
    return isPlainObject(group) ? group as unknown as CyoaSubChoiceGroupConfig : undefined;
}

function getCyoaSubChoices(group?: CyoaSubChoiceGroupConfig): CyoaChoiceBaseConfig[] {
    if (!group || !Array.isArray(group.choices)) return [];
    return group.choices.filter(isPlainObject) as unknown as CyoaChoiceBaseConfig[];
}

function validateCyoaStatEffects(choiceId: string, statEffects: unknown): string[] {
    if (statEffects === undefined) return [];
    if (!Array.isArray(statEffects)) {
        return [formatValidationError('Invalid', 'CYOA stat effects', choiceId)];
    }

    const errors: string[] = [];
    const validPhases = new Set<string>(MAGIC_STAT_EFFECT_PHASES);
    const validOperations = new Set<string>(MAGIC_STAT_EFFECT_OPERATIONS);
    const validStatKeys = new Set<string>(MAGIC_STAT_KEYS);

    statEffects.forEach((effect, index) => {
        if (!isPlainObject(effect)) {
            errors.push(formatValidationError('Invalid', 'CYOA stat effect', choiceId, index));
            return;
        }

        const { phase, operation, stat, value } = effect;

        if (!validPhases.has(String(phase))) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA stat effect phase',
                choiceId,
                index,
                String(phase)
            ));
        }
        if (!validOperations.has(String(operation))) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA stat effect operation',
                choiceId,
                index,
                String(operation)
            ));
        }
        if (!validStatKeys.has(String(stat))) {
            errors.push(formatValidationError(
                'Unknown',
                'CYOA stat effect key',
                choiceId,
                index,
                String(stat)
            ));
            return;
        }
        if (!isFiniteNumber(value)) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA stat effect value',
                choiceId,
                index,
                String(stat)
            ));
        }
    });

    return errors;
}

function validateCyoaChoice(
    choice: CyoaChoiceBaseConfig,
    isKnownImagePath: (imagePath: string) => boolean
): string[] {
    const errors: string[] = [];

    if (choice.imagePath && !isKnownImagePath(choice.imagePath)) {
        errors.push(formatValidationError(
            'Unknown',
            'CYOA image path',
            choice.id,
            choice.imagePath
        ));
    }
    if (choice.imageSize !== undefined && !isValidCyoaChoiceImageSize(choice.imageSize)) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA choice image size',
            choice.id,
            String(choice.imageSize)
        ));
    }
    if (choice.imagePlacement !== undefined && !isValidCyoaChoiceImagePlacement(choice.imagePlacement)) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA choice image placement',
            choice.id,
            String(choice.imagePlacement)
        ));
    }
    if (choice.description !== undefined && typeof choice.description !== 'string') {
        errors.push(formatValidationError('Invalid', 'CYOA choice description', choice.id));
    }
    if (choice.tooltip !== undefined && typeof choice.tooltip !== 'string') {
        errors.push(formatValidationError('Invalid', 'CYOA choice tooltip', choice.id));
    }
    if (choice.width && !isValidCyoaChoiceWidth(choice.width)) {
        errors.push(formatValidationError('Invalid', 'CYOA choice width', choice.id, choice.width));
    }
    errors.push(...validateCyoaStatEffects(choice.id, choice.statEffects));

    return errors;
}

function validateCyoaSubChoiceGroup(
    group: CyoaSubChoiceGroupConfig,
    isKnownImagePath: (imagePath: string) => boolean
): string[] {
    const errors: string[] = [];
    const requiredCount = group.requiredCount ?? DEFAULT_REQUIRED_COUNT;
    const selectionMode = group.selectionMode ?? CYOA_SELECTION_MODES.SINGLE;
    const rawChoices: unknown[] = Array.isArray(group.choices) ? group.choices : [];

    if (typeof group.title !== 'string' || group.title.trim().length === 0) {
        errors.push(formatValidationError('Invalid', 'CYOA sub-choice group title', group.id));
    }
    if (!Number.isInteger(requiredCount) || requiredCount < 0) {
        errors.push(formatValidationError('Invalid', 'CYOA sub-choice required count', group.id, requiredCount));
    }
    if (!isValidCyoaSelectionMode(selectionMode)) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA sub-choice selection mode',
            group.id,
            String(selectionMode)
        ));
    }
    if (!Array.isArray(group.choices)) {
        errors.push(formatValidationError('Invalid', 'CYOA sub-choice choices', group.id));
    }
    if (requiredCount > rawChoices.length) {
        errors.push(`CYOA sub-choice required count exceeds choices: ${formatValidationPath(group.id, requiredCount)}`);
    }
    if (selectionMode === CYOA_SELECTION_MODES.SINGLE && requiredCount > MAX_INPUT_REQUIRED_COUNT) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA single-select sub-choice required count',
            group.id,
            requiredCount
        ));
    }

    rawChoices.forEach((rawChoice, index) => {
        if (!isPlainObject(rawChoice)) {
            errors.push(formatValidationError('Invalid', 'CYOA sub-choice', group.id, index));
            return;
        }

        const choice = rawChoice as unknown as CyoaChoiceBaseConfig;
        errors.push(...validateCyoaChoice(choice, isKnownImagePath));

        if ('subChoiceGroup' in choice && choice.subChoiceGroup !== undefined) {
            errors.push(formatValidationError('Invalid', 'nested CYOA sub-choice group', choice.id));
        }
    });

    return errors;
}

export function validateCyoaRows(
    rows: CyoaChoiceRowConfig[],
    isKnownImagePath: (imagePath: string) => boolean
): DataValidationResult {
    if (rows.length === 0) return success();

    const errors: string[] = [];
    const rowIds = rows.map(row => row.id);
    const subChoiceGroups = rows.flatMap(row =>
        (row.choices ?? []).flatMap(choice => {
            const group = getCyoaSubChoiceGroup(choice);
            return group ? [group] : [];
        })
    );
    const subChoiceGroupIds = subChoiceGroups.map(group => group.id);
    const choiceIds = rows.flatMap(row => (row.choices ?? []).flatMap(choice => [
        choice.id,
        ...getCyoaSubChoices(getCyoaSubChoiceGroup(choice)).map(subChoice => subChoice.id),
    ]));
    const choiceIdSet = new Set(choiceIds);
    const inputIds = rows.flatMap(row => row.input ? [row.input.id] : []);

    errors.push(...collectDuplicateErrors(rowIds, 'CYOA row id'));
    errors.push(...collectDuplicateErrors(subChoiceGroupIds, 'CYOA sub-choice group id'));
    [...new Set(subChoiceGroupIds.filter(groupId => rowIds.includes(groupId)))].forEach(groupId => {
        errors.push(formatValidationError('Duplicate', 'CYOA selection group id', groupId));
    });
    errors.push(...collectDuplicateErrors(choiceIds, 'CYOA choice id'));
    errors.push(...collectDuplicateErrors(inputIds, 'CYOA input id'));

    rows.forEach(row => {
        if (row.description !== undefined && typeof row.description !== 'string') {
            errors.push(formatValidationError('Invalid', 'CYOA row description', row.id));
        }
        if (row.requiredCount !== undefined && (!Number.isInteger(row.requiredCount) || row.requiredCount < 0)) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA required count',
                row.id,
                row.requiredCount
            ));
        }
        if (row.selectionMode !== undefined && !isValidCyoaSelectionMode(row.selectionMode)) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA selection mode',
                row.id,
                String(row.selectionMode)
            ));
        }
        if (row.input && (row.choices?.length ?? 0) > 0) {
            errors.push(`CYOA row cannot mix input and choices: ${row.id}`);
        }
        if (row.input && (row.requiredCount ?? 0) > MAX_INPUT_REQUIRED_COUNT) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA input required count',
                row.id,
                row.requiredCount ?? 0
            ));
        }
        if (!row.input && row.requiredCount !== undefined && row.requiredCount > (row.choices?.length ?? 0)) {
            errors.push(`CYOA required count exceeds choices: ${formatValidationPath(row.id, row.requiredCount)}`);
        }
        if (row.visibleWhen?.choiceSelected && !choiceIdSet.has(row.visibleWhen.choiceSelected)) {
            errors.push(formatValidationError(
                'Unknown',
                'CYOA visibleWhen choice',
                row.id,
                row.visibleWhen.choiceSelected
            ));
        }
        row.visibleWhen?.anyChoiceSelected?.forEach(choiceId => {
            if (!choiceIdSet.has(choiceId)) {
                errors.push(formatValidationError(
                    'Unknown',
                    'CYOA visibleWhen any choice',
                    row.id,
                    choiceId
                ));
            }
        });
        row.visibleWhen?.allChoicesSelected?.forEach(choiceId => {
            if (!choiceIdSet.has(choiceId)) {
                errors.push(formatValidationError(
                    'Unknown',
                    'CYOA visibleWhen all choice',
                    row.id,
                    choiceId
                ));
            }
        });

        (row.choices ?? []).forEach(choice => {
            errors.push(...validateCyoaChoice(choice, isKnownImagePath));
            const rawSubChoiceGroup = (choice as typeof choice & { subChoiceGroup?: unknown }).subChoiceGroup;
            const subChoiceGroup = getCyoaSubChoiceGroup(choice);
            if (rawSubChoiceGroup !== undefined && !subChoiceGroup) {
                errors.push(formatValidationError('Invalid', 'CYOA sub-choice group', choice.id));
            } else if (subChoiceGroup) {
                errors.push(...validateCyoaSubChoiceGroup(subChoiceGroup, isKnownImagePath));
            }
        });
    });

    return result(errors);
}
