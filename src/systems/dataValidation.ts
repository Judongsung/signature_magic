import type { CyoaAction, MagicNodeCategory } from '../constants/gameConfigs';
import type { CyoaChoiceRowConfig } from '../types/cyoa';
import type { MagicTypeConfig } from '../types/magic';

export interface DataValidationResult {
    valid: boolean;
    errors: string[];
}

function success(): DataValidationResult {
    return { valid: true, errors: [] };
}

function result(errors: string[]): DataValidationResult {
    return { valid: errors.length === 0, errors };
}

function findDuplicates(values: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    values.forEach(value => {
        if (seen.has(value)) duplicates.add(value);
        seen.add(value);
    });

    return [...duplicates];
}

function isValidChoiceWidth(width: string): boolean {
    const match = width.match(/^(\d+)\/(\d+)$/);
    if (!match) return false;

    const numerator = Number(match[1]);
    const denominator = Number(match[2]);
    return numerator > 0 && denominator > 0 && numerator <= denominator;
}

export function validateMagicTypes(
    magicTypes: MagicTypeConfig[],
    categories: readonly { id: MagicNodeCategory }[]
): DataValidationResult {
    const errors: string[] = [];
    const categoryIds = new Set(categories.map(category => category.id));
    const duplicateTypes = findDuplicates(magicTypes.map(magicType => magicType.type));

    duplicateTypes.forEach(type => {
        errors.push(`Duplicate magic type id: ${type}`);
    });

    magicTypes.forEach(magicType => {
        if (!categoryIds.has(magicType.category)) {
            errors.push(`Unknown magic type category: ${magicType.type} -> ${magicType.category}`);
        }
        if (!magicType.description.trim()) {
            errors.push(`Missing magic type description: ${magicType.type}`);
        }
    });

    return result(errors);
}

export function validateCyoaRows(
    rows: CyoaChoiceRowConfig[],
    actions: Record<string, CyoaAction>,
    isKnownImagePath: (imagePath: string) => boolean
): DataValidationResult {
    if (rows.length === 0) return success();

    const errors: string[] = [];
    const rowIds = rows.map(row => row.id);
    const rowIdSet = new Set(rowIds);
    const actionSet = new Set(Object.values(actions));
    const choiceIds = rows.flatMap(row => (row.choices ?? []).map(choice => choice.id));
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
        if (row.requiredMode && !['always', 'visible', 'never'].includes(row.requiredMode)) {
            errors.push(`Unknown CYOA required mode: ${row.id} -> ${row.requiredMode}`);
        }
        if (row.input && (row.choices?.length ?? 0) > 0) {
            errors.push(`CYOA row cannot mix input and choices: ${row.id}`);
        }

        (row.choices ?? []).forEach(choice => {
            if (choice.imagePath && !isKnownImagePath(choice.imagePath)) {
                errors.push(`Unknown CYOA image path: ${choice.id} -> ${choice.imagePath}`);
            }
            if (choice.width && !isValidChoiceWidth(choice.width)) {
                errors.push(`Invalid CYOA choice width: ${choice.id} -> ${choice.width}`);
            }

            choice.actions?.forEach(action => {
                if (!actionSet.has(action.func)) {
                    errors.push(`Unknown CYOA action: ${choice.id} -> ${action.func}`);
                }
                if (action.target_id && !rowIdSet.has(action.target_id)) {
                    errors.push(`Unknown CYOA action target: ${choice.id} -> ${action.target_id}`);
                }
            });
        });
    });

    return result(errors);
}
