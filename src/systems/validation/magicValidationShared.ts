import type { MagicNodeCategory } from '../../constants/nodeEditorConfigs';
import { MAGIC_STAT_KEYS } from '../../types/magic';

export const MAGIC_STAT_KEY_SET = new Set<string>(MAGIC_STAT_KEYS);

export function getMagicCategoryIds(categories: readonly MagicNodeCategory[]): Set<MagicNodeCategory> {
    return new Set(categories);
}
