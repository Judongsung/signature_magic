import {
    MAGIC_STAT_KEYS,
    type MagicStatKey,
    type MagicStats,
} from '../../../types/magicStats';
import {
    MAGIC_STAT_RULES,
    type MagicStatRuleContext,
} from './magicStatRules';

export type MagicCircleFlowStatOperation = 'serial' | 'parallel';

type WholeCircleStatCombiner = (values: readonly number[]) => number;

// 불안정성은 서클 내부 전체를 한 번 계산한 값끼리 비교한다.
// 합류 공식이 확정되면 이 정책만 교체하고 흐름 계산 순서는 유지한다.
const WHOLE_CIRCLE_STAT_COMBINERS: Partial<
    Record<MagicStatKey, WholeCircleStatCombiner>
> = {
    instability: values => Math.max(...values),
};

export function combineMagicCircleFlowStats(
    left: MagicStats,
    right: MagicStats,
    operation: MagicCircleFlowStatOperation,
    baseContext: MagicStatRuleContext
): MagicStats {
    return Object.fromEntries(MAGIC_STAT_KEYS.map(statKey => {
        const wholeCircleCombiner =
            WHOLE_CIRCLE_STAT_COMBINERS[statKey];
        if (wholeCircleCombiner) {
            return [
                statKey,
                wholeCircleCombiner([left[statKey], right[statKey]]),
            ];
        }

        const rule = MAGIC_STAT_RULES[statKey];
        const context = {
            ...baseContext,
            statKey,
        };
        return [
            statKey,
            operation === 'serial'
                ? rule.combineSerialValues(
                    left[statKey],
                    right[statKey],
                    context
                )
                : rule.combineBranchValues(
                    [left[statKey], right[statKey]],
                    undefined,
                    context
                ),
        ];
    })) as MagicStats;
}

export function finalizeMagicCircleFlowStats(
    accumulatedStats: MagicStats,
    localCircleStats: MagicStats,
    inheritedCircleStats: readonly MagicStats[]
): MagicStats {
    const result = { ...accumulatedStats };

    MAGIC_STAT_KEYS.forEach(statKey => {
        const wholeCircleCombiner =
            WHOLE_CIRCLE_STAT_COMBINERS[statKey];
        if (!wholeCircleCombiner) return;

        result[statKey] = wholeCircleCombiner([
            localCircleStats[statKey],
            ...inheritedCircleStats.map(stats => stats[statKey]),
        ]);
    });

    return result;
}
