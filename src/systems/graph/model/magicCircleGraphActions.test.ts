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
    normalizeMagicCircleSequences,
    resizeMagicCircleSequence,
    updateMagicCircleMetadata,
    type MagicNodeSequenceOrigin,
} from './magicCircleGraphActions';
import {
    getCircleEditableSequenceNodes,
    isCircleSystemMagicNode,
} from './circleSystemMagicNodes';

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

    it('normalizes multiple circles together and preserves unrelated nodes', () => {
        const first = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'first-normalized'
        );
        const second = createMagicCircleNode(
            { x: 520, y: 0 },
            () => 'second-normalized'
        );
        const firstChild = attachNodeToCircle(
            createTestMagicNode('first-child'),
            first,
            3
        );
        const secondChild = attachNodeToCircle(
            createTestMagicNode('second-child'),
            second,
            2
        );
        const unrelated = createTestMagicNode('unrelated');

        const normalized = normalizeMagicCircleSequences([
            first,
            secondChild,
            unrelated,
            second,
            firstChild,
        ]);

        expect(getCircleChildNodes(normalized, first.id).map(node => [
            node.data.magicType,
            node.data.sequenceIndex,
        ])).toEqual([
            ['ignition', 0],
            ['manifestation', 1],
        ]);
        expect(getCircleChildNodes(normalized, second.id).map(node => [
            node.data.magicType,
            node.data.sequenceIndex,
        ])).toEqual([
            ['ignition', 0],
            ['manifestation', 1],
        ]);
        expect(normalized.find(node => node.id === unrelated.id))
            .toBe(unrelated);
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
        expect(getCircleEditableSequenceNodes(result.nodes, box.id)
            .map(node => node.data.sequenceIndex)
        ).toEqual([0, 1]);
        expect(getCircleChildNodes(result.nodes, box.id).at(-1)?.data.magicType)
            .toBe('manifestation');
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

        expect(getCircleEditableSequenceNodes(result.nodes, box.id)
            .map(node => node.data.magicType)
        ).toEqual([
            'ignition',
            'stream',
            'ignition',
        ]);
        expect(children.map(node => node.position.y))
            .toEqual([80, 120, 160, 200]);
    });

    it('adds repeat start and end markers as one pair', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'box');
        const result = addMagicNodeToCircle([box], 'repeat', box.id);
        const children = getCircleEditableSequenceNodes(result.nodes, box.id);

        expect(result.added).toBe(true);
        expect(children).toHaveLength(2);
        expect(children.map(node => node.data.controlPair?.role))
            .toEqual(['start', 'end']);
        expect(children[0].data.controlPair?.id)
            .toBe(children[1].data.controlPair?.id);
        expect(children[0].style)
            .toContain('--node-editor-node-width: 400px');
    });

    it('indents nested repeat contents while keeping markers at parent depth', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'box');
        const outer = addMagicNodeToCircle([box], 'repeat', box.id);
        const nested = addMagicNodeToCircle(
            outer.nodes,
            'repeat',
            box.id,
            1
        );
        const populated = addMagicNodeToCircle(
            nested.nodes,
            'ignition',
            box.id,
            2
        );
        const children = getCircleEditableSequenceNodes(
            populated.nodes,
            box.id
        );

        expect(children.map(node => node.position.x))
            .toEqual([40, 60, 80, 60, 40]);
        expect(children.map(node => node.style)).toEqual([
            expect.stringContaining('--node-editor-node-width: 400px'),
            expect.stringContaining('--node-editor-node-width: 400px'),
            expect.stringContaining('--node-editor-node-width: 400px'),
            expect.stringContaining('--node-editor-node-width: 400px'),
            expect.stringContaining('--node-editor-node-width: 400px'),
        ]);
    });

    it('restores a marker moved past its partner', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'box');
        const added = addMagicNodeToCircle([box], 'repeat', box.id);
        const [start] = getCircleEditableSequenceNodes(added.nodes, box.id);
        const result = moveMagicNodeGroup(
            { nodes: added.nodes, edges: [] },
            [{
                nodeId: start.id,
                circleId: box.id,
                sequenceIndex: 0,
            }],
            box.id,
            1
        );

        expect(result.moved).toBe(false);
        expect(getCircleEditableSequenceNodes(result.nodes, box.id)
            .map(node => node.data.controlPair?.role)
        ).toEqual(['start', 'end']);
    });

    it('requires both markers when moving a pair across circles', () => {
        const source = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'source'
        );
        const target = createMagicCircleNode(
            { x: 520, y: 0 },
            () => 'target'
        );
        const added = addMagicNodeToCircle(
            [source, target],
            'branch',
            source.id
        );
        const [start, end] = getCircleEditableSequenceNodes(
            added.nodes,
            source.id
        );
        const startOrigin = {
            nodeId: start.id,
            circleId: source.id,
            sequenceIndex: 0,
        };
        const endOrigin = {
            nodeId: end.id,
            circleId: source.id,
            sequenceIndex: 1,
        };

        expect(moveMagicNodeGroup(
            { nodes: added.nodes, edges: [] },
            [startOrigin],
            target.id,
            0
        ).moved).toBe(false);

        const moved = moveMagicNodeGroup(
            { nodes: added.nodes, edges: [] },
            [startOrigin, endOrigin],
            target.id,
            0
        );
        expect(moved.moved).toBe(true);
        expect(getCircleEditableSequenceNodes(moved.nodes, source.id))
            .toEqual([]);
        expect(getCircleChildNodes(moved.nodes, source.id).some(
            node => isCircleSystemMagicNode(node)
        )).toBe(true);
        expect(getCircleEditableSequenceNodes(moved.nodes, target.id)
            .map(node => node.data.controlPair?.role)
        ).toEqual(['start', 'end']);
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
        expect(getCircleEditableSequenceNodes(result.nodes, second.id).map(node => node.id))
            .toEqual([firstNode.id, secondNode.id, targetNode.id]);
        expect(getCircleEditableSequenceNodes(result.nodes, second.id)
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

        expect(getCircleEditableSequenceNodes(result.nodes, box.id).map(node => node.id))
            .toEqual(['b', 'd', 'a', 'c']);
    });

    it('keeps fixed circle system nodes at the end of their own circle', () => {
        const source = createMagicCircleNode({ x: 0, y: 0 }, () => 'source');
        const target = createMagicCircleNode({ x: 520, y: 0 }, () => 'target');
        const first = attachNodeToCircle(createTestMagicNode('first'), source, 0);
        const normalized = addMagicNodeToCircle(
            [source, target, first],
            'stream',
            source.id
        ).nodes;
        const systemNode = getCircleChildNodes(normalized, source.id)
            .find(node => isCircleSystemMagicNode(node))!;

        const sameCircleMove = moveMagicNodeGroup(
            { nodes: normalized, edges: [] },
            [{
                nodeId: systemNode.id,
                circleId: source.id,
                sequenceIndex: systemNode.data.sequenceIndex ?? 0,
            }],
            source.id,
            0
        );
        expect(sameCircleMove.moved).toBe(false);
        expect(getCircleChildNodes(sameCircleMove.nodes, source.id).at(-1)?.id)
            .toBe(systemNode.id);

        expect(moveMagicNodeGroup(
            { nodes: normalized, edges: [] },
            [{
                nodeId: systemNode.id,
                circleId: source.id,
                sequenceIndex: systemNode.data.sequenceIndex ?? 0,
            }],
            target.id,
            0
        ).moved).toBe(false);
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
            .toEqual({ x: 40, y: 80 });
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

        expect(resizedCircle).toMatchObject({ width: 600, height: 488 });
        expect(getCircleChildNodes(resized, box.id)[0].style)
            .toContain('--node-editor-node-width: 520px');
    });
});
