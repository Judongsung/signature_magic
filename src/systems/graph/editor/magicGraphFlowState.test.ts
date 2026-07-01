import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import {
    createMagicCircleNode,
} from '../model/magicCircleGraph';
import { createMagicGraphDocument } from '../model/magicGraphDocument';
import {
    acceptMagicGraphFlowEdges,
    acceptMagicGraphFlowNodes,
    projectMagicGraphFlowNodes,
    promoteMagicCircleFlowPositions,
    readSelectedMagicGraphNodeIds,
    selectMagicGraphFlowNodes,
} from './magicGraphFlowState';

describe('magicGraphFlowState', () => {
    it('accepts only node view fields from Flow', () => {
        const documentNode = createTestMagicNode(
            'flow-node',
            'ignition'
        );
        const document = createMagicGraphDocument({
            nodes: [documentNode],
            edges: [],
        });
        const [accepted] = acceptMagicGraphFlowNodes(
            document.nodes,
            [{
                ...documentNode,
                parentId: 'forged-parent',
                position: { x: 320, y: 240 },
                selected: true,
                dragging: true,
                measured: { width: 120, height: 80 },
                data: {
                    ...documentNode.data,
                    magicType: 'forged-type',
                    sequenceIndex: 99,
                },
            }]
        );

        expect(accepted).toMatchObject({
            id: documentNode.id,
            position: { x: 320, y: 240 },
            selected: true,
            dragging: true,
            measured: { width: 120, height: 80 },
            data: {
                magicType: 'ignition',
            },
        });
        expect(accepted.parentId).toBe(documentNode.parentId);
    });

    it('keeps Flow-first removals in the view until document deletion', () => {
        const first = createTestMagicNode('first');
        const second = createTestMagicNode('second');
        const document = createMagicGraphDocument({
            nodes: [first, second],
            edges: [],
        });

        expect(acceptMagicGraphFlowNodes(
            document.nodes,
            [second]
        ).map(node => node.id)).toEqual([second.id]);
        expect(document.nodes.map(node => node.id))
            .toEqual([first.id, second.id]);
    });

    it('preserves selection and measurement while rebuilding document nodes', () => {
        const node = createTestMagicNode('projected');
        const document = createMagicGraphDocument({
            nodes: [node],
            edges: [],
        });
        const selected = selectMagicGraphFlowNodes(
            [node],
            new Set([node.id])
        ).map(item => ({
            ...item,
            measured: { width: 100, height: 60 },
        }));

        const projected = projectMagicGraphFlowNodes(
            document.nodes,
            selected
        );

        expect(projected[0]).toMatchObject({
            selected: true,
            measured: { width: 100, height: 60 },
        });
        expect(readSelectedMagicGraphNodeIds(projected))
            .toEqual(new Set([node.id]));
    });

    it('accepts edge selection without accepting edge topology changes', () => {
        const edge: Edge = {
            id: 'edge',
            source: 'source',
            target: 'target',
        };
        const document = createMagicGraphDocument({
            nodes: [],
            edges: [edge],
        });

        expect(acceptMagicGraphFlowEdges(
            document.edges,
            [{
                ...edge,
                source: 'forged-source',
                selected: true,
            }, edge]
        )).toEqual([expect.objectContaining({
            source: 'source',
            target: 'target',
            selected: true,
        })]);
    });

    it('promotes final circle positions without changing unit positions', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'circle'
        );
        const unit = createTestMagicNode('unit');
        const document = createMagicGraphDocument({
            nodes: [circle, unit],
            edges: [],
        });
        const flowNodes = projectMagicGraphFlowNodes(document.nodes)
            .map(node => ({
                ...node,
                position: node.id === circle.id
                    ? { x: 400, y: -200 }
                    : { x: 999, y: 999 },
            }));

        const commit = promoteMagicCircleFlowPositions(
            document.nodes,
            flowNodes
        );

        expect(commit.changed).toBe(true);
        expect(commit.nodes.find(node => node.id === circle.id)?.position)
            .toEqual({ x: 400, y: -200 });
        expect(commit.nodes.find(node => node.id === unit.id)?.position)
            .toEqual(unit.position);
    });
});
