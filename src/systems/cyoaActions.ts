import { CYOA_ACTIONS } from '../constants/gameConfigs';
import type {
    CyoaChoice,
    CyoaChoiceConfig,
    CyoaChoiceImageKey,
    CyoaChoiceRowConfig,
    CyoaChoiceRowData,
} from '../types/cyoa';

type CyoaImageSources = Record<CyoaChoiceImageKey, string>;
type RowVisibility = Record<string, boolean>;
type RowSelections = Record<string, string[]>;

export function mapCyoaChoiceConfig(
    choice: CyoaChoiceConfig,
    imageSources: CyoaImageSources
): CyoaChoice {
    return {
        id: choice.id,
        imageSrc: imageSources[choice.imageKey],
        imageAlt: choice.imageAlt,
        title: choice.title,
        description: choice.description,
        disabled: choice.disabled,
        actions: choice.actions,
    };
}

export function mapCyoaRowConfig(
    row: CyoaChoiceRowConfig,
    imageSources: CyoaImageSources
): CyoaChoiceRowData {
    return {
        id: row.id,
        title: row.title,
        visible: row.visible ?? true,
        selectable: row.selectable ?? true,
        required: row.required ?? true,
        selectionMode: row.selectionMode ?? 'single',
        choices: row.choices.map(choice => mapCyoaChoiceConfig(choice, imageSources)),
    };
}

export function mapCyoaRows(
    rows: CyoaChoiceRowConfig[],
    imageSources: CyoaImageSources
): CyoaChoiceRowData[] {
    return rows.map(row => mapCyoaRowConfig(row, imageSources));
}

export function createInitialRowVisibility(rows: CyoaChoiceRowData[]): RowVisibility {
    return Object.fromEntries(rows.map(row => [row.id, row.visible]));
}

export function canContinueCyoa(
    rows: CyoaChoiceRowData[],
    _visibleRowIds: RowVisibility,
    selectedChoiceIds: RowSelections
): boolean {
    return rows
        .filter(row => row.selectable && row.required)
        .every(row => (selectedChoiceIds[row.id]?.length ?? 0) > 0);
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
