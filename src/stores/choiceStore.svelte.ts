import cyoaRowsData from '../data/cyoaRows.json';
import {
    canContinueCyoa,
    createInitialInputValues,
    mapCyoaRows,
    resolveCyoaRowVisibility,
    toggleCyoaChoiceSelection,
} from '../systems/cyoa/cyoaActions';
import { resolveCyoaImagePath } from '../systems/cyoa/cyoaImageRegistry';
import {
    calculateCyoaStatEffects,
    mapCyoaStatEffectsByChoiceId,
} from '../systems/cyoa/cyoaStatEffects';
import type { CyoaChoiceRowConfig, CyoaChoiceRowData } from '../types/cyoa';
import type { MagicStatEffectBundle } from '../types/magic';

type RowVisibility = Record<string, boolean>;
type RowSelections = Record<string, string[]>;
type InputValues = Record<string, string>;

class ChoiceStore {
    readonly rows: CyoaChoiceRowData[] = mapCyoaRows(
        cyoaRowsData as CyoaChoiceRowConfig[],
        resolveCyoaImagePath
    );

    selectedChoiceIds = $state<RowSelections>({});
    inputValues = $state<InputValues>(createInitialInputValues(this.rows));
    readonly visibleRowIds: RowVisibility = $derived(
        resolveCyoaRowVisibility(this.rows, this.selectedChoiceIds)
    );
    readonly statEffectsByChoiceId = mapCyoaStatEffectsByChoiceId(this.rows);

    readonly canContinue = $derived(
        canContinueCyoa(this.rows, this.selectedChoiceIds, this.inputValues)
    );
    readonly statEffects: MagicStatEffectBundle = $derived(
        calculateCyoaStatEffects(this.selectedChoiceIds, this.statEffectsByChoiceId)
    );

    selectChoice(row: CyoaChoiceRowData, choiceId: string): void {
        if (!row.selectable) return;

        const choice = row.choices.find(item => item.id === choiceId);
        if (!choice || choice.disabled) return;

        this.selectedChoiceIds = toggleCyoaChoiceSelection(row, this.selectedChoiceIds, choiceId);
    }

    updateInputValue(inputId: string, value: string): void {
        this.inputValues = {
            ...this.inputValues,
            [inputId]: value,
        };
    }

    reset(): void {
        this.selectedChoiceIds = {};
        this.inputValues = createInitialInputValues(this.rows);
    }
}

export const choiceStore = new ChoiceStore();
