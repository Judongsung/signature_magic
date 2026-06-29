import {
    EMPTY_MAGIC_STATS,
    type MagicType,
    type MagicNode,
    type MagicTypeConfig,
} from '../types/magic';

export interface CircleSystemMagicNodeConfig {
    magicType: MagicType;
    idSuffix: string;
}

export const CIRCLE_SYSTEM_MAGIC_NODE_TYPES = {
    MANIFESTATION: 'manifestation',
} as const;

export const CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS: CircleSystemMagicNodeConfig[] = [
    {
        magicType: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
        idSuffix: 'manifestation',
    },
];

export const SYSTEM_MAGIC_NODE_CONFIGS = {} as const;
export const SYSTEM_MAGIC_TYPE_CONFIGS: MagicTypeConfig[] = [
    {
        type: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
        label: '발현',
        icon: '✧',
        color: '#f7d774',
        category: 'control',
        description: '서클에서 형성된 마법을 다른 서클에 전파하거나 최종 발현한다.',
        connectionLimits: { maxInputs: 0, maxOutputs: 0 },
        stats: EMPTY_MAGIC_STATS,
    },
];
export const INITIAL_SYSTEM_MAGIC_NODE_CONFIGS: MagicNode[] = [];
