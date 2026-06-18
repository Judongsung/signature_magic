import type { CyoaChoiceRowConfig } from '../../types/cyoa';
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

    errors.push(...collectDuplicateErrors(rowIds, 'CYOA row id'));
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
        });
    });

    return result(errors);
}
