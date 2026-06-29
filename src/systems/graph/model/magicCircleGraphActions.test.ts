import { describe, expect, it } from 'vitest';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import {
    attachNodeToCircle,
    createMagicCircleNode,
    getCircleChildNodes,
} from './magicCircleGraph';
import {
    addMagicNodeToCircle,
    moveMagicNodeGroup,
    resizeMagicCircleSequence,
    updateMagicCircleMetadata,
    type MagicNodeSequenceOrigin,
} from './magicCircleGraphActions';

function fixture() {
    const first = createMagicCircleNode({ x: 0, y: 0 }, () => 'first');
    const second = createMagicCircleNode({ x: 520, y: 0 }, () => 'second');
    const firstNode = {
        ...attachNodeToCircle(createTestMagicNode('first-node'), first, 0),
        selected: true,
    };
    const secondNode = {
        ...attachNodeToCircle(createTestMagicNode('second-node'), first, 1),
        selected: true,
    };
    const targetNode = attachNodeToCircle(
        createTestMagicNode('target-node'),
        second,
        0
    );
    const origins: MagicNodeSequenceOrigin[] = [
        { nodeId: firstNode.id, circleId: first.id, sequenceIndex: 0 },
        { nodeId: secondNode.id, circleId: first.id, sequenceIndex: 1 },
    ];

    return {
        first,
        second,
        firstNode,
        secondNode,
        targetNode,
        origins,
        snapshot: {
            nodes: [first, second, firstNode, secondNode, targetNode],
            edges: [],
        },
    };
}

describe('magicCircleGraphActions', () => {
    it('normalizes circle metadata and preserves references when unchanged', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'metadata');
        const firstUpdate = updateMagicCircleMetadata([circle], circle.id, {
            name: '  공격 서클  ',
            caption: '  첫 번째 단계  ',
        });

        expect(firstUpdate[0].data).toMatchObject({
            name: '공격 서클',
            caption: '첫 번째 단계',
        });

        const secondUpdate = updateMagicCircleMetadata(
            firstUpdate,
            circle.id,
            {
                name: '공격 서클',
                caption: '첫 번째 단계',
            }
        );

        expect(secondUpdate[0]).toBe(firstUpdate[0]);
        expect(secondUpdate[0].data).toBe(firstUpdate[0].data);
    });

    it('appends a new node and assigns the next sequence index', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'box');
        const first = attachNodeToCircle(createTestMagicNode('first'), box, 0);
        const result = addMagicNodeToCircle(
            [box, first],
            'ignition',
            box.id
        );

        expect(result.added).toBe(true);
        expect(getCircleChildNodes(result.nodes, box.id)
            .map(node => node.data.sequenceIndex)
        ).toEqual([0, 1]);
    });

    it('inserts a dropped toolbar node between existing sequence nodes', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'box');
        const first = attachNodeToCircle(createTestMagicNode('first'), box, 0);
        const second = attachNodeToCircle(createTestMagicNode('second'), box, 1);
        const result = addMagicNodeToCircle(
            [box, first, second],
            'stream',
            box.id,
            1
        );
        const children = getCircleChildNodes(result.nodes, box.id);

        expect(children.map(node => node.data.magicType)).toEqual([
            'ignition',
            'stream',
            'ignition',
        ]);
        expect(children.map(node => node.position.y)).toEqual([72, 112, 152]);
    });

    it('rejects repeat addition at the action boundary', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'box');
        expect(addMagicNodeToCircle([box], 'repeat', box.id)).toEqual({
            nodes: [box],
            added: false,
        });
    });

    it('moves a selected block between circles at an insertion index', () => {
        const {
            second,
            firstNode,
            secondNode,
            targetNode,
            snapshot,
            origins,
        } = fixture();
        const result = moveMagicNodeGroup(
            snapshot,
            origins,
            second.id,
            0
        );

        expect(result.moved).toBe(true);
        expect(getCircleChildNodes(result.nodes, second.id).map(node => node.id))
            .toEqual([firstNode.id, secondNode.id, targetNode.id]);
        expect(getCircleChildNodes(result.nodes, second.id)
            .map(node => node.data.sequenceIndex)
        ).toEqual([0, 1, 2]);
        expect(result.edges).toEqual([]);
    });

    it('reorders a non-contiguous selected group as one relative-order block', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'box');
        const children = ['a', 'b', 'c', 'd'].map((id, index) =>
            attachNodeToCircle(createTestMagicNode(id), box, index)
        );
        const result = moveMagicNodeGroup(
            { nodes: [box, ...children], edges: [] },
            [
                { nodeId: 'b', circleId: box.id, sequenceIndex: 1 },
                { nodeId: 'd', circleId: box.id, sequenceIndex: 3 },
            ],
            box.id,
            0
        );

        expect(getCircleChildNodes(result.nodes, box.id).map(node => node.id))
            .toEqual(['b', 'd', 'a', 'c']);
    });

    it('restores normalized positions when the group has mixed source circles', () => {
        const { first, second, firstNode, targetNode, snapshot } = fixture();
        const result = moveMagicNodeGroup(
            {
                ...snapshot,
                nodes: snapshot.nodes.map(node =>
                    node.id === firstNode.id
                        ? { ...node, position: { x: 999, y: 999 } }
                        : node
                ),
            },
            [
                { nodeId: firstNode.id, circleId: first.id, sequenceIndex: 0 },
                { nodeId: targetNode.id, circleId: second.id, sequenceIndex: 0 },
            ],
            second.id,
            0
        );

        expect(result.moved).toBe(false);
        expect(result.nodes.find(node => node.id === firstNode.id)?.position)
            .toEqual({ x: 32, y: 72 });
    });

    it('expands height for long sequences and does not shrink it on resize', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'box');
        const children = Array.from({ length: 8 }, (_, index) =>
            attachNodeToCircle(createTestMagicNode(`node-${index}`), box, index)
        );
        const resized = resizeMagicCircleSequence(
            [box, ...children],
            box.id,
            { width: 600, height: 100 }
        );
        const resizedCircle = resized.find(node => node.id === box.id);

        expect(resizedCircle).toMatchObject({ width: 600, height: 440 });
        expect(getCircleChildNodes(resized, box.id)[0].style)
            .toContain('--node-editor-node-width: 536px');
    });
});
