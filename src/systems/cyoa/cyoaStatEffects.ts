import type { CyoaChoiceRowData, CyoaRowSelections } from '../../types/cyoa';
import {
    type MagicStatEffectBundle,
    type MagicStatEffectConfig,
} from '../../types/magicStatEffects';
import {
    createEmptyMagicStatEffectBundle,
    MAGIC_STAT_EFFECT_PHASE,
} from '../graph/calculation/magicStatEffectBundles';

export const createEmptyCyoaStatEffects = createEmptyMagicStatEffectBundle;

export function mapCyoaStatEffectsByChoiceId(
    rows: readonly CyoaChoiceRowData[]
): ReadonlyMap<string, readonly MagicStatEffectConfig[]> {
    const effectsByChoiceId = new Map<string, readonly MagicStatEffectConfig[]>();

    rows.forEach(row => {
        row.choices.forEach(choice => {
            if (choice.statEffects?.length) {
                effectsByChoiceId.set(choice.id, choice.statEffects);
            }

            choice.subChoiceGroup?.choices.forEach(subChoice => {
                if (!subChoice.statEffects?.length) return;
                effectsByChoiceId.set(subChoice.id, subChoice.statEffects);
            });
        });
    });

    return effectsByChoiceId;
}

export function calculateCyoaStatEffects(
    selectedChoiceIds: CyoaRowSelections,
    effectsByChoiceId: ReadonlyMap<string, readonly MagicStatEffectConfig[]>
): MagicStatEffectBundle {
    const result = createEmptyCyoaStatEffects();

    Object.values(selectedChoiceIds).flat().forEach(choiceId => {
        const effects = effectsByChoiceId.get(choiceId);
        if (!effects) return;

        effects.forEach(effect => {
            // node 효과는 원/합산 계산 전에, final 효과는 전체 그래프 합산 후 적용한다.
            if (effect.phase === MAGIC_STAT_EFFECT_PHASE.NODE) {
                result.nodeEffects.push(effect);
                return;
            }

            result.finalEffects.push(effect);
        });
    });

    return result;
}
