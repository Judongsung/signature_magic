import type { MagicGraphNode, MagicTypeConfig } from '../../../types/magic';

export type MagicTypeLookup = readonly MagicTypeConfig[] | ReadonlyMap<string, MagicTypeConfig>;

export function readMagicTypeConfig(
    node: MagicGraphNode,
    magicTypes: MagicTypeLookup
): MagicTypeConfig | undefined {
    if ('get' in magicTypes) return magicTypes.get(node.data.magicType);
    return magicTypes.find(magicType => magicType.type === node.data.magicType);
}
