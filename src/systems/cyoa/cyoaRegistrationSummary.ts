import type { CyoaChoice, CyoaChoiceRowData } from '../../types/cyoa';

export type RowVisibility = Record<string, boolean>;
export type RowSelections = Record<string, string[]>;
export type InputValues = Record<string, string>;

export interface CyoaRegistrationSummaryInputItem {
    id: string;
    label: string;
    value: string;
    requiredMissing: boolean;
}

export interface CyoaRegistrationSummaryChoiceItem {
    id: string;
    title: string;
    choices: CyoaChoice[];
    requiredMissing: boolean;
}

export interface CyoaRegistrationSummaryModel {
    inputItems: CyoaRegistrationSummaryInputItem[];
    choiceItems: CyoaRegistrationSummaryChoiceItem[];
    signatureName: string;
}

interface BuildCyoaRegistrationSummaryOptions {
    rows: readonly CyoaChoiceRowData[];
    visibleRowIds: RowVisibility;
    selectedChoiceIds: RowSelections;
    inputValues: InputValues;
}

const SIGNATURE_INPUT_ID_PARTS = ['name'];

export function isCyoaRegistrationRequiredRow(row: CyoaChoiceRowData): boolean {
    return row.selectable && row.requiredCount > 0;
}

function isSummaryRow(
    row: CyoaChoiceRowData,
    visibleRowIds: RowVisibility
): boolean {
    return visibleRowIds[row.id] || isCyoaRegistrationRequiredRow(row);
}

export function buildCyoaRegistrationSummary({
    rows,
    visibleRowIds,
    selectedChoiceIds,
    inputValues,
}: BuildCyoaRegistrationSummaryOptions): CyoaRegistrationSummaryModel {
    const summaryRows = rows.filter(row => isSummaryRow(row, visibleRowIds));
    const inputItems = summaryRows.flatMap(row => {
        if (!row.input) return [];

        const value = inputValues[row.input.id]?.trim() ?? '';

        return [{
            id: row.input.id,
            label: row.input.label,
            value,
            requiredMissing: isCyoaRegistrationRequiredRow(row) && value.length === 0,
        }];
    });
    const choiceItems = summaryRows.flatMap(row => {
        if (row.input) return [];

        const selectedIds = selectedChoiceIds[row.id] ?? [];
        const selectedChoices = row.choices.filter(choice => selectedIds.includes(choice.id));

        return [{
            id: row.id,
            title: row.title,
            choices: selectedChoices,
            requiredMissing: isCyoaRegistrationRequiredRow(row) &&
                selectedChoices.length < row.requiredCount,
        }];
    });
    const signatureName = inputItems.find(item =>
        SIGNATURE_INPUT_ID_PARTS.some(idPart => item.id.toLowerCase().includes(idPart))
    )?.value ?? '';

    return {
        inputItems,
        choiceItems,
        signatureName,
    };
}
