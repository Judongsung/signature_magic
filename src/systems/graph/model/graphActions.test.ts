import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import {
    GRAPH_NODE_TYPES,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import {
    createNode,
    filterEdgesForDeletedNodes,
} from './graphActions';

function edge(source: string, target: string): Edge {
    return { id: `${source}-${target}`, source, target };
}

describe('graphActions', () => {
    it('creates user nodes with an injected stable id', () => {
        expect(createNode(
            'stream',
            { x: 10, y: 20 },
            () => 'fixed-id'
        )).toEqual({
            id: 'node-fixed-id',
            type: GRAPH_NODE_TYPES.MAGIC_NODE,
            position: { x: 10, y: 20 },
            data: {
                magicType: 'stream',
                nodeKind: MAGIC_NODE_KINDS.USER,
            },
        });
    });

    it('filters every edge connected to deleted nodes', () => {
        expect(filterEdgesForDeletedNodes(
            new Set(['b']),
            [edge('a', 'b'), edge('b', 'c'), edge('c', 'd')]
        )).toEqual([edge('c', 'd')]);
    });
});
