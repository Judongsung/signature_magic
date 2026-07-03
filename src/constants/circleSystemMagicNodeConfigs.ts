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
    fixedAtSequenceEnd?: boolean;
}

export const CIRCLE_SYSTEM_MAGIC_NODE_TYPES = {
    MANIFESTATION: 'manifestation',
    CONNECTION_JOIN: 'circleJoin',
} as const;

export const CIRCLE_SYSTEM_MAGIC_NODE_PRESENTATIONS = {
    MANIFESTATION: {
        label: '발현',
        description: '서클에서 완성된 마법을 외부에 발현한다.',
    },
    TRANSFER: {
        label: '전달',
        description: '이 서클에서 완성된 마법을 다음 서클로 전달한다.',
    },
} as const;

export const CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS: CircleSystemMagicNodeConfig[] = [
    {
        magicType: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
        idSuffix: 'manifestation',
        fixedAtSequenceEnd: true,
    },
];

export const CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS: MagicTypeConfig[] = [
    {
        type: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
        label: CIRCLE_SYSTEM_MAGIC_NODE_PRESENTATIONS.MANIFESTATION.label,
        icon: '✧',
        color: '#f7d774',
        category: 'control',
        description:
            CIRCLE_SYSTEM_MAGIC_NODE_PRESENTATIONS.MANIFESTATION.description,
        instanceEditor: {
            fields: [MAGIC_NODE_DEFAULT_CAPTION_EDITOR_FIELD],
        },
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
