import {
    MAGIC_STAT_KEYS,
    MAGIC_STAT_EFFECT_VALUE_SIGNS,
    type MagicStatEffectConfig,
    type MagicStatEffectOperation,
    type MagicStatKey,
    type MagicStats,
    type MagicStatsConfig,
    type MagicType,
} from '../../../types/magic';
import type { MagicNodeCategory } from '../../../constants/nodeEditorConfigs';

export const MAGIC_STAT_EFFECT_OPERATION_IDS = {
    ADD: 'add',
    MULTIPLY: 'multiply',
} as const satisfies Record<string, MagicStatEffectOperation>;

interface MagicStatEffectAggregate {
    multiplier: number;
    addition: number;
}

export type MagicStatEffectSummary = Record<MagicStatKey, MagicStatEffectAggregate>;

export interface MagicStatEffectNodeContext {
    category: MagicNodeCategory;
    magicType: MagicType;
    stats?: MagicStatsConfig;
}

export function isMagicStatEffectApplicableToNode(
    effect: MagicStatEffectConfig,
    nodeContext?: MagicStatEffectNodeContext
): boolean {
    if (!effect.nodeTarget) return true;
    if (!nodeContext) return false;

    const categoryMatches = effect.nodeTarget.categories === undefined
        || effect.nodeTarget.categories.includes(nodeContext.category);
    const magicTypeMatches = effect.nodeTarget.magicTypes === undefined
        || effect.nodeTarget.magicTypes.includes(nodeContext.magicType);
    const statValue = nodeContext.stats?.[effect.stat] ?? 0;
    const statValueSignMatches = effect.nodeTarget.statValueSign === undefined
        || (
            effect.nodeTarget.statValueSign === MAGIC_STAT_EFFECT_VALUE_SIGNS.POSITIVE
                ? statValue > 0
                : statValue < 0
        );

    return categoryMatches && magicTypeMatches && statValueSignMatches;
}

export function filterMagicStatEffectsForNode(
    effects: readonly MagicStatEffectConfig[],
    nodeContext?: MagicStatEffectNodeContext
): MagicStatEffectConfig[] {
    return effects.filter(effect => isMagicStatEffectApplicableToNode(effect, nodeContext));
}

export function buildMagicStatEffectSummary(
    effects: readonly MagicStatEffectConfig[] = []
): MagicStatEffectSummary {
    const summary = createEmptyMagicStatEffectSummary();

    effects.forEach(effect => {
        const aggregate = summary[effect.stat];

        if (effect.operation === MAGIC_STAT_EFFECT_OPERATION_IDS.MULTIPLY) {
            aggregate.multiplier *= effect.value;
            return;
        }

        if (effect.operation === MAGIC_STAT_EFFECT_OPERATION_IDS.ADD) {
            aggregate.addition += effect.value;
        }
    });

    return summary;
}

export function applyMagicStatEffectSummary(
    value: number,
    statKey: MagicStatKey,
    summary: MagicStatEffectSummary
): number {
    const { multiplier, addition } = summary[statKey];

    return value * multiplier + addition;
}

export function applyMagicStatEffects(
    value: number,
    statKey: MagicStatKey,
    effects: readonly MagicStatEffectConfig[] = []
): number {
    return applyMagicStatEffectSummary(
        value,
        statKey,
        buildMagicStatEffectSummary(effects)
    );
}

export function applyMagicStatEffectsToStats(
    stats: MagicStats,
    effects: readonly MagicStatEffectConfig[] = []
): MagicStats {
    const summary = buildMagicStatEffectSummary(effects);

    return Object.fromEntries(
        MAGIC_STAT_KEYS.map(statKey => [
            statKey,
            applyMagicStatEffectSummary(stats[statKey], statKey, summary),
        ])
    ) as MagicStats;
}

function createEmptyMagicStatEffectSummary(): MagicStatEffectSummary {
    return Object.fromEntries(
        MAGIC_STAT_KEYS.map(statKey => [
            statKey,
            {
                multiplier: 1,
                addition: 0,
            },
        ])
    ) as MagicStatEffectSummary;
}
