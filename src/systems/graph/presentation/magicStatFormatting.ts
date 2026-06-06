const DISPLAY_STAT_PRECISION = 100;

export function formatMagicStat(value: number): string {
    const rounded = Math.round(value * DISPLAY_STAT_PRECISION) / DISPLAY_STAT_PRECISION;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
