import {
    MAGIC_CIRCLE_CONNECTION_INSTABILITY_COST,
} from '../../../constants/magicStatConfigs';
import {
    MAGIC_STAT_KEYS,
    type MagicStats,
} from '../../../types/magicStats';
import {
    MAGIC_STAT_RULES,
} from './magicStatRules';

export type MagicCircleFlowStatOperation = 'serial' | 'parallel';

export function combineMagicCircleFlowStats(
    left: MagicStats,
    right: MagicStats,
    operation: MagicCircleFlowStatOperation
): MagicStats {
    return Object.fromEntries(MAGIC_STAT_KEYS.map(statKey => {
        const rule = MAGIC_STAT_RULES[statKey];
        return [
            statKey,
            operation === 'serial'
                ? rule.combineSerialValues(
                    left[statKey],
                    right[statKey]
                )
                : rule.combineBranchValues(
                    [left[statKey], right[statKey]]
                ),
        ];
    })) as MagicStats;
}

export function finalizeMagicCircleFlowStats(
    accumulatedStats: MagicStats,
    localCircleStats: MagicStats
): MagicStats {
    // 불안정성은 누적 스탯이 아니라 서클 자체 위험으로 표시한다.
    return {
        ...accumulatedStats,
        instability: localCircleStats.instability,
    };
}

export function resolveMagicFlowTotalStats(
    terminalStats: MagicStats,
    circleStats: readonly MagicStats[],
    connectionCount: number
): MagicStats {
    const localInstabilities = circleStats.map(stats =>
        stats.instability
    );
    const maximumLocalInstability = localInstabilities.length === 0
        ? 0
        : Math.max(...localInstabilities);

    return {
        ...terminalStats,
        instability:
            maximumLocalInstability +
            connectionCount *
                MAGIC_CIRCLE_CONNECTION_INSTABILITY_COST,
    };
}
