import type { MagicGraphNode, MagicType, MagicTypeConfig } from '../../../types/magic';

export type MagicTypeLookup = readonly MagicTypeConfig[] | ReadonlyMap<string, MagicTypeConfig>;

export function readMagicTypeConfig(
    node: MagicGraphNode,
    magicTypes: MagicTypeLookup
): MagicTypeConfig | undefined {
    return readMagicTypeConfigByType(node.data.magicType, magicTypes);
}

export function readMagicTypeConfigByType(
    magicType: MagicType,
    magicTypes: MagicTypeLookup
): MagicTypeConfig | undefined {
    if ('get' in magicTypes) return magicTypes.get(magicType);
    return magicTypes.find(config => config.type === magicType);
}
