import {
    EMPTY_MAGIC_STATS,
} from '../types/magicStats';
import {
    type MagicType,
    type MagicTypeConfig,
} from '../types/magicTypeConfig';
import {
    MAGIC_NODE_DEFAULT_CAPTION_EDITOR_FIELD,
} from './nodeEditorConfigs';

export interface CircleSystemMagicNodeConfig {
    magicType: MagicType;
    idSuffix: string;
}

export const CIRCLE_SYSTEM_MAGIC_NODE_TYPES = {
    MANIFESTATION: 'manifestation',
    CONNECTION_JOIN: 'circleJoin',
} as const;

export const CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS: CircleSystemMagicNodeConfig[] = [
    {
        magicType: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
        idSuffix: 'manifestation',
    },
];

export const CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS: MagicTypeConfig[] = [
    {
        type: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
        label: '발현',
        icon: '✧',
        color: '#f7d774',
        category: 'control',
        description: '배치된 위치까지 형성된 마법을 외부에 발현한다.',
        instanceEditor: {
            fields: [MAGIC_NODE_DEFAULT_CAPTION_EDITOR_FIELD],
        },
        stats: EMPTY_MAGIC_STATS,
    },
    {
        type: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.CONNECTION_JOIN,
        label: '합류',
        icon: '⇥',
        color: '#78c6d0',
        category: 'control',
        description: '이전 서클에서 완성된 마법이 현재 서클에 합류하는 위치를 표시한다.',
        stats: EMPTY_MAGIC_STATS,
    },
];
