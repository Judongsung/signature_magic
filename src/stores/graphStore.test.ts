import type { Connection } from '@xyflow/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { graphStore } from './graphStore.svelte';

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

describe('graphStore', () => {
    beforeEach(() => {
        resetGraphStore();
    });

    it('adds nodes and exposes calculated circles from graph state', () => {
        graphStore.addNode('ignition', { x: 0, y: 0 });

        expect(graphStore.nodes).toHaveLength(1);
        expect(graphStore.nodes[0].data.magicType).toBe('ignition');
        expect(graphStore.circles).toHaveLength(1);
        expect(graphStore.totalStats.power).toBe(4);
    });

    it('prepares valid edges and stages same-handle replacements', () => {
        graphStore.addNode('ignition', { x: 0, y: 0 });
        graphStore.addNode('stream', { x: 80, y: 0 });

        const [source, target] = graphStore.nodes;
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

        graphStore.setExternalStatEffects({
            nodeEffects: [],
            finalEffects: [
                { phase: 'final', operation: 'add', stat: 'power', value: 10 },
            ],
        });

        expect(graphStore.totalStats.power).toBe(14);
    });
});
