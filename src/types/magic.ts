import type { Node } from '@xyflow/svelte';
import magicTypesData from '../data/magicTypes.json';
import type { MagicNodeCategory } from '../constants/gameConfigs';

type MagicTypesData = typeof magicTypesData;

export type MagicType = MagicTypesData[number]['type'];

export const MAGIC_STAT_KEYS = [
    'castingTime',
    'instability',
    'power',
    'range',
    'manaCost',
    'duration',
] as const;

export type MagicStatKey = (typeof MAGIC_STAT_KEYS)[number];

export type MagicStats = Record<MagicStatKey, number>;

export type MagicStatsConfig = Partial<MagicStats>;

export const EMPTY_MAGIC_STATS: MagicStats = {
    castingTime: 0,
    instability: 0,
    power: 0,
    range: 0,
    manaCost: 0,
    duration: 0,
};

export const MAGIC_STAT_LABELS: Record<MagicStatKey, string> = {
    castingTime: '캐스팅 시간',
    instability: '불안정성',
    power: '출력',
    range: '범위',
    manaCost: '마나 소모',
    duration: '지속 시간',
};

export interface MagicNodeConnectionLimits {
    maxInputs?: number | null;
    maxOutputs?: number | null;
}

export type MagicTypeConfig = Omit<MagicTypesData[number], 'category' | 'connectionLimits' | 'stats'> & {
    category: MagicNodeCategory;
    connectionLimits?: MagicNodeConnectionLimits;
    stats?: MagicStatsConfig;
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
    stats: MagicStats;
}
