import type {
    CyoaChoiceRowData,
    CyoaInputValues,
    CyoaRowSelections,
    CyoaRowVisibility,
} from '../../types/cyoa';
import { CYOA_INPUT_ROLES } from '../../constants/gameConfigs';

export interface CyoaRegistrationSummaryInputItem {
    id: string;
    label: string;
    value: string;
    requiredMissing: boolean;
}

export interface CyoaRegistrationSummaryChoicePath {
    id: string;
    titles: string[];
    requiredMissing: boolean;
}

export interface CyoaRegistrationSummaryChoiceItem {
    id: string;
    title: string;
    selections: CyoaRegistrationSummaryChoicePath[];
    requiredMissing: boolean;
}

export interface CyoaRegistrationSummaryModel {
    inputItems: CyoaRegistrationSummaryInputItem[];
    choiceItems: CyoaRegistrationSummaryChoiceItem[];
    signatureName: string;
}

interface BuildCyoaRegistrationSummaryOptions {
    rows: readonly CyoaChoiceRowData[];
    visibleRowIds: CyoaRowVisibility;
    selectedChoiceIds: CyoaRowSelections;
    inputValues: CyoaInputValues;
}

export function isCyoaRegistrationRequiredRow(row: CyoaChoiceRowData): boolean {
    return row.selectable && row.requiredCount > 0;
}

function isSummaryRow(
    row: CyoaChoiceRowData,
    visibleRowIds: CyoaRowVisibility
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
        const selections = selectedChoices.flatMap(choice => {
            const subChoiceGroup = choice.subChoiceGroup;
            if (!subChoiceGroup) {
                return [{
                    id: choice.id,
                    titles: [choice.title],
                    requiredMissing: false,
                }];
            }

            const selectedSubChoiceIds = selectedChoiceIds[subChoiceGroup.id] ?? [];
            const selectedSubChoices = subChoiceGroup.choices.filter(subChoice =>
                selectedSubChoiceIds.includes(subChoice.id)
            );
            const requiredMissing = selectedSubChoices.length < subChoiceGroup.requiredCount;

            if (selectedSubChoices.length === 0) {
                return [{
                    id: choice.id,
                    titles: [choice.title],
                    requiredMissing,
                }];
            }

            const selectedPaths = selectedSubChoices.map(subChoice => ({
                id: `${choice.id}:${subChoice.id}`,
                titles: [choice.title, subChoice.title],
                requiredMissing: false,
            }));

            return requiredMissing
                ? [
                    ...selectedPaths,
                    {
                        id: `${choice.id}:required`,
                        titles: [choice.title],
                        requiredMissing: true,
                    },
                ]
                : selectedPaths;
        });
        const requiredMissing = (
            isCyoaRegistrationRequiredRow(row)
            && selectedChoices.length < row.requiredCount
        ) || selections.some(selection => selection.requiredMissing);

        return [{
            id: row.id,
            title: row.title,
            selections,
            requiredMissing,
        }];
    });
    const signatureInputId = summaryRows.find(
        row => row.input?.role === CYOA_INPUT_ROLES.SIGNATURE_NAME
    )?.input?.id;
    const signatureName = inputItems.find(item => item.id === signatureInputId)?.value ?? '';

    return {
        inputItems,
        choiceItems,
        signatureName,
    };
}
