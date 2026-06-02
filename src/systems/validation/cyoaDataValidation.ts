import type { CyoaChoiceRowConfig, CyoaDialogueScriptConfig } from '../../types/cyoa';
import { findDuplicates, result, success, type DataValidationResult } from './commonValidation';

const MAX_INPUT_REQUIRED_COUNT = 1;

function isValidChoiceWidth(width: string): boolean {
    const match = width.match(/^(\d+)\/(\d+)$/);
    if (!match) return false;

    const numerator = Number(match[1]);
    const denominator = Number(match[2]);
    return numerator > 0 && denominator > 0 && numerator <= denominator;
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
        if (row.requiredCount !== undefined && (!Number.isInteger(row.requiredCount) || row.requiredCount < 0)) {
            errors.push(`Invalid CYOA required count: ${row.id} -> ${row.requiredCount}`);
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
            if (choice.description !== undefined && typeof choice.description !== 'string') {
                errors.push(`Invalid CYOA choice description: ${choice.id}`);
            }
            if (choice.tooltip !== undefined && typeof choice.tooltip !== 'string') {
                errors.push(`Invalid CYOA choice tooltip: ${choice.id}`);
            }
            if (choice.width && !isValidChoiceWidth(choice.width)) {
                errors.push(`Invalid CYOA choice width: ${choice.id} -> ${choice.width}`);
            }
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

        const optionIds = script.options.map(option => option.id);

        findDuplicates(optionIds).forEach(id => {
            errors.push(`Duplicate CYOA dialogue option id: ${script.id} -> ${id}`);
        });

        if (!script.defaultNpcLine.trim()) {
            errors.push(`Missing CYOA dialogue default NPC line: ${script.id}`);
        }

        script.options.forEach(option => {
            if (!option.playerLine.trim()) {
                errors.push(`Missing CYOA dialogue player line: ${script.id} -> ${option.id}`);
            }
            if (!option.npcLine.trim()) {
                errors.push(`Missing CYOA dialogue NPC line: ${script.id} -> ${option.id}`);
            }
        });
    });

    return result(errors);
}
