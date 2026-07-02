import { expect } from 'vitest';
import {
    GRAPH_NODE_TYPES,
    MAGIC_NODE_KINDS,
} from '../constants/graphConfigs';
import { graphStore } from '../stores/graphStore.svelte';
import {
    type CirclePath,
} from '../systems/graph/calculation/magicCalculationTypes';
import {
    type MagicCircleSystemNode,
    type MagicCircleSystemNodeData,
    type MagicNode,
    type MagicUserNode,
    type MagicUserNodeData,
} from '../systems/graph/magicGraphTypes';
import {
    type MagicType,
} from '../types/magicTypeConfig';
import {
    getMagicUnitNodes,
} from '../systems/graph/model/magicCircleGraph';
import type { MagicGraphEdge } from '../systems/graph/magicGraphTypes';

export const EMPTY_MAGIC_STAT_EFFECTS = {
    nodeEffects: [],
    finalEffects: [],
};

type TestMagicUserNodeData =
    Partial<Omit<MagicUserNodeData, 'magicType' | 'nodeKind'>> & {
        nodeKind?: 'user';
    };

type TestMagicCircleSystemNodeData =
    Partial<Omit<MagicCircleSystemNodeData, 'magicType' | 'nodeKind'>> & {
        nodeKind: 'system';
    };

export function createTestMagicNode(
    id: string,
    magicType: MagicType,
    data: TestMagicCircleSystemNodeData
): MagicCircleSystemNode;
export function createTestMagicNode(
    id: string,
    magicType?: MagicType,
    data?: TestMagicUserNodeData
): MagicUserNode;
export function createTestMagicNode(
    id: string,
    magicType: MagicType = 'ignition',
    data: TestMagicUserNodeData | TestMagicCircleSystemNodeData = {}
): MagicNode {
    if (data.nodeKind === MAGIC_NODE_KINDS.SYSTEM) {
        return {
            id,
            type: GRAPH_NODE_TYPES.MAGIC_NODE,
            position: { x: 0, y: 0 },
            data: {
                ...data,
                magicType,
                nodeKind: MAGIC_NODE_KINDS.SYSTEM,
            },
        };
    }

    return {
        id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position: { x: 0, y: 0 },
        data: {
            ...data,
            magicType,
            nodeKind: MAGIC_NODE_KINDS.USER,
        },
    };
}

export function createTestMagicEdge(
    source: string,
    target: string,
    sourceHandle?: string,
    targetHandle?: string
): MagicGraphEdge {
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
        nodes: circle.nodes.map(cloneTestMagicNode),
    }));
}

function cloneTestMagicNode(node: MagicNode): MagicNode {
    if (node.data.nodeKind === MAGIC_NODE_KINDS.USER) {
        return {
            ...node,
            position: { ...node.position },
            data: { ...node.data },
        };
    }

    return {
        ...node,
        position: { ...node.position },
        data: { ...node.data },
    };
}
