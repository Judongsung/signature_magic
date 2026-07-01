import cyoaRowsData from '../data/cyoaRows.json';
import {
    canSubmitCyoaRegistration,
    clearInactiveCyoaSubChoiceSelections,
    createInitialCyoaSelections,
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
    CyoaSubChoiceGroupData,
} from '../types/cyoa';
import {
    type MagicStatEffectBundle,
} from '../types/magicStatEffects';

class ChoiceStore {
    readonly rows: CyoaChoiceRowData[] = mapCyoaRows(
        cyoaRowsData as CyoaChoiceRowConfig[],
        resolveCyoaImagePath
    );

    selectedChoiceIds = $state<CyoaRowSelections>(createInitialCyoaSelections(this.rows));
    inputValues = $state<CyoaInputValues>(createInitialInputValues(this.rows));
    readonly visibleRowIds: CyoaRowVisibility = $derived(
        resolveCyoaRowVisibility(this.rows, this.selectedChoiceIds)
    );
    readonly statEffectsByChoiceId = mapCyoaStatEffectsByChoiceId(this.rows);

    readonly canSubmitRegistration = $derived(
        canSubmitCyoaRegistration(this.rows, this.selectedChoiceIds, this.inputValues)
    );
    readonly statEffects: MagicStatEffectBundle = $derived(
        calculateCyoaStatEffects(this.selectedChoiceIds, this.statEffectsByChoiceId)
    );

    selectChoice(row: CyoaChoiceRowData | CyoaSubChoiceGroupData, choiceId: string): void {
        if ('selectable' in row && !row.selectable) return;

        const choice = row.choices.find(item => item.id === choiceId);
        if (!choice || choice.disabled) return;

        const nextSelections = toggleCyoaChoiceSelection(row, this.selectedChoiceIds, choiceId);
        this.selectedChoiceIds = clearInactiveCyoaSubChoiceSelections(this.rows, nextSelections);
    }

    updateInputValue(inputId: string, value: string): void {
        this.inputValues = {
            ...this.inputValues,
            [inputId]: value,
        };
    }

    reset(): void {
        this.selectedChoiceIds = createInitialCyoaSelections(this.rows);
        this.inputValues = createInitialInputValues(this.rows);
    }
}

export const choiceStore = new ChoiceStore();
