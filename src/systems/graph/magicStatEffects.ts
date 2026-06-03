import {
    MAGIC_STAT_KEYS,
    type MagicStatEffectConfig,
    type MagicStatKey,
    type MagicStats,
} from '../../types/magic';

export function applyMagicStatEffects(
    value: number,
    statKey: MagicStatKey,
    effects: readonly MagicStatEffectConfig[] = []
): number {
    const matchingEffects = effects.filter(effect => effect.stat === statKey);
    const multiplier = matchingEffects
        .filter(effect => effect.operation === 'multiply')
        .reduce((product, effect) => product * effect.value, 1);
    const addition = matchingEffects
        .filter(effect => effect.operation === 'add')
        .reduce((total, effect) => total + effect.value, 0);

    return value * multiplier + addition;
}

export function applyMagicStatEffectsToStats(
    stats: MagicStats,
    effects: readonly MagicStatEffectConfig[] = []
): MagicStats {
    return Object.fromEntries(
        MAGIC_STAT_KEYS.map(statKey => [
            statKey,
            applyMagicStatEffects(stats[statKey], statKey, effects),
        ])
    ) as MagicStats;
}
