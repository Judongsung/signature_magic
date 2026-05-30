import magicTypesData from '../data/magicTypes.json';
import type { MagicNodeCategory } from '../constants/gameConfigs';
import type { MagicType, MagicTypeConfig } from '../types/magic';

export const magicTypes = magicTypesData as MagicTypeConfig[];

export const magicTypeMap = new Map<MagicType, MagicTypeConfig>(
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
    return magicTypes.filter(magicType => activeCategoryIds.has(magicType.category));
}
