import type { Connection, Edge } from '@xyflow/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { graphStore } from './graphStore.svelte';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../constants/systemMagicNodeConfigs';
import { isSystemMagicNode } from '../systems/graph/model/systemMagicNodes';

const EMPTY_EFFECTS = {
    nodeEffects: [],
    finalEffects: [],
};

function resetGraphStore(): void {
    graphStore.clear();
    graphStore.setExternalStatEffects(EMPTY_EFFECTS);
}

function connection(source: string, target: string): Connection {
    return {
        source,
        target,
        sourceHandle: 'output-0',
        targetHandle: 'input-0',
    };
}

function edge(id: string, source: string, target: string, targetHandle = 'input-0'): Edge {
    return {
        id,
        source,
        target,
        sourceHandle: 'output-0',
        targetHandle,
    };
}

function appendPreparedEdge(conn: Connection): Edge {
    const preparedEdge = graphStore.prepareEdge(conn);

    expect(preparedEdge).not.toBe(false);
    graphStore.edges = [...graphStore.edges, preparedEdge as Edge];
    graphStore.onEdgeConnected(conn);

    return preparedEdge as Edge;
}

async function flushTopologySync(): Promise<void> {
    await new Promise<void>(resolve => {
        setTimeout(resolve, 0);
    });
}

function userNodes() {
    return graphStore.nodes.filter(node => !isSystemMagicNode(node));
}

function systemNode(id: string) {
    return graphStore.nodes.find(node => node.id === id);
}

describe('graphStore', () => {
    beforeEach(() => {
        resetGraphStore();
    });

    it('starts with the fixed system nodes', () => {
        expect(graphStore.nodes).toHaveLength(2);
        expect(systemNode(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id)?.data.inputHandleCount).toBe(0);
        expect(systemNode(SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id)?.data.outputHandleCount).toBe(0);
    });

    it('clear resets the graph back to only the fixed system nodes', () => {
        graphStore.addNode('ignition', { x: 0, y: 0 });
        graphStore.clear();

        expect(graphStore.nodes).toHaveLength(2);
        expect(systemNode(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id)).toBeTruthy();
        expect(systemNode(SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id)).toBeTruthy();
        expect(graphStore.edges).toHaveLength(0);
    });

    it('adds nodes without calculating them until they are between source and output', () => {
        graphStore.addNode('ignition', { x: 0, y: 0 });

        expect(userNodes()).toHaveLength(1);
        expect(userNodes()[0].data.magicType).toBe('ignition');
        expect(graphStore.circles).toHaveLength(0);
        expect(graphStore.totalStats.power).toBe(0);
    });

    it('calculates only user nodes connected from source to final output', () => {
        graphStore.addNode('ignition', { x: 0, y: 0 });
        graphStore.addNode('stream', { x: 80, y: 0 });

        const [connected, disconnected] = userNodes();
        const source = systemNode(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id)!;
        const output = systemNode(SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id)!;
        const sourceEdge = graphStore.prepareEdge(connection(source.id, connected.id));
        const outputEdge = graphStore.prepareEdge(connection(connected.id, output.id));

        graphStore.edges = [
            ...(sourceEdge ? [sourceEdge] : []),
            ...(outputEdge ? [outputEdge] : []),
        ];

        expect(disconnected.data.magicType).toBe('stream');
        expect(graphStore.circles).toHaveLength(1);
        expect(graphStore.totalStats.power).toBe(4);
    });

    it('prepares valid edges and stages same-handle replacements', () => {
        graphStore.addNode('ignition', { x: 0, y: 0 });
        graphStore.addNode('stream', { x: 80, y: 0 });

        const [source, target] = userNodes();
        const conn = connection(source.id, target.id);
        const firstEdge = graphStore.prepareEdge(conn);

        expect(firstEdge).not.toBe(false);
        if (firstEdge) {
            graphStore.edges = [...graphStore.edges, firstEdge];
        }
        expect(graphStore.edges).toHaveLength(1);
        expect(graphStore.checkConnection(conn)).toBe(true);

        const replacementEdge = graphStore.prepareEdge(conn);

        expect(replacementEdge).not.toBe(false);
        expect(graphStore.edges).toHaveLength(0);
    });

    it('applies externally injected stat effects without depending on CYOA state', () => {
        graphStore.addNode('ignition', { x: 0, y: 0 });
        const [userNode] = userNodes();
        const source = systemNode(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id)!;
        const output = systemNode(SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id)!;
        const sourceEdge = graphStore.prepareEdge(connection(source.id, userNode.id));
        const outputEdge = graphStore.prepareEdge(connection(userNode.id, output.id));
        graphStore.edges = [
            ...(sourceEdge ? [sourceEdge] : []),
            ...(outputEdge ? [outputEdge] : []),
        ];

        graphStore.setExternalStatEffects({
            nodeEffects: [],
            finalEffects: [
                { phase: 'final', operation: 'add', stat: 'power', value: 10 },
            ],
        });

        expect(graphStore.totalStats.power).toBe(14);
    });

    it('keeps system nodes when deletion events include them', () => {
        const source = systemNode(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id)!;

        graphStore.onDelete([source], []);

        expect(systemNode(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id)).toBeTruthy();
        expect(systemNode(SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id)).toBeTruthy();
    });

    it('handles add, connect, delete, and handle normalization through store events', async () => {
        graphStore.addNode('ignition', { x: 0, y: 0 });
        graphStore.addNode('stream', { x: 80, y: 0 });
        graphStore.addNode('merge', { x: 160, y: 0 });

        const [firstNode, remainingInputNode, mergeNode] = userNodes();
        const source = systemNode(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id)!;
        const output = systemNode(SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id)!;
        const sourceEdge = appendPreparedEdge(connection(source.id, firstNode.id));
        const firstToMergeEdge = appendPreparedEdge(connection(firstNode.id, mergeNode.id));
        appendPreparedEdge(connection(mergeNode.id, output.id));

        const remainingInputEdge = edge(
            'remaining-input-to-merge',
            remainingInputNode.id,
            mergeNode.id,
            'input-2'
        );
        graphStore.edges = [...graphStore.edges, remainingInputEdge];

        graphStore.onDelete([firstNode], [sourceEdge, firstToMergeEdge]);
        await flushTopologySync();

        expect(systemNode(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id)).toBeTruthy();
        expect(systemNode(SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id)).toBeTruthy();
        expect(userNodes().map(node => node.id)).toEqual([remainingInputNode.id, mergeNode.id]);
        expect(graphStore.edges).toHaveLength(2);
        expect(
            graphStore.edges.find(item => item.id === remainingInputEdge.id)
        ).toMatchObject({
            source: remainingInputNode.id,
            target: mergeNode.id,
            sourceHandle: 'output-0',
            targetHandle: 'input-0',
        });
    });
});
