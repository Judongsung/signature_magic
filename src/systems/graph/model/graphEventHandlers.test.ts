import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import {
    MAGIC_CIRCLE_HANDLE_IDS,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import {
    CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS,
} from '../../../constants/circleSystemMagicNodeConfigs';
import {
    type MagicUserNode,
} from '../magicGraphTypes';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from './magicCircleGraph';
import { createCircleSystemMagicNode } from './circleSystemMagicNodes';
import {
    isMagicCircleConnectionJoinNode,
} from './magicCircleConnectionNodes';
import {
    prepareGraphEdge,
    removeDeletedGraphElements,
    syncGraphTopology,
} from './graphEventHandlers';

const circleSystemNodeConfig = CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS[0];

function node(id: string, magicType = 'ignition'): MagicUserNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 0, y: 0 },
        data: { magicType, nodeKind: 'user' },
    };
}

function externalEdge(
    id: string,
    source: string,
    target: string,
    sourceHandle: string = MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
    targetHandle: string = MAGIC_CIRCLE_HANDLE_IDS.INPUT
): Edge {
    return { id, source, target, sourceHandle, targetHandle };
}

describe('graphEventHandlers', () => {
    it('replaces an edge occupying the same circle port', () => {
        const source = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'source'
        );
        const previousTarget = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'previous'
        );
        const nextTarget = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'next'
        );
        const update = prepareGraphEdge(
            {
                source: source.id,
                target: nextTarget.id,
                sourceHandle: MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
                targetHandle: MAGIC_CIRCLE_HANDLE_IDS.INPUT,
            },
            {
                nodes: [source, previousTarget, nextTarget],
                edges: [externalEdge(
                    'old',
                    source.id,
                    previousTarget.id
                )],
            }
        );

        expect(update && update.edges).toEqual([]);
        expect(update && update.edge).toMatchObject({
            source: source.id,
            target: nextTarget.id,
        });
    });

    it('removes a deleted circle with its children and related edges', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'deleted'
        );
        const outside = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'outside'
        );
        const child = attachNodeToCircle(node('child'), circle, 0);
        const systemNode = createCircleSystemMagicNode(
            circle,
            circleSystemNodeConfig,
            1
        );
        const snapshot = {
            nodes: [circle, child, systemNode, outside],
            edges: [externalEdge('circle-edge', circle.id, outside.id)],
        };

        expect(removeDeletedGraphElements(snapshot, [circle], []))
            .toEqual({
                nodes: [outside],
                edges: [],
            });
    });

    it('preserves a circle system node requested for direct deletion', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'manifestation'
        );
        const systemNode = createCircleSystemMagicNode(
            circle,
            circleSystemNodeConfig,
            0
        );

        expect(removeDeletedGraphElements(
            { nodes: [circle, systemNode], edges: [] },
            [systemNode],
            []
        ).nodes.map(item => item.id)).toEqual([
            circle.id,
            systemNode.id,
        ]);
    });

    it('deletes both control markers while preserving enclosed nodes', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'paired'
        );
        const start = attachNodeToCircle({
            ...node('repeat-start', 'repeat'),
            data: {
                ...node('repeat-start', 'repeat').data,
                controlPair: {
                    id: 'repeat-pair',
                    role: MAGIC_CONTROL_PAIR_ROLES.START,
                },
            },
        }, circle, 0);
        const middle = attachNodeToCircle(node('middle'), circle, 1);
        const end = attachNodeToCircle({
            ...node('repeat-end', 'repeat'),
            data: {
                ...node('repeat-end', 'repeat').data,
                controlPair: {
                    id: 'repeat-pair',
                    role: MAGIC_CONTROL_PAIR_ROLES.END,
                },
                excludeFromStatScaling: true,
            },
        }, circle, 2);

        const result = removeDeletedGraphElements(
            { nodes: [circle, start, middle, end], edges: [] },
            [start],
            []
        );

        expect(result.nodes.map(item => item.id))
            .toEqual([circle.id, middle.id]);
    });

    it('compacts circle ports and keeps one trailing empty port', () => {
        const sourceA = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'source-a'
        );
        const sourceB = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'source-b'
        );
        const target = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'target'
        );
        const firstSync = syncGraphTopology({
            nodes: [sourceA, sourceB, target],
            edges: [
                externalEdge(
                    'input-0',
                    sourceA.id,
                    target.id
                ),
                externalEdge(
                    'input-1',
                    sourceB.id,
                    target.id,
                    MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
                    `${MAGIC_CIRCLE_HANDLE_IDS.INPUT}-1`
                ),
            ],
        });

        expect(firstSync.nodes.find(node => node.id === target.id)
            ?.data.inputHandleCount).toBe(3);
        expect(firstSync.nodes.find(node => node.id === sourceA.id)
            ?.data.outputHandleCount).toBe(1);
        expect(firstSync.nodes.find(node => node.id === sourceB.id)
            ?.data.outputHandleCount).toBe(1);
        expect(firstSync.nodes
            .filter(isMagicCircleConnectionJoinNode)
            .map(join => join.data.connectionJoin.sourceCircleId)
            .sort()).toEqual([
                sourceA.id,
                sourceB.id,
            ].sort());

        const secondSync = syncGraphTopology({
            nodes: firstSync.nodes,
            edges: [firstSync.edges[1]],
        });

        expect(secondSync.edges[0].targetHandle)
            .toBe(MAGIC_CIRCLE_HANDLE_IDS.INPUT);
        expect(secondSync.nodes.find(node => node.id === target.id)
            ?.data.inputHandleCount).toBe(2);
        expect(secondSync.nodes.find(node => node.id === sourceA.id)
            ?.data.outputHandleCount).toBe(1);
        expect(secondSync.nodes.find(node => node.id === sourceB.id)
            ?.data.outputHandleCount).toBe(1);
        expect(secondSync.nodes
            .filter(isMagicCircleConnectionJoinNode)
            .map(join => join.data.connectionJoin.edgeId))
            .toEqual(['input-1']);
    });

    it('restores a directly deleted join and removes it with its edge', () => {
        const source = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'source'
        );
        const target = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'target'
        );
        const edge = externalEdge(
            'edge-connection',
            source.id,
            target.id
        );
        const connected = syncGraphTopology({
            nodes: [source, target],
            edges: [edge],
        });
        const join = connected.nodes.find(
            isMagicCircleConnectionJoinNode
        )!;

        const directDeletion = removeDeletedGraphElements(
            {
                nodes: connected.nodes,
                edges: connected.edges,
            },
            [join],
            []
        );
        expect(directDeletion.nodes.some(node =>
            node.id === join.id
        )).toBe(true);

        const disconnected = syncGraphTopology({
            nodes: connected.nodes,
            edges: [],
        });
        expect(disconnected.nodes.some(
            isMagicCircleConnectionJoinNode
        )).toBe(false);
    });
});
