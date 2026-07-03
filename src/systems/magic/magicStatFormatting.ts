import {
    MAGIC_STAT_DISPLAY_CONTEXTS,
    MAGIC_STAT_GRADE_BANDS,
    MAGIC_STAT_PRESENTATION_CONFIG,
    type MagicStatDisplayContext,
    type MagicStatGradeBand,
} from '../../constants/magicStatPresentationConfigs';
import type { MagicStatKey } from '../../types/magicStats';

const MAGIC_STAT_UNITS: Partial<Record<MagicStatKey, string>> =
    MAGIC_STAT_PRESENTATION_CONFIG.UNITS;
const MAGIC_STAT_GRADES: Partial<
    Record<MagicStatKey, readonly MagicStatGradeBand[]>
> = MAGIC_STAT_GRADE_BANDS;

function roundMagicStat(value: number): number {
    return Math.round(
        value * MAGIC_STAT_PRESENTATION_CONFIG.PRECISION
    ) / MAGIC_STAT_PRESENTATION_CONFIG.PRECISION;
}

function formatRoundedNumber(value: number): string {
    return Number.isInteger(value)
        ? String(value)
        : value
            .toFixed(2)
            .replace(/0+$/, '')
            .replace(/\.$/, '');
}

function resolveDisplayValue(
    statKey: MagicStatKey,
    value: number,
    context: MagicStatDisplayContext
): number {
    if (
        statKey === 'range' &&
        context !== MAGIC_STAT_DISPLAY_CONTEXTS.NODE
    ) {
        return roundMagicStat(
            value *
                MAGIC_STAT_PRESENTATION_CONFIG.RANGE_BASE_METERS
        );
    }

    return roundMagicStat(value);
}

export function formatMagicStat(
    statKey: MagicStatKey,
    value: number,
    context: MagicStatDisplayContext
): string {
    const formattedValue = formatRoundedNumber(
        resolveDisplayValue(statKey, value, context)
    );

    if (
        statKey === 'range' &&
        context === MAGIC_STAT_DISPLAY_CONTEXTS.NODE
    ) {
        return `${MAGIC_STAT_PRESENTATION_CONFIG.NODE_RANGE_PREFIX}${formattedValue}`;
    }

    const unit = MAGIC_STAT_UNITS[statKey];
    return unit
        ? `${formattedValue}${unit === '마나' ? ' ' : ''}${unit}`
        : formattedValue;
}

export function formatMagicStatAdjustment(
    statKey: MagicStatKey,
    value: number,
    context: MagicStatDisplayContext
): string | undefined {
    const displayValue = resolveDisplayValue(
        statKey,
        value,
        context
    );
    if (displayValue === 0) return undefined;

    const signedValue = displayValue > 0
        ? `+${formatRoundedNumber(displayValue)}`
        : formatRoundedNumber(displayValue);
    if (
        statKey === 'range' &&
        context === MAGIC_STAT_DISPLAY_CONTEXTS.NODE
    ) {
        return `${signedValue}${MAGIC_STAT_PRESENTATION_CONFIG.NODE_RANGE_ADJUSTMENT_UNIT}`;
    }

    const unit = MAGIC_STAT_UNITS[statKey];
    return unit
        ? `${signedValue}${unit === '마나' ? ' ' : ''}${unit}`
        : signedValue;
}

export function resolveMagicStatGrade(
    statKey: MagicStatKey,
    value: number,
    context: MagicStatDisplayContext
): string | undefined {
    if (context !== MAGIC_STAT_DISPLAY_CONTEXTS.TOTAL) {
        return undefined;
    }

    const bands = MAGIC_STAT_GRADES[statKey];
    if (!bands) return undefined;

    const displayValue = resolveDisplayValue(
        statKey,
        value,
        context
    );
    return bands.find(band =>
        displayValue <= band.maximum
    )?.label;
}
