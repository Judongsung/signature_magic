import { MAXIMUM_MANA_CONFIG } from '../../constants/maximumManaConfigs';
import {
    MAGIC_STAT_PRESENTATION_CONFIG,
} from '../../constants/magicStatPresentationConfigs';

function roundMagicMana(value: number): number {
    return Math.round(
        value * MAGIC_STAT_PRESENTATION_CONFIG.PRECISION
    ) / MAGIC_STAT_PRESENTATION_CONFIG.PRECISION;
}

export function resolveMaximumMana(
    modifiers: readonly number[]
): number {
    const totalModifier = modifiers.reduce(
        (total, modifier) => total + modifier,
        0
    );
    return Math.max(
        MAXIMUM_MANA_CONFIG.MINIMUM,
        roundMagicMana(MAXIMUM_MANA_CONFIG.DEFAULT + totalModifier)
    );
}

export function isManaCostWithinMaximum(
    manaCost: number,
    maximumMana: number
): boolean {
    return roundMagicMana(manaCost) <= roundMagicMana(maximumMana);
}
