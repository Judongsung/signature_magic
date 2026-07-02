import type { Connection, Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { GRAPH_NODE_TYPES } from '../../../constants/graphConfigs';
import {
    type MagicCircleNode,
    type MagicEditorNode,
    type MagicNode,
} from '../magicGraphTypes';
import {
    createExplicitMagicCircleEdgeUpdate,
    isExplicitMagicCircleConnectionValid,
} from './magicCircleConnectionRules';

function circle(id: string): MagicCircleNode {
    return {
        id,
        type: GRAPH_NODE_TYPES.MAGIC_CIRCLE,
        position: { x: 0, y: 0 },
        width: 480,
        height: 640,
        data: {
            nodeKind: 'circle',
            inputHandleCount: 1,
            outputHandleCount: 1,
        },
    };
}

function node(id: string, circleId: string): MagicNode {
    return {
        id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        parentId: circleId,
        position: { x: 40, y: 80 },
        data: {
            magicType: 'ignition',
            nodeKind: 'user',
            sequenceIndex: 0,
        },
    };
}

function connection(
    source: string,
    target: string,
    sourceHandle: string,
    targetHandle: string
): Connection {
    return { source, target, sourceHandle, targetHandle };
}

describe('magicCircleConnectionRules', () => {
    it('allows only circle output to circle input connections', () => {
        const source = circle('circle-source');
        const box = circle('circle-target');
        const nodes: MagicEditorNode[] = [
            source,
            box,
            node('unit', box.id),
        ];

        expect(isExplicitMagicCircleConnectionValid(connection(
            source.id,
            box.id,
            'circle-output',
            'circle-input'
        ), [], nodes)).toBe(true);
        expect(isExplicitMagicCircleConnectionValid(connection(
            'system-mana-source',
            box.id,
            'output-0',
            'circle-input'
        ), [], nodes)).toBe(false);
    });

    it('rejects all internal and cross-circle unit edges', () => {
        const first = circle('circle-a');
        const second = circle('circle-b');
        const firstNode = node('first', first.id);
        const secondNode = node('second', second.id);
        const nodes: MagicEditorNode[] = [
            first,
            second,
            firstNode,
            secondNode,
        ];

        expect(isExplicitMagicCircleConnectionValid(connection(
            firstNode.id,
            secondNode.id,
            'output-0',
            'input-0'
        ), [], nodes)).toBe(false);
        expect(isExplicitMagicCircleConnectionValid(connection(
            first.id,
            firstNode.id,
            'circle-output',
            'input-0'
        ), [], nodes)).toBe(false);
    });

    it('rejects cycles between circle output and input ports', () => {
        const first = circle('circle-a');
        const second = circle('circle-b');
        const nodes: MagicEditorNode[] = [
            first,
            second,
        ];
        const edges: Edge[] = [{
            id: 'first-second',
            source: first.id,
            target: second.id,
            sourceHandle: 'circle-output',
            targetHandle: 'circle-input',
        }];

        expect(isExplicitMagicCircleConnectionValid(connection(
            second.id,
            first.id,
            'circle-output-1',
            'circle-input-1'
        ), edges, nodes)).toBe(false);
    });

    it('replaces only an occupied dynamic external port', () => {
        const first = circle('circle-a');
        const second = circle('circle-b');
        const third = circle('circle-c');
        const box = circle('circle-target');
        const nodes: MagicEditorNode[] = [
            first,
            second,
            third,
            box,
        ];
        const edges: Edge[] = [
            {
                id: 'source-a',
                source: first.id,
                target: box.id,
                sourceHandle: 'circle-output',
                targetHandle: 'circle-input',
            },
            {
                id: 'source-b',
                source: second.id,
                target: box.id,
                sourceHandle: 'circle-output',
                targetHandle: 'circle-input-1',
            },
        ];
        const update = createExplicitMagicCircleEdgeUpdate(
            connection(
                third.id,
                box.id,
                'circle-output',
                'circle-input-1'
            ),
            edges,
            nodes,
            () => 'replacement'
        );

        expect(update && update.edges.map(edge => edge.id)).toEqual(['source-a']);
        expect(update && update.edge).toMatchObject({
            sourceHandle: 'circle-output',
            targetHandle: 'circle-input-1',
        });
    });

    it('replaces the previous destination of the single output', () => {
        const source = circle('circle-source');
        const firstTarget = circle('circle-first-target');
        const nextTarget = circle('circle-next-target');
        const edges: Edge[] = [{
            id: 'existing-output',
            source: source.id,
            target: firstTarget.id,
            sourceHandle: 'circle-output-3',
            targetHandle: 'circle-input',
        }];

        const update = createExplicitMagicCircleEdgeUpdate(
            connection(
                source.id,
                nextTarget.id,
                'circle-output',
                'circle-input'
            ),
            edges,
            [source, firstTarget, nextTarget],
            () => 'rewired'
        );

        expect(update && update.edges).toEqual([]);
        expect(update && update.edge).toMatchObject({
            source: source.id,
            target: nextTarget.id,
            sourceHandle: 'circle-output',
        });
    });
});
