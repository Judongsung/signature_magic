import type {
    CyoaChoice,
    CyoaChoiceConfig,
    CyoaChoiceRowConfig,
    CyoaChoiceRowData,
    CyoaInputValues,
    CyoaRowSelections,
    CyoaRowVisibility,
} from '../../types/cyoa';
import {
    CYOA_CHOICE_IMAGE_PLACEMENTS,
    CYOA_CHOICE_IMAGE_SIZES,
    CYOA_SELECTION_MODES,
} from '../../constants/gameConfigs';
import {
    DEFAULT_CYOA_CHOICE_WIDTH,
    parseCyoaChoiceWidth,
    resolveCyoaLayoutColumns,
} from './cyoaChoiceLayout';

const DEFAULT_REQUIRED_COUNT = 1;
const INPUT_REQUIRED_COUNT = 1;

export function mapCyoaChoiceConfig(
    choice: CyoaChoiceConfig,
    resolveImagePath: (imagePath?: string) => string | undefined,
    layoutColumns = 1
): CyoaChoice {
    const width = parseCyoaChoiceWidth(choice.width);

    return {
        id: choice.id,
        imageSrc: resolveImagePath(choice.imagePath),
        imageAlt: choice.imageAlt,
        imageSize: choice.imageSize ?? CYOA_CHOICE_IMAGE_SIZES.DEFAULT,
        imagePlacement: choice.imagePlacement ?? CYOA_CHOICE_IMAGE_PLACEMENTS.TOP,
        title: choice.title,
        description: choice.description,
        tooltip: choice.tooltip,
        width: choice.width ?? DEFAULT_CYOA_CHOICE_WIDTH,
        // JSON의 width 비율은 CSS grid가 바로 쓸 수 있는 열 수와 span으로 정규화한다.
        layoutSpan: Math.max(1, (layoutColumns / width.denominator) * width.numerator),
        disabled: choice.disabled,
        statEffects: choice.statEffects,
    };
}

export function mapCyoaRowConfig(
    row: CyoaChoiceRowConfig,
    resolveImagePath: (imagePath?: string) => string | undefined
): CyoaChoiceRowData {
    const choiceConfigs = row.choices ?? [];
    const widths = choiceConfigs.map(choice => parseCyoaChoiceWidth(choice.width));
    const layoutColumns = resolveCyoaLayoutColumns(widths);

    return {
        id: row.id,
        title: row.title,
        description: row.description,
        visible: row.visible ?? true,
        selectable: row.selectable ?? true,
        requiredCount: row.requiredCount ?? DEFAULT_REQUIRED_COUNT,
        visibleWhen: row.visibleWhen,
        selectionMode: row.selectionMode ?? CYOA_SELECTION_MODES.SINGLE,
        layoutColumns,
        input: row.input,
        choices: choiceConfigs.map(choice => mapCyoaChoiceConfig(choice, resolveImagePath, layoutColumns)),
    };
}

export function mapCyoaRows(
    rows: CyoaChoiceRowConfig[],
    resolveImagePath: (imagePath?: string) => string | undefined
): CyoaChoiceRowData[] {
    return rows.map(row => mapCyoaRowConfig(row, resolveImagePath));
}

export function createInitialRowVisibility(rows: CyoaChoiceRowData[]): CyoaRowVisibility {
    return resolveCyoaRowVisibility(rows, {});
}

export function createInitialInputValues(rows: CyoaChoiceRowData[]): CyoaInputValues {
    return Object.fromEntries(
        rows
            .filter(row => row.input?.defaultValue)
            .map(row => [row.input!.id, row.input!.defaultValue!])
    );
}

function isChoiceSelected(selectedChoiceIds: CyoaRowSelections, choiceId: string): boolean {
    return Object.values(selectedChoiceIds).some(rowSelections => rowSelections.includes(choiceId));
}

function isRowVisible(row: CyoaChoiceRowData, selectedChoiceIds: CyoaRowSelections): boolean {
    const condition = row.visibleWhen;
    if (!condition) return row.visible;

    if (condition.choiceSelected && !isChoiceSelected(selectedChoiceIds, condition.choiceSelected)) {
        return false;
    }

    if (condition.anyChoiceSelected?.length) {
        const anySelected = condition.anyChoiceSelected.some(choiceId => isChoiceSelected(selectedChoiceIds, choiceId));
        if (!anySelected) return false;
    }

    if (condition.allChoicesSelected?.length) {
        const allSelected = condition.allChoicesSelected.every(choiceId => isChoiceSelected(selectedChoiceIds, choiceId));
        if (!allSelected) return false;
    }

    return true;
}

export function resolveCyoaRowVisibility(
    rows: CyoaChoiceRowData[],
    selectedChoiceIds: CyoaRowSelections
): CyoaRowVisibility {
    return Object.fromEntries(rows.map(row => [row.id, isRowVisible(row, selectedChoiceIds)]));
}

export function canContinueCyoa(
    rows: CyoaChoiceRowData[],
    selectedChoiceIds: CyoaRowSelections,
    inputValues: CyoaInputValues = {}
): boolean {
    return rows
        .filter(row => row.selectable && row.requiredCount > 0)
        .every(row => {
            // visibleWhen은 표시 여부만 제어한다. 숨겨진 행도 requiredCount가 있으면 진행을 막을 수 있다.
            if (row.input) {
                return row.requiredCount <= INPUT_REQUIRED_COUNT
                    && (inputValues[row.input.id]?.trim().length ?? 0) > 0;
            }

            return (selectedChoiceIds[row.id]?.length ?? 0) >= row.requiredCount;
        });
}

export function toggleCyoaChoiceSelection(
    row: CyoaChoiceRowData,
    selectedChoiceIds: CyoaRowSelections,
    choiceId: string
): CyoaRowSelections {
    if (!row.selectable) return selectedChoiceIds;

    const rowSelections = selectedChoiceIds[row.id] ?? [];
    const isSelected = rowSelections.includes(choiceId);
    const nextRowSelections = row.selectionMode === CYOA_SELECTION_MODES.MULTI
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
