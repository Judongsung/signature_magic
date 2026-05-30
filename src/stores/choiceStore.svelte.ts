import cyoaRowsData from '../data/cyoaRows.json';
import {
    applyCyoaChoiceActions,
    canContinueCyoa,
    createInitialInputValues,
    createInitialRowVisibility,
    mapCyoaRows,
    toggleCyoaChoiceSelection,
} from '../systems/cyoaActions';
import { resolveCyoaImagePath } from '../systems/cyoaImageRegistry';
import type { CyoaChoiceRowConfig, CyoaChoiceRowData } from '../types/cyoa';

type RowVisibility = Record<string, boolean>;
type RowSelections = Record<string, string[]>;
type InputValues = Record<string, string>;

class ChoiceStore {
    readonly rows: CyoaChoiceRowData[] = mapCyoaRows(
        cyoaRowsData as CyoaChoiceRowConfig[],
        resolveCyoaImagePath
    );

    visibleRowIds = $state<RowVisibility>(createInitialRowVisibility(this.rows));
    selectedChoiceIds = $state<RowSelections>({});
    inputValues = $state<InputValues>(createInitialInputValues(this.rows));

    readonly canContinue = $derived(
        canContinueCyoa(this.rows, this.visibleRowIds, this.selectedChoiceIds, this.inputValues)
    );

    selectChoice(row: CyoaChoiceRowData, choiceId: string): void {
        if (!row.selectable) return;

        const choice = row.choices.find(item => item.id === choiceId);
        if (!choice || choice.disabled) return;

        const nextSelectedChoiceIds = toggleCyoaChoiceSelection(row, this.selectedChoiceIds, choiceId);
        const active = nextSelectedChoiceIds[row.id]?.includes(choiceId) ?? false;

        this.visibleRowIds = applyCyoaChoiceActions(choice, this.visibleRowIds, active);
        this.selectedChoiceIds = nextSelectedChoiceIds;
    }

    updateInputValue(inputId: string, value: string): void {
        this.inputValues = {
            ...this.inputValues,
            [inputId]: value,
        };
    }

    reset(): void {
        this.visibleRowIds = createInitialRowVisibility(this.rows);
        this.selectedChoiceIds = {};
        this.inputValues = createInitialInputValues(this.rows);
    }
}

export const choiceStore = new ChoiceStore();
