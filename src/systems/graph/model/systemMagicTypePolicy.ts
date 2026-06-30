import {
    SYSTEM_MAGIC_TYPE_CONFIGS,
} from '../../../constants/systemMagicNodeConfigs';
import type { MagicType } from '../../../types/magic';

const SYSTEM_MAGIC_TYPE_IDS = new Set(
    SYSTEM_MAGIC_TYPE_CONFIGS.map(config => config.type)
);

export function isSystemMagicType(magicType: MagicType): boolean {
    return SYSTEM_MAGIC_TYPE_IDS.has(magicType);
}
