import type { Connection, Edge } from '@xyflow/svelte';
import { expect } from 'vitest';
import { MAGIC_CONNECTION_RULE_KEYS } from '../constants/gameConfigs';
import {
    GRAPH_NODE_TYPES,
    MAGIC_NODE_HANDLE_CONFIG,
} from '../constants/graphConfigs';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../constants/systemMagicNodeConfigs';
import { graphStore } from '../stores/graphStore.svelte';
import type { CirclePath, MagicNode, MagicType, MagicTypeConfig } from '../types/magic';

export const EMPTY_MAGIC_STAT_EFFECTS = {
    nodeEffects: [],
    finalEffects: [],
};

export const BASIC_TEST_MAGIC_TYPES = [
    { type: 'ignition', label: 'Ignition', icon: '', color: '#fff', category: 'basic', description: 'basic' },
    {
        type: 'split',
        label: 'Split',
        icon: '',
        color: '#fff',
        category: 'extension',
        description: 'split',
        connectionLimits: { maxInputs: 1, maxOutputs: null },
    },
    {
        type: 'merge',
        label: 'Merge',
        icon: '',
        color: '#fff',
        category: 'extension',
        description: 'merge',
        connectionLimits: { maxInputs: null, maxOutputs: 1 },
    },
    {
        type: 'repeat',
        label: 'Repeat',
        icon: '',
        color: '#fff',
        category: 'control',
        description: 'repeat',
        connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
    },
] as MagicTypeConfig[];

export function createTestMagicNode(
    id: string,
    magicType: MagicType = 'ignition',
    data: Partial<MagicNode['data']> = {}
): MagicNode {
    return {
        id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position: { x: 0, y: 0 },
        data: { magicType, ...data },
    };
}

export function createTestMagicEdge(
    source: string,
    target: string,
    sourceHandle: string = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
    targetHandle: string = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID
): Edge {
    return { id: `${source}-${target}`, source, target, sourceHandle, targetHandle };
}

export function createTestMagicConnection(
    source: string,
    target: string,
    sourceHandle: string | null = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
    targetHandle: string | null = MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID
): Connection {
    return { source, target, sourceHandle, targetHandle };
}

export function resetGraphStoreFixture(): void {
    graphStore.clear();
    graphStore.setExternalStatEffects(EMPTY_MAGIC_STAT_EFFECTS);
}

export function createSingleNodeCircleFixture(): CirclePath[] {
    graphStore.addNode('ignition', { x: 0, y: 0 });
    const userNode = graphStore.nodes.find(node => node.data.magicType === 'ignition');
    expect(userNode).toBeDefined();

    const sourceEdge = graphStore.prepareEdge({
        source: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
        target: userNode!.id,
        sourceHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
        targetHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID,
    });
    const outputEdge = graphStore.prepareEdge({
        source: userNode!.id,
        target: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
        sourceHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
        targetHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID,
    });
    graphStore.edges = [
        ...(sourceEdge ? [sourceEdge] : []),
        ...(outputEdge ? [outputEdge] : []),
    ];

    return graphStore.circles.map(circle => ({
        ...circle,
        stats: { ...circle.stats },
        statAdjustments: { ...circle.statAdjustments },
        nodes: circle.nodes.map(node => ({
            ...node,
            position: { ...node.position },
            data: { ...node.data },
        })),
    }));
}
