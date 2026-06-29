import { describe, expect, it } from 'vitest';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from '../model/magicCircleGraph';
import {
    createMagicNodeDragOrigins,
    findMagicCircleAtPoint,
    resolveMagicCircleSequenceInsertion,
    resolveMagicNodeSequenceDrop,
} from './magicCircleEditorInteraction';

describe('magicCircleEditorInteraction', () => {
    it('captures selected children with their stable sequence origins', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'source');
        const selected = ['a', 'b'].map((id, index) => ({
            ...attachNodeToCircle(createTestMagicNode(id), circle, index),
            selected: true,
        }));

        expect(createMagicNodeDragOrigins([circle, ...selected])).toEqual([
            { nodeId: 'a', circleId: circle.id, sequenceIndex: 0 },
            { nodeId: 'b', circleId: circle.id, sequenceIndex: 1 },
        ]);
    });

    it('resolves the insertion index from the pointer position', () => {
        const source = createMagicCircleNode({ x: 0, y: 0 }, () => 'source');
        const target = createMagicCircleNode({ x: 520, y: 0 }, () => 'target');
        const moving = attachNodeToCircle(createTestMagicNode('moving'), source, 0);
        const targetNodes = ['a', 'b'].map((id, index) =>
            attachNodeToCircle(createTestMagicNode(id), target, index)
        );
        const origins = [{
            nodeId: moving.id,
            circleId: source.id,
            sequenceIndex: 0,
        }];

        expect(resolveMagicNodeSequenceDrop(
            { x: 600, y: 112 },
            origins,
            [source, target, moving, ...targetNodes],
            [source, target]
        )).toMatchObject({
            targetCircleId: target.id,
            insertionIndex: 1,
        });
    });

    it('resolves a toolbar drop at the touching boundary between nodes', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'target');
        const nodes = ['a', 'b'].map((id, index) =>
            attachNodeToCircle(createTestMagicNode(id), circle, index)
        );

        expect(resolveMagicCircleSequenceInsertion(
            { x: 100, y: 112 },
            [circle, ...nodes],
            [circle]
        )).toEqual({
            targetCircleId: circle.id,
            insertionIndex: 1,
            indicatorY: 112,
            beforeNodeId: 'b',
            afterNodeId: undefined,
        });
    });

    it('excludes moving nodes when calculating a same-circle insertion', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'source');
        const nodes = ['a', 'b', 'c'].map((id, index) =>
            attachNodeToCircle(createTestMagicNode(id), circle, index)
        );

        expect(resolveMagicNodeSequenceDrop(
            { x: 100, y: 80 },
            [{ nodeId: 'b', circleId: circle.id, sequenceIndex: 1 }],
            [circle, ...nodes],
            [circle]
        ).insertionIndex).toBe(0);
        expect(resolveMagicNodeSequenceDrop(
            { x: 100, y: 300 },
            [{ nodeId: 'b', circleId: circle.id, sequenceIndex: 1 }],
            [circle, ...nodes],
            [circle]
        ).insertionIndex).toBe(2);
    });

    it('returns no target for mixed source circles or an outside drop', () => {
        const first = createMagicCircleNode({ x: 0, y: 0 }, () => 'first');
        const second = createMagicCircleNode({ x: 520, y: 0 }, () => 'second');
        const firstNode = attachNodeToCircle(createTestMagicNode('first-node'), first, 0);
        const secondNode = attachNodeToCircle(createTestMagicNode('second-node'), second, 0);

        expect(resolveMagicNodeSequenceDrop(
            { x: 100, y: 100 },
            [
                { nodeId: firstNode.id, circleId: first.id, sequenceIndex: 0 },
                { nodeId: secondNode.id, circleId: second.id, sequenceIndex: 0 },
            ],
            [first, second, firstNode, secondNode],
            [first, second]
        ).targetCircleId).toBeUndefined();
        expect(resolveMagicNodeSequenceDrop(
            { x: 2000, y: 2000 },
            [{ nodeId: firstNode.id, circleId: first.id, sequenceIndex: 0 }],
            [first, second, firstNode, secondNode],
            [first, second]
        ).targetCircleId).toBeUndefined();
    });

    it('uses the topmost circle when boxes overlap', () => {
        const back = createMagicCircleNode({ x: 0, y: 0 }, () => 'back');
        const front = createMagicCircleNode({ x: 0, y: 0 }, () => 'front');

        expect(findMagicCircleAtPoint([back, front], { x: 100, y: 100 })?.id)
            .toBe(front.id);
    });
});
