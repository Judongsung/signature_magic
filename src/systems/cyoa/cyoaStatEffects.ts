import type { CyoaChoiceRowData } from '../../types/cyoa';
import type { MagicStatEffectBundle, MagicStatEffectConfig } from '../../types/magic';

type RowSelections = Record<string, string[]>;

export function createEmptyCyoaStatEffects(): MagicStatEffectBundle {
    return {
        nodeEffects: [],
        finalEffects: [],
    };
}

export function mapCyoaStatEffectsByChoiceId(
    rows: readonly CyoaChoiceRowData[]
): ReadonlyMap<string, readonly MagicStatEffectConfig[]> {
    const effectsByChoiceId = new Map<string, readonly MagicStatEffectConfig[]>();

    rows.forEach(row => {
        row.choices.forEach(choice => {
            if (!choice.statEffects?.length) return;
            effectsByChoiceId.set(choice.id, choice.statEffects);
        });
    });

    return effectsByChoiceId;
}

export function calculateCyoaStatEffects(
    selectedChoiceIds: RowSelections,
    effectsByChoiceId: ReadonlyMap<string, readonly MagicStatEffectConfig[]>
): MagicStatEffectBundle {
    const result = createEmptyCyoaStatEffects();

    Object.values(selectedChoiceIds).flat().forEach(choiceId => {
        const effects = effectsByChoiceId.get(choiceId);
        if (!effects) return;

        effects.forEach(effect => {
            // node 효과는 원/합산 계산 전에, final 효과는 전체 그래프 합산 후 적용한다.
            if (effect.phase === 'node') {
                result.nodeEffects.push(effect);
                return;
            }

            result.finalEffects.push(effect);
        });
    });

    return result;
}
