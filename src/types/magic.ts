import type { Node } from '@xyflow/svelte';
import magicTypesData from '../data/magicTypes.json';

type MagicTypesData = typeof magicTypesData;

export type MagicTypeConfig = MagicTypesData[number];
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
