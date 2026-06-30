import {
    MAGIC_NODE_WEIGHT_CONFIG,
} from '../../../constants/nodeEditorConfigs';
import {
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import type {
    MagicNodeData,
    MagicStatKey,
    MagicTypeConfig,
} from '../../../types/magic';
import {
    isRegisteredCircleSystemMagicType,
} from './circleSystemMagicTypePolicy';

export type MagicNodeWeightTypeContext = Pick<
    MagicTypeConfig,
    'type' | 'category'
>;

const DURATION_STAT_KEY: MagicStatKey = 'duration';

export function canMagicTypeUseNodeWeight(
    config: MagicNodeWeightTypeContext | undefined
): boolean {
    return Boolean(
        config &&
        config.category !== MAGIC_NODE_WEIGHT_CONFIG.EXCLUDED_CATEGORY &&
        !isRegisteredCircleSystemMagicType(config.type)
    );
}

export function resolveMagicNodeWeight(
    data: Pick<MagicNodeData, 'settings' | 'nodeKind'>,
    config: MagicNodeWeightTypeContext | undefined
): number {
    if (
        data.nodeKind === MAGIC_NODE_KINDS.SYSTEM ||
        !canMagicTypeUseNodeWeight(config)
    ) {
        return MAGIC_NODE_WEIGHT_CONFIG.DEFAULT;
    }

    const parsed = Number(data.settings?.[MAGIC_NODE_WEIGHT_CONFIG.KEY]);
    if (!Number.isFinite(parsed)) return MAGIC_NODE_WEIGHT_CONFIG.DEFAULT;

    return Math.min(
        MAGIC_NODE_WEIGHT_CONFIG.MAX,
        Math.max(
            MAGIC_NODE_WEIGHT_CONFIG.MIN,
            Math.round(parsed)
        )
    );
}

export function applyMagicNodeWeightToStat(
    value: number,
    statKey: MagicStatKey,
    data: Pick<MagicNodeData, 'settings' | 'nodeKind'>,
    config: MagicNodeWeightTypeContext | undefined
): number {
    const weight = resolveMagicNodeWeight(data, config);
    if (
        weight === MAGIC_NODE_WEIGHT_CONFIG.DEFAULT ||
        (
            statKey === DURATION_STAT_KEY &&
            config?.type !==
                MAGIC_NODE_WEIGHT_CONFIG.DURATION_WEIGHTED_MAGIC_TYPE
        )
    ) {
        return value;
    }

    return value * weight;
}
