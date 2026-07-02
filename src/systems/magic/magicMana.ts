import { MAXIMUM_MANA_CONFIG } from '../../constants/maximumManaConfigs';

function roundMagicMana(value: number): number {
    return Math.round(value * MAXIMUM_MANA_CONFIG.DISPLAY_PRECISION) /
        MAXIMUM_MANA_CONFIG.DISPLAY_PRECISION;
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

export function formatMagicMana(value: number): string {
    const rounded = roundMagicMana(value);
    return Number.isInteger(rounded)
        ? String(rounded)
        : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
