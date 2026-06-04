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
}

interface BuildCyoaRegistrationSummaryOptions {
    rows: readonly CyoaChoiceRowData[];
    visibleRowIds: RowVisibility;
    selectedChoiceIds: RowSelections;
    inputValues: InputValues;
    excludedRowIds?: ReadonlySet<string>;
}

const DEFAULT_EXCLUDED_ROW_IDS = new Set(['toc']);

export function isCyoaRegistrationRequiredRow(row: CyoaChoiceRowData): boolean {
    return row.selectable && row.requiredCount > 0;
}

function isSummaryRow(
    row: CyoaChoiceRowData,
    visibleRowIds: RowVisibility,
    excludedRowIds: ReadonlySet<string>
): boolean {
    return !excludedRowIds.has(row.id) &&
        (visibleRowIds[row.id] || isCyoaRegistrationRequiredRow(row));
}

export function buildCyoaRegistrationSummary({
    rows,
    visibleRowIds,
    selectedChoiceIds,
    inputValues,
    excludedRowIds = DEFAULT_EXCLUDED_ROW_IDS,
}: BuildCyoaRegistrationSummaryOptions): CyoaRegistrationSummaryModel {
    const summaryRows = rows.filter(row => isSummaryRow(row, visibleRowIds, excludedRowIds));

    return {
        inputItems: summaryRows.flatMap(row => {
            if (!row.input) return [];

            const value = inputValues[row.input.id]?.trim() ?? '';

            return [{
                id: row.input.id,
                label: row.input.label,
                value,
                requiredMissing: isCyoaRegistrationRequiredRow(row) && value.length === 0,
            }];
        }),
        choiceItems: summaryRows.flatMap(row => {
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
        }),
    };
}
