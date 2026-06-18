import type {
    CyoaDialogueResultCondition,
    CyoaDialogueScriptConfig,
    CyoaDialogueTextSegment,
} from '../../types/cyoa';
import { MAGIC_STAT_KEYS } from '../../types/magic';
import { getCyoaDialogueLineText } from '../cyoa/cyoaDialogueText';
import { getCyoaDialogueOptionRowConfigs } from '../cyoa/cyoaDialogueScripts';
import {
    collectDuplicateErrors,
    formatValidationError,
    isFiniteNumber,
    isPlainObject,
    result,
    success,
    type DataValidationResult,
} from './commonValidation';
import {
    getVisibilityConditionChoiceIds,
    isValidCyoaDialogueTextVariant,
    isValidCyoaSelectionMode,
} from './cyoaValidationShared';

function validateCyoaDialogueNumericRange(
    range: unknown,
    label: string
): string[] {
    if (!isPlainObject(range)) {
        return [formatValidationError('Invalid', 'CYOA dialogue result condition range', label)];
    }

    const { min, max } = range;
    const errors: string[] = [];
    const hasMin = min !== undefined;
    const hasMax = max !== undefined;

    if (!hasMin && !hasMax) {
        errors.push(formatValidationError('Empty', 'CYOA dialogue result condition range', label));
    }

    if (hasMin && !isFiniteNumber(min)) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA dialogue result condition min',
            label,
            String(min)
        ));
    }
    if (hasMax && !isFiniteNumber(max)) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA dialogue result condition max',
            label,
            String(max)
        ));
    }
    if (
        isFiniteNumber(min)
        && isFiniteNumber(max)
        && max < min
    ) {
        errors.push(formatValidationError('Invalid', 'CYOA dialogue result condition range order', label));
    }

    return errors;
}

function validateCyoaDialogueResultCondition(
    condition: unknown,
    label: string
): string[] {
    if (!isPlainObject(condition)) {
        return [formatValidationError('Invalid', 'CYOA dialogue result condition', label)];
    }

    const resultCondition = condition as CyoaDialogueResultCondition;
    const errors: string[] = [];
    let hasCondition = false;

    Object.keys(condition).forEach(key => {
        if (key !== 'circleCount' && key !== 'totalStats') {
            errors.push(formatValidationError(
                'Unknown',
                'CYOA dialogue result condition key',
                label,
                key
            ));
        }
    });

    if (resultCondition.circleCount !== undefined) {
        hasCondition = true;
        errors.push(...validateCyoaDialogueNumericRange(
            resultCondition.circleCount,
            `${label} -> circleCount`
        ));
    }

    if (resultCondition.totalStats !== undefined) {
        if (!isPlainObject(resultCondition.totalStats)) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA dialogue result condition totalStats',
                label
            ));
        } else {
            Object.entries(resultCondition.totalStats).forEach(([statKey, range]) => {
                hasCondition = true;
                if (!MAGIC_STAT_KEYS.includes(statKey as typeof MAGIC_STAT_KEYS[number])) {
                    errors.push(formatValidationError(
                        'Unknown',
                        'CYOA dialogue result condition stat',
                        label,
                        statKey
                    ));
                    return;
                }

                errors.push(...validateCyoaDialogueNumericRange(
                    range,
                    `${label} -> totalStats.${statKey}`
                ));
            });
        }
    }

    if (!hasCondition) {
        errors.push(formatValidationError('Empty', 'CYOA dialogue result condition', label));
    }

    return errors;
}

function isCyoaDialogueTextSegment(segment: unknown): segment is CyoaDialogueTextSegment {
    return isPlainObject(segment);
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
        return [formatValidationError('Invalid', 'CYOA dialogue line', label)];
    }

    if (line.length === 0) {
        errors.push(formatValidationError('Invalid', 'CYOA dialogue line segments', label));
    }

    line.forEach((segment, index) => {
        if (!isCyoaDialogueTextSegment(segment)) {
            errors.push(formatValidationError('Invalid', 'CYOA dialogue line segment', label, index));
            return;
        }

        if (typeof segment.text !== 'string' || !segment.text.trim()) {
            errors.push(formatValidationError('Invalid', 'CYOA dialogue line segment text', label, index));
        }

        if (
            segment.variant !== undefined
            && !isValidCyoaDialogueTextVariant(segment.variant)
        ) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA dialogue line segment variant',
                label,
                index,
                String(segment.variant)
            ));
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

export function validateCyoaDialogueScripts(
    scripts: CyoaDialogueScriptConfig[],
    isKnownImagePath: (imagePath: string) => boolean
): DataValidationResult {
    if (scripts.length === 0) return success();

    const errors: string[] = [];
    const scriptIds = scripts.map(script => script.id);

    errors.push(...collectDuplicateErrors(scriptIds, 'CYOA dialogue script id'));

    scripts.forEach(script => {
        if (script.imagePath && !isKnownImagePath(script.imagePath)) {
            errors.push(formatValidationError(
                'Unknown',
                'CYOA dialogue image path',
                script.id,
                script.imagePath
            ));
        }

        const optionRows = getCyoaDialogueOptionRowConfigs(script);
        const rowIds = optionRows.map(row => row.id);
        const dialogueOptions = optionRows.flatMap(row => row.options);
        const optionIds = dialogueOptions.map(option => option.id);
        const optionIdSet = new Set(optionIds);
        const parentOptionIds = new Set(
            optionRows.flatMap(row => getVisibilityConditionChoiceIds(row.visibleWhen))
        );

        collectDuplicateErrors(rowIds, 'CYOA dialogue option row id').forEach(error => {
            errors.push(error.replace(': ', `: ${script.id} -> `));
        });

        collectDuplicateErrors(optionIds, 'CYOA dialogue option id').forEach(error => {
            errors.push(error.replace(': ', `: ${script.id} -> `));
        });

        errors.push(...validateCyoaDialogueLine(
            script.defaultNpcLine,
            `default NPC line: ${script.id}`,
            true
        ));

        script.resultLines?.forEach((resultLine, index) => {
            errors.push(...validateCyoaDialogueResultCondition(
                resultLine?.when,
                `${script.id} -> resultLines[${index}]`
            ));
            errors.push(...validateCyoaDialogueLine(
                resultLine?.npcLine,
                `result NPC line: ${script.id} -> ${index}`,
                true
            ));
        });

        optionRows.forEach(row => {
            if (row.selectionMode !== undefined && !isValidCyoaSelectionMode(row.selectionMode)) {
                errors.push(formatValidationError(
                    'Invalid',
                    'CYOA dialogue selection mode',
                    script.id,
                    row.id,
                    String(row.selectionMode)
                ));
            }

            if (row.resultWhen !== undefined) {
                errors.push(...validateCyoaDialogueResultCondition(
                    row.resultWhen,
                    `${script.id} -> ${row.id}`
                ));
            }

            getVisibilityConditionChoiceIds(row.visibleWhen).forEach(choiceId => {
                if (!optionIdSet.has(choiceId)) {
                    errors.push(formatValidationError(
                        'Unknown',
                        'CYOA dialogue visibleWhen choice',
                        script.id,
                        row.id,
                        choiceId
                    ));
                }
            });
        });

        dialogueOptions.forEach(option => {
            if (!option.playerLine.trim()) {
                errors.push(formatValidationError(
                    'Missing',
                    'CYOA dialogue player line',
                    script.id,
                    option.id
                ));
            }
            errors.push(...validateCyoaDialogueLine(
                option.npcLine,
                `NPC line: ${script.id} -> ${option.id}`,
                !parentOptionIds.has(option.id)
            ));
            if (option.npcImagePath && !isKnownImagePath(option.npcImagePath)) {
                errors.push(formatValidationError(
                    'Unknown',
                    'CYOA dialogue option image path',
                    script.id,
                    option.id,
                    option.npcImagePath
                ));
            }
            if (option.npcImageAlt !== undefined && typeof option.npcImageAlt !== 'string') {
                errors.push(formatValidationError(
                    'Invalid',
                    'CYOA dialogue option image alt',
                    script.id,
                    option.id
                ));
            }
        });
    });

    return result(errors);
}
