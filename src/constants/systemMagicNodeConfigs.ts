import type { MagicNode, MagicTypeConfig } from '../types/magic';
import { EMPTY_MAGIC_STATS } from '../types/magic';
import {
    GRAPH_NODE_TYPES,
    MAGIC_NODE_HANDLE_CONFIG,
    MAGIC_NODE_KINDS,
} from './graphConfigs';

export const SYSTEM_MAGIC_NODE_CONFIGS = {
    MANA_SOURCE: {
        id: 'system-mana-source',
        label: '마나 공급원',
        icon: '⊕',
        color: '#41d6a4',
        category: 'basic',
        description: '서클에 마나를 공급합니다.',
        position: { x: 400, y: 500 },
        role: { isRoot: true, isLeaf: false },
        handleCounts: { inputHandleCount: 0, outputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT },
        connectionLimits: { maxInputs: 0, maxOutputs: null },
    },
    FINAL_OUTPUT: {
        id: 'system-final-output',
        label: '최종 출력',
        icon: '⟡',
        color: '#ff8b6f',
        category: 'basic',
        description: '마법의 최종 출력입니다.',
        position: { x: 400, y: 0 },
        role: { isRoot: false, isLeaf: true },
        handleCounts: { inputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT, outputHandleCount: 0 },
        connectionLimits: { maxInputs: null, maxOutputs: 0 },
    },
} as const;

export const SYSTEM_MAGIC_TYPE_CONFIGS: MagicTypeConfig[] = [
    {
        type: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
        label: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.label,
        icon: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.icon,
        color: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.color,
        category: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.category,
        description: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.description,
        connectionLimits: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.connectionLimits,
        stats: { ...EMPTY_MAGIC_STATS },
    },
    {
        type: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
        label: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.label,
        icon: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.icon,
        color: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.color,
        category: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.category,
        description: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.description,
        connectionLimits: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.connectionLimits,
        stats: { ...EMPTY_MAGIC_STATS },
    },
];

export const INITIAL_SYSTEM_MAGIC_NODE_CONFIGS: MagicNode[] = [
    {
        id: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position: { ...SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.position },
        deletable: false,
        data: {
            magicType: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
            nodeKind: MAGIC_NODE_KINDS.SYSTEM,
            ...SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.role,
            ...SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.handleCounts,
        },
    },
    {
        id: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position: { ...SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.position },
        deletable: false,
        data: {
            magicType: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
            nodeKind: MAGIC_NODE_KINDS.SYSTEM,
            ...SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.role,
            ...SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.handleCounts,
        },
    },
];
