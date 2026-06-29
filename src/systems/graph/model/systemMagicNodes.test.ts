import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import {
    GRAPH_NODE_TYPES,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import type { MagicNode, MagicType } from '../../../types/magic';
import {
    createInitialSystemNodes,
    ensureSystemMagicNodes,
    filterCalculableMagicGraph,
} from './systemMagicNodes';

function node(id: string, magicType: MagicType = 'ignition'): MagicNode {
    return {
        id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position: { x: 0, y: 0 },
        data: { magicType, nodeKind: MAGIC_NODE_KINDS.USER },
    };
}

function edge(source: string, target: string): Edge {
    return { id: `${source}-${target}`, source, target };
}

describe('systemMagicNodes', () => {
    it('creates fixed source and output nodes with stable ids', () => {
        const nodes = createInitialSystemNodes();

        expect(nodes.map(n => n.id)).toEqual([
            SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
            SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
        ]);
        expect(nodes[0].deletable).toBe(false);
        expect(nodes[1].deletable).toBe(false);
        expect(nodes[0].position.y).toBeLessThan(nodes[1].position.y);
    });

    it('normalizes existing system nodes back to their fixed contract', () => {
        const [source] = createInitialSystemNodes();
        const corruptedSource: MagicNode = {
            ...source,
            deletable: true,
            data: {
                magicType: 'ignition',
                nodeKind: MAGIC_NODE_KINDS.USER,
                isRoot: false,
                isLeaf: true,
                inputHandleCount: 3,
                outputHandleCount: 0,
            },
        };

        const [restoredFinalOutput, normalizedSource] = ensureSystemMagicNodes([corruptedSource]);

        expect(restoredFinalOutput).toMatchObject({
            id: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
            deletable: false,
        });
        expect(normalizedSource).toMatchObject({
            id: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
            deletable: false,
            data: {
                magicType: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
                nodeKind: MAGIC_NODE_KINDS.SYSTEM,
                isRoot: true,
                isLeaf: false,
                inputHandleCount: 0,
                outputHandleCount: 1,
            },
        });
    });

    it('filters calculation to user nodes that are between source and output', () => {
        const nodes = [
            ...createInitialSystemNodes(),
            node('a'),
            node('b'),
            node('off-path'),
        ];
        const edges = [
            edge(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id, 'a'),
            edge('a', 'b'),
            edge('b', SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id),
            edge(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id, 'off-path'),
        ];

        expect(filterCalculableMagicGraph(nodes, edges)).toEqual({
            nodes: [node('a'), node('b')],
            edges: [edge('a', 'b')],
        });
    });

    it('preserves normal calculation graphs when system anchors are absent', () => {
        const nodes = [node('a'), node('b')];
        const edges = [edge('a', 'b')];

        expect(filterCalculableMagicGraph(nodes, edges)).toEqual({ nodes, edges });
    });

    it('excludes system nodes from calculation even when only one anchor is present', () => {
        const source = {
            ...createInitialSystemNodes()[0],
            data: { magicType: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id, nodeKind: MAGIC_NODE_KINDS.SYSTEM },
        };
        const nodes = [source, node('a')];

        expect(filterCalculableMagicGraph(nodes, [edge(source.id, 'a')])).toEqual({
            nodes: [node('a')],
            edges: [],
        });
    });
});
