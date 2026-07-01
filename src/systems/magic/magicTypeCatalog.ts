import magicTypesData from '../../data/magicTypes.json';
import {
    type MagicType,
    type MagicTypeConfig,
} from '../../types/magicTypeConfig';

export const userMagicTypes = magicTypesData as MagicTypeConfig[];

const userMagicTypeMap: ReadonlyMap<MagicType, MagicTypeConfig> = new Map(
    userMagicTypes.map(config => [config.type, config])
);

export function getUserMagicTypeLabel(type: MagicType): string | undefined {
    return userMagicTypeMap.get(type)?.label;
}
