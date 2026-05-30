import type { Node } from '@xyflow/svelte';
import magicTypesData from '../data/magicTypes.json';
import type { MagicNodeCategory } from '../constants/gameConfigs';

type MagicTypesData = typeof magicTypesData;

export type MagicTypeConfig = MagicTypesData[number] & {
    category: MagicNodeCategory;
};
export type MagicType = MagicTypeConfig['type'];

export interface MagicNodeData extends Record<string, unknown> {
    magicType: MagicType;
    isRoot?: boolean;
    isLeaf?: boolean;
}

export type MagicNode = Node<MagicNodeData>;

export interface CirclePath {
    id: string;
    nodes: MagicNode[];
}
