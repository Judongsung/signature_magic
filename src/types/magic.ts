import type { Node } from '@xyflow/svelte';
import magicTypesData from '../data/magicTypes.json';
import type { MagicNodeCategory } from '../constants/gameConfigs';

type MagicTypesData = typeof magicTypesData;

export type MagicType = MagicTypesData[number]['type'];

export interface MagicNodeConnectionLimits {
    maxInputs?: number | null;
    maxOutputs?: number | null;
}

export type MagicTypeConfig = Omit<MagicTypesData[number], 'category' | 'connectionLimits'> & {
    category: MagicNodeCategory;
    connectionLimits?: MagicNodeConnectionLimits;
};

export interface MagicNodeData extends Record<string, unknown> {
    magicType: MagicType;
    isRoot?: boolean;
    isLeaf?: boolean;
    inputHandleCount?: number;
    outputHandleCount?: number;
}

export type MagicNode = Node<MagicNodeData>;

export interface CirclePath {
    id: string;
    nodes: MagicNode[];
}
