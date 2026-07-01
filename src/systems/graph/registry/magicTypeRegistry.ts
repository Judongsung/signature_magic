import type { MagicNodeCategory } from '../../../constants/nodeEditorConfigs';
import { CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS } from '../../../constants/circleSystemMagicNodeConfigs';
import {
    type MagicType,
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import { userMagicTypes } from '../../magic/magicTypeCatalog';

export const magicTypes = [
    ...userMagicTypes,
    ...CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS,
];

export const magicTypeMap: ReadonlyMap<string, MagicTypeConfig> = new Map(
    magicTypes.map(config => [config.type, config])
);

export const magicTypeColorMap: Record<MagicType, string> = Object.fromEntries(
    magicTypes.map(({ type, color }) => [type, color])
) as Record<MagicType, string>;

export function getMagicTypeConfig(type: MagicType): MagicTypeConfig | undefined {
    return magicTypeMap.get(type);
}

export function getMagicTypesByCategory(categoryIds: readonly MagicNodeCategory[]): MagicTypeConfig[] {
    const activeCategoryIds = new Set(categoryIds);
    return userMagicTypes.filter(magicType => activeCategoryIds.has(magicType.category));
}
