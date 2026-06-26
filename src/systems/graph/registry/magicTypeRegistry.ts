import magicTypesData from '../../../data/magicTypes.json';
import type { MagicNodeCategory } from '../../../constants/nodeEditorConfigs';
import type { MagicType, MagicTypeConfig } from '../../../types/magic';
import { SYSTEM_MAGIC_TYPE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';

export const userMagicTypes = magicTypesData as MagicTypeConfig[];

export const magicTypes = [
    ...userMagicTypes,
    ...SYSTEM_MAGIC_TYPE_CONFIGS,
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
