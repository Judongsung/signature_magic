import {
    MAGIC_NODE_WEIGHT_CONFIG,
} from '../../../constants/nodeEditorConfigs';
import {
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import {
    type MagicNodeKind,
} from '../magicGraphTypes';
import {
    type MagicStatKey,
} from '../../../types/magicStats';
import {
    type MagicNodeSettings,
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import {
    isRegisteredCircleSystemMagicType,
} from './circleSystemMagicTypePolicy';

export type MagicNodeWeightTypeContext = Pick<
    MagicTypeConfig,
    'type' | 'category'
>;

const DURATION_STAT_KEY: MagicStatKey = 'duration';
const CASTING_TIME_STAT_KEY: MagicStatKey = 'castingTime';
const RANGE_STAT_KEY: MagicStatKey = 'range';

interface MagicNodeWeightData {
    settings?: Readonly<MagicNodeSettings>;
    nodeKind?: MagicNodeKind;
}

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
    data: MagicNodeWeightData,
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
    data: MagicNodeWeightData,
    config: MagicNodeWeightTypeContext | undefined
): number {
    const weight = resolveMagicNodeWeight(data, config);
    if (weight === MAGIC_NODE_WEIGHT_CONFIG.DEFAULT) {
        return value;
    }
    if (statKey === CASTING_TIME_STAT_KEY) return value;
    if (statKey === RANGE_STAT_KEY) return value ** weight;
    if (
        statKey === DURATION_STAT_KEY &&
        config?.type !==
            MAGIC_NODE_WEIGHT_CONFIG.DURATION_WEIGHTED_MAGIC_TYPE
    ) {
        return value;
    }

    return value * weight;
}
