import type { Edge } from '@xyflow/svelte';
import { expect } from 'vitest';
import { GRAPH_NODE_TYPES } from '../constants/graphConfigs';
import { graphStore } from '../stores/graphStore.svelte';
import type { CirclePath, MagicNode, MagicType } from '../types/magic';
import {
    getMagicCircleNodes,
    getMagicUnitNodes,
} from '../systems/graph/model/magicCircleGraph';

export const EMPTY_MAGIC_STAT_EFFECTS = {
    nodeEffects: [],
    finalEffects: [],
};

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
    sourceHandle?: string,
    targetHandle?: string
): Edge {
    return { id: `${source}-${target}`, source, target, sourceHandle, targetHandle };
}

export function resetGraphStoreFixture(): void {
    graphStore.clear();
    graphStore.setExternalStatEffects(EMPTY_MAGIC_STAT_EFFECTS);
}

export function createSingleNodeCircleFixture(): CirclePath[] {
    graphStore.addNode('ignition');
    const userNode = getMagicUnitNodes(graphStore.nodes)
        .find(node => node.data.magicType === 'ignition');
    expect(userNode).toBeDefined();

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
