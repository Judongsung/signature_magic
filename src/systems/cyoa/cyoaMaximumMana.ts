import type {
    CyoaChoiceRowData,
    CyoaRowSelections,
} from '../../types/cyoa';
import { resolveMaximumMana } from '../magic/magicMana';

export function mapCyoaMaximumManaModifiersByChoiceId(
    rows: readonly CyoaChoiceRowData[]
): ReadonlyMap<string, number> {
    const modifiersByChoiceId = new Map<string, number>();

    rows.forEach(row => {
        row.choices.forEach(choice => {
            if (choice.maximumManaModifier !== undefined) {
                modifiersByChoiceId.set(
                    choice.id,
                    choice.maximumManaModifier
                );
            }

            choice.subChoiceGroup?.choices.forEach(subChoice => {
                if (subChoice.maximumManaModifier === undefined) return;
                modifiersByChoiceId.set(
                    subChoice.id,
                    subChoice.maximumManaModifier
                );
            });
        });
    });

    return modifiersByChoiceId;
}

export function calculateCyoaMaximumMana(
    selectedChoiceIds: CyoaRowSelections,
    modifiersByChoiceId: ReadonlyMap<string, number>
): number {
    const selectedIds = new Set(Object.values(selectedChoiceIds).flat());
    return resolveMaximumMana(
        [...selectedIds].flatMap(choiceId => {
            const modifier = modifiersByChoiceId.get(choiceId);
            return modifier === undefined ? [] : [modifier];
        })
    );
}
