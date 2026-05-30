import cyoaRowsData from '../data/cyoaRows.json';
import {
    applyCyoaChoiceActions,
    canContinueCyoa,
    createInitialRowVisibility,
    mapCyoaRows,
    toggleCyoaChoiceSelection,
} from '../systems/cyoaActions';
import { resolveCyoaImagePath } from '../systems/cyoaImageRegistry';
import type { CyoaChoiceRowConfig, CyoaChoiceRowData } from '../types/cyoa';

type RowVisibility = Record<string, boolean>;
type RowSelections = Record<string, string[]>;

class ChoiceStore {
    readonly rows: CyoaChoiceRowData[] = mapCyoaRows(
        cyoaRowsData as CyoaChoiceRowConfig[],
        resolveCyoaImagePath
    );

    visibleRowIds = $state<RowVisibility>(createInitialRowVisibility(this.rows));
    selectedChoiceIds = $state<RowSelections>({});

    readonly canContinue = $derived(
        canContinueCyoa(this.rows, this.visibleRowIds, this.selectedChoiceIds)
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

    reset(): void {
        this.visibleRowIds = createInitialRowVisibility(this.rows);
        this.selectedChoiceIds = {};
    }
}

export const choiceStore = new ChoiceStore();
