import {
    CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS,
} from '../../../constants/circleSystemMagicNodeConfigs';
import {
    type MagicType,
} from '../../../types/magicTypeConfig';

const SYSTEM_MAGIC_TYPE_IDS = new Set(
    CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS.map(config => config.type)
);

export function isRegisteredCircleSystemMagicType(
    magicType: MagicType
): boolean {
    return SYSTEM_MAGIC_TYPE_IDS.has(magicType);
}
