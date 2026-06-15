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
import type {
    CyoaChoiceRowConfig,
    CyoaChoiceRowData,
    CyoaInputValues,
    CyoaRowSelections,
    CyoaRowVisibility,
} from '../types/cyoa';
import type { MagicStatEffectBundle } from '../types/magic';

class ChoiceStore {
    readonly rows: CyoaChoiceRowData[] = mapCyoaRows(
        cyoaRowsData as CyoaChoiceRowConfig[],
        resolveCyoaImagePath
    );

    selectedChoiceIds = $state<CyoaRowSelections>({});
    inputValues = $state<CyoaInputValues>(createInitialInputValues(this.rows));
    readonly visibleRowIds: CyoaRowVisibility = $derived(
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
