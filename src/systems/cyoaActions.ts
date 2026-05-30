import { CYOA_ACTIONS } from '../constants/gameConfigs';
import type { CyoaChoice, CyoaChoiceConfig, CyoaChoiceRowConfig, CyoaChoiceRowData } from '../types/cyoa';

type RowVisibility = Record<string, boolean>;
type RowSelections = Record<string, string[]>;
type InputValues = Record<string, string>;

function resolveRequiredMode(row: CyoaChoiceRowConfig): CyoaChoiceRowData['requiredMode'] {
    if (row.requiredMode) return row.requiredMode;
    return row.required === false ? 'never' : 'always';
}

export function mapCyoaChoiceConfig(
    choice: CyoaChoiceConfig,
    resolveImagePath: (imagePath?: string) => string
): CyoaChoice {
    return {
        id: choice.id,
        imageSrc: resolveImagePath(choice.imagePath),
        imageAlt: choice.imageAlt,
        title: choice.title,
        description: choice.description,
        disabled: choice.disabled,
        actions: choice.actions,
    };
}

export function mapCyoaRowConfig(
    row: CyoaChoiceRowConfig,
    resolveImagePath: (imagePath?: string) => string
): CyoaChoiceRowData {
    const requiredMode = resolveRequiredMode(row);

    return {
        id: row.id,
        title: row.title,
        visible: row.visible ?? true,
        selectable: row.selectable ?? true,
        required: requiredMode !== 'never',
        requiredMode,
        selectionMode: row.selectionMode ?? 'single',
        input: row.input,
        choices: (row.choices ?? []).map(choice => mapCyoaChoiceConfig(choice, resolveImagePath)),
    };
}

export function mapCyoaRows(
    rows: CyoaChoiceRowConfig[],
    resolveImagePath: (imagePath?: string) => string
): CyoaChoiceRowData[] {
    return rows.map(row => mapCyoaRowConfig(row, resolveImagePath));
}

export function createInitialRowVisibility(rows: CyoaChoiceRowData[]): RowVisibility {
    return Object.fromEntries(rows.map(row => [row.id, row.visible]));
}

export function createInitialInputValues(rows: CyoaChoiceRowData[]): InputValues {
    return Object.fromEntries(
        rows
            .filter(row => row.input?.defaultValue)
            .map(row => [row.input!.id, row.input!.defaultValue!])
    );
}

export function canContinueCyoa(
    rows: CyoaChoiceRowData[],
    visibleRowIds: RowVisibility,
    selectedChoiceIds: RowSelections,
    inputValues: InputValues = {}
): boolean {
    return rows
        .filter(row => {
            if (!row.selectable || row.requiredMode === 'never') return false;
            if (row.requiredMode === 'visible') return visibleRowIds[row.id];
            return true;
        })
        .every(row => {
            if (row.input) return (inputValues[row.input.id]?.trim().length ?? 0) > 0;
            return (selectedChoiceIds[row.id]?.length ?? 0) > 0;
        });
}

export function toggleCyoaChoiceSelection(
    row: CyoaChoiceRowData,
    selectedChoiceIds: RowSelections,
    choiceId: string
): RowSelections {
    if (!row.selectable) return selectedChoiceIds;

    const rowSelections = selectedChoiceIds[row.id] ?? [];
    const isSelected = rowSelections.includes(choiceId);
    const nextRowSelections = row.selectionMode === 'multi'
        ? isSelected
            ? rowSelections.filter(id => id !== choiceId)
            : [...rowSelections, choiceId]
        : isSelected
            ? []
            : [choiceId];

    return {
        ...selectedChoiceIds,
        [row.id]: nextRowSelections,
    };
}

export function applyCyoaChoiceActions(
    choice: CyoaChoice,
    visibleRowIds: RowVisibility,
    active: boolean
): RowVisibility {
    return (choice.actions ?? []).reduce<RowVisibility>((nextVisibleRowIds, action) => {
        if (action.func === CYOA_ACTIONS.OPEN_ROW && action.target_id) {
            return {
                ...nextVisibleRowIds,
                [action.target_id]: active,
            };
        }

        return nextVisibleRowIds;
    }, visibleRowIds);
}
