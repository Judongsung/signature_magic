import type { CyoaChoice, CyoaChoiceConfig, CyoaChoiceRowConfig, CyoaChoiceRowData } from '../../types/cyoa';

type RowVisibility = Record<string, boolean>;
type RowSelections = Record<string, string[]>;
type InputValues = Record<string, string>;
type ChoiceWidth = { numerator: number; denominator: number };

const DEFAULT_CHOICE_WIDTH = '1/3';
const DEFAULT_REQUIRED_COUNT = 1;
const INPUT_REQUIRED_COUNT = 1;

function greatestCommonDivisor(a: number, b: number): number {
    return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

function leastCommonMultiple(a: number, b: number): number {
    return Math.abs(a * b) / greatestCommonDivisor(a, b);
}

export function parseChoiceWidth(width = DEFAULT_CHOICE_WIDTH): ChoiceWidth {
    const match = width.match(/^(\d+)\/(\d+)$/);
    if (!match) return { numerator: 1, denominator: 3 };

    const numerator = Number(match[1]);
    const denominator = Number(match[2]);
    if (numerator <= 0 || denominator <= 0 || numerator > denominator) {
        return { numerator: 1, denominator: 3 };
    }

    return { numerator, denominator };
}

function resolveLayoutColumns(widths: ChoiceWidth[]): number {
    if (widths.length === 0) return 1;
    return widths.map(width => width.denominator).reduce(leastCommonMultiple, 1);
}

export function mapCyoaChoiceConfig(
    choice: CyoaChoiceConfig,
    resolveImagePath: (imagePath?: string) => string | undefined,
    layoutColumns = 1
): CyoaChoice {
    const width = parseChoiceWidth(choice.width);

    return {
        id: choice.id,
        imageSrc: resolveImagePath(choice.imagePath),
        imageAlt: choice.imageAlt,
        title: choice.title,
        description: choice.description,
        tooltip: choice.tooltip,
        width: choice.width ?? DEFAULT_CHOICE_WIDTH,
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
    const widths = choiceConfigs.map(choice => parseChoiceWidth(choice.width));
    const layoutColumns = resolveLayoutColumns(widths);

    return {
        id: row.id,
        title: row.title,
        visible: row.visible ?? true,
        selectable: row.selectable ?? true,
        requiredCount: row.requiredCount ?? DEFAULT_REQUIRED_COUNT,
        visibleWhen: row.visibleWhen,
        selectionMode: row.selectionMode ?? 'single',
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

export function createInitialRowVisibility(rows: CyoaChoiceRowData[]): RowVisibility {
    return resolveCyoaRowVisibility(rows, {});
}

export function createInitialInputValues(rows: CyoaChoiceRowData[]): InputValues {
    return Object.fromEntries(
        rows
            .filter(row => row.input?.defaultValue)
            .map(row => [row.input!.id, row.input!.defaultValue!])
    );
}

function isChoiceSelected(selectedChoiceIds: RowSelections, choiceId: string): boolean {
    return Object.values(selectedChoiceIds).some(rowSelections => rowSelections.includes(choiceId));
}

function isRowVisible(row: CyoaChoiceRowData, selectedChoiceIds: RowSelections): boolean {
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
    selectedChoiceIds: RowSelections
): RowVisibility {
    return Object.fromEntries(rows.map(row => [row.id, isRowVisible(row, selectedChoiceIds)]));
}

export function canContinueCyoa(
    rows: CyoaChoiceRowData[],
    selectedChoiceIds: RowSelections,
    inputValues: InputValues = {}
): boolean {
    return rows
        .filter(row => row.selectable && row.requiredCount > 0)
        .every(row => {
            if (row.input) {
                return row.requiredCount <= INPUT_REQUIRED_COUNT
                    && (inputValues[row.input.id]?.trim().length ?? 0) > 0;
            }

            return (selectedChoiceIds[row.id]?.length ?? 0) >= row.requiredCount;
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
