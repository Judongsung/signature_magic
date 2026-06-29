import type { Connection, Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { GRAPH_NODE_TYPES } from '../../../constants/graphConfigs';
import type {
    MagicCircleNode,
    MagicEditorNode,
    MagicNode,
    MagicTypeConfig,
} from '../../../types/magic';
import {
    createExplicitMagicCircleEdgeUpdate,
    isExplicitMagicCircleConnectionValid,
} from './magicCircleConnectionRules';
import { createInitialSystemNodes } from './systemMagicNodes';

const magicTypes: MagicTypeConfig[] = [{
    type: 'ignition',
    label: 'Ignition',
    icon: '',
    color: '',
    category: 'basic',
    description: '',
}];

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
        position: { x: 32, y: 72 },
        data: { magicType: 'ignition', sequenceIndex: 0 },
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
    it('allows only system and circle external port combinations', () => {
        const box = circle('circle-a');
        const nodes: MagicEditorNode[] = [
            ...createInitialSystemNodes(),
            box,
            node('unit', box.id),
        ];

        expect(isExplicitMagicCircleConnectionValid(connection(
            'system-mana-source',
            box.id,
            'output-0',
            'circle-input'
        ), [], nodes, magicTypes)).toBe(true);
        expect(isExplicitMagicCircleConnectionValid(connection(
            box.id,
            'system-final-output',
            'circle-output',
            'input-0'
        ), [], nodes, magicTypes)).toBe(true);
    });

    it('rejects all internal and cross-circle unit edges', () => {
        const first = circle('circle-a');
        const second = circle('circle-b');
        const firstNode = node('first', first.id);
        const secondNode = node('second', second.id);
        const nodes: MagicEditorNode[] = [
            ...createInitialSystemNodes(),
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
        ), [], nodes, magicTypes)).toBe(false);
        expect(isExplicitMagicCircleConnectionValid(connection(
            first.id,
            firstNode.id,
            'circle-output',
            'input-0'
        ), [], nodes, magicTypes)).toBe(false);
    });

    it('rejects cycles between circle output and input ports', () => {
        const first = circle('circle-a');
        const second = circle('circle-b');
        const nodes: MagicEditorNode[] = [
            ...createInitialSystemNodes(),
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
        ), edges, nodes, magicTypes)).toBe(false);
    });

    it('replaces only an occupied dynamic external port', () => {
        const box = circle('circle-a');
        const nodes: MagicEditorNode[] = [
            ...createInitialSystemNodes(),
            box,
        ];
        const edges: Edge[] = [
            {
                id: 'source-a',
                source: 'system-mana-source',
                target: box.id,
                sourceHandle: 'output-0',
                targetHandle: 'circle-input',
            },
            {
                id: 'source-b',
                source: 'system-mana-source',
                target: box.id,
                sourceHandle: 'output-1',
                targetHandle: 'circle-input-1',
            },
        ];
        const update = createExplicitMagicCircleEdgeUpdate(
            connection(
                'system-mana-source',
                box.id,
                'output-2',
                'circle-input-1'
            ),
            edges,
            nodes,
            magicTypes,
            () => 'replacement'
        );

        expect(update && update.edges.map(edge => edge.id)).toEqual(['source-a']);
        expect(update && update.edge).toMatchObject({
            sourceHandle: 'output-2',
            targetHandle: 'circle-input-1',
        });
    });
});
