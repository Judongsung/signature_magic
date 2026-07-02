import { beforeEach, describe, expect, it } from 'vitest';
import { resetGraphStoreFixture } from '../test-utils/graphFixtures';
import {
    type MagicGraphPresetConfig,
} from '../systems/graph/presets/magicGraphPresetTypes';
import {
    type MagicUserNode,
} from '../systems/graph/magicGraphTypes';
import {
    getMagicCircleNodes,
    getMagicUnitNodes,
    isMagicCircleNode,
} from '../systems/graph/model/magicCircleGraph';
import { isCircleSystemMagicNode } from '../systems/graph/model/circleSystemMagicNodes';
import {
    isMagicCircleConnectionJoinNode,
} from '../systems/graph/model/magicCircleConnectionNodes';
import { CIRCLE_SYSTEM_MAGIC_NODE_TYPES } from '../constants/circleSystemMagicNodeConfigs';
import {
    MAGIC_CIRCLE_HANDLE_IDS,
    MAGIC_NODE_KINDS,
} from '../constants/graphConfigs';
import { MAGIC_GRAPH_SELECTION_MODES } from '../systems/graph/editor/magicGraphSelection';
import { graphStore } from './graphStore.svelte';

function userNodes() {
    return getMagicUnitNodes(graphStore.nodes)
        .filter((node): node is MagicUserNode =>
            !isCircleSystemMagicNode(node)
        );
}

function circleNode() {
    return getMagicCircleNodes(graphStore.nodes)[0];
}

const preset: MagicGraphPresetConfig = {
    id: 'store-preset',
    label: 'Store Preset',
    circles: [{
        id: 'store-circle',
        position: { x: -240, y: -320 },
        width: 480,
        height: 640,
        systemNodeSlots: [{
            magicType: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
            slotIndex: 1,
        }],
    }],
    nodes: [{
        id: 'preset-ignition',
        magicType: 'ignition',
        circleId: 'store-circle',
        sequenceIndex: 0,
    }],
    edges: [],
};

describe('graphStore sequence circles', () => {
    beforeEach(() => {
        resetGraphStoreFixture();
    });

    it('starts with one selected empty circle and one circle system node', () => {
        expect(graphStore.nodes).toHaveLength(2);
        expect(circleNode().selected).toBe(true);
        expect(graphStore.activeCircleId).toBe(circleNode().id);
        expect(getMagicUnitNodes(graphStore.nodes).filter(
            node => isCircleSystemMagicNode(node)
        )).toHaveLength(1);
        expect(userNodes()).toEqual([]);
    });

    it('keeps multi-circle selection and targets the uppermost circle', () => {
        const firstCircleId = circleNode().id;
        const secondCircleId = graphStore.addCircle({ x: 520, y: -800 });
        graphStore.acceptFlowNodes(graphStore.nodes.map(node =>
            getMagicCircleNodes(graphStore.nodes).some(circle =>
                circle.id === node.id
            )
                ? { ...node, selected: true }
                : node
        ));

        graphStore.applySelectionScope({
            mode: MAGIC_GRAPH_SELECTION_MODES.CIRCLES,
        });

        expect(getMagicCircleNodes(graphStore.nodes)
            .filter(circle => circle.selected)
            .map(circle => circle.id)
        ).toEqual([firstCircleId, secondCircleId]);
        expect(graphStore.activeCircleId).toBe(secondCircleId);
    });

    it('drops unit selections from other circles when a node becomes active', () => {
        const firstCircleId = circleNode().id;
        graphStore.addNode('ignition', firstCircleId);
        const secondCircleId = graphStore.addCircle({ x: 520, y: -320 });
        graphStore.addNode('stream', secondCircleId);
        const firstUnit = userNodes().find(node =>
            node.parentId === firstCircleId
        )!;
        const secondUnit = userNodes().find(node =>
            node.parentId === secondCircleId
        )!;
        graphStore.acceptFlowNodes(graphStore.nodes.map(node =>
            node.id === firstUnit.id || node.id === secondUnit.id
                ? { ...node, selected: true }
                : node
        ));

        graphStore.syncSelectionForNode(firstUnit.id);

        expect(userNodes().filter(node => node.selected).map(node => node.id))
            .toEqual([firstUnit.id]);
        expect(graphStore.activeCircleId).toBe(firstCircleId);
    });

    it('selects the manifestation node as a unit in its circle', () => {
        const manifestation = getMagicUnitNodes(graphStore.nodes)
            .find(node => isCircleSystemMagicNode(node))!;

        graphStore.acceptFlowNodes(graphStore.nodes.map(node =>
            node.id === manifestation.id
                ? { ...node, selected: true }
                : node
        ));
        graphStore.syncSelectionForNode(manifestation.id);

        expect(getMagicUnitNodes(graphStore.nodes)
            .filter(node => node.selected)
            .map(node => node.id)
        ).toEqual([manifestation.id]);
        expect(graphStore.activeCircleId).toBe(manifestation.parentId);
    });

    it('uses the internal clipboard fallback and offsets repeated circle pastes', () => {
        const originalCircle = circleNode();
        const serialized = graphStore.copySelection();

        expect(serialized).not.toBe(false);
        expect(graphStore.pasteSelection()).toBe(true);
        expect(graphStore.pasteSelection()).toBe(true);

        const circles = getMagicCircleNodes(graphStore.nodes);
        expect(circles).toHaveLength(3);
        expect(circles.map(circle => circle.position)).toEqual([
            originalCircle.position,
            {
                x: originalCircle.position.x + 40,
                y: originalCircle.position.y + 40,
            },
            {
                x: originalCircle.position.x + 80,
                y: originalCircle.position.y + 80,
            },
        ]);
        expect(new Set(circles.map(circle => circle.id)).size).toBe(3);
        expect(graphStore.activeCircleId).toBe(circles[2].id);
        expect(circles.filter(circle => circle.selected).map(circle =>
            circle.id
        )).toEqual([circles[2].id]);
    });

    it('ignores unrelated clipboard text without mutating the graph', () => {
        const nodes = graphStore.nodes;
        const edges = graphStore.edges;

        expect(graphStore.pasteSelection('plain text')).toBe(false);
        expect(graphStore.nodes).toBe(nodes);
        expect(graphStore.edges).toBe(edges);
    });

    it('appends nodes to the active circle in contiguous sequence order', () => {
        expect(graphStore.addNode('ignition')).toBe(true);
        expect(graphStore.addNode('stream')).toBe(true);

        expect(userNodes().map(node => node.data.sequenceIndex)).toEqual([0, 1]);
        expect(userNodes().map(node => node.position)).toEqual([
            { x: 40, y: 80 },
            { x: 40, y: 120 },
        ]);
        expect(userNodes().every(node => node.connectable === false)).toBe(true);
    });

    it('adds toolbar nodes below the lowest selected unit and selects the new node', () => {
        graphStore.addNode('ignition');
        graphStore.addNode('stream');
        const [ignition] = userNodes();
        graphStore.acceptFlowNodes(graphStore.nodes.map(node => ({
            ...node,
            selected: node.id === ignition.id,
        })));

        expect(graphStore.addNodeAfterSelection('light')).toBe(true);
        expect(userNodes().map(node => node.data.magicType))
            .toEqual(['ignition', 'light', 'stream']);
        expect(userNodes().filter(node => node.selected).map(node =>
            node.data.magicType
        )).toEqual(['light']);

        expect(graphStore.addNodeAfterSelection('air')).toBe(true);
        expect(userNodes().map(node => node.data.magicType))
            .toEqual(['ignition', 'light', 'air', 'stream']);
    });

    it('selects a new control start so the next toolbar node enters its range', () => {
        graphStore.addNode('ignition');
        const [ignition] = userNodes();
        graphStore.acceptFlowNodes(graphStore.nodes.map(node => ({
            ...node,
            selected: node.id === ignition.id,
        })));

        graphStore.addNodeAfterSelection('repeat');
        expect(userNodes().filter(node => node.selected)[0]?.data.controlPair?.role)
            .toBe('start');

        graphStore.addNodeAfterSelection('light');
        expect(userNodes().map(node => [
            node.data.magicType,
            node.data.controlPair?.role,
        ])).toEqual([
            ['ignition', undefined],
            ['repeat', 'start'],
            ['light', undefined],
            ['repeat', 'end'],
        ]);
    });

    it('requires an active circle and creates repeat markers as a pair', () => {
        graphStore.selectCircle(undefined);
        expect(graphStore.addNode('ignition')).toBe(false);

        graphStore.selectCircle(circleNode().id);
        expect(graphStore.addNode('repeat')).toBe(true);
        expect(userNodes()).toHaveLength(2);
        expect(new Set(userNodes().map(node => node.data.controlPair?.id)).size)
            .toBe(1);
    });

    it('updates circle name and caption through the circle action', () => {
        graphStore.updateCircleMetadata(circleNode().id, {
            name: '  공격 서클  ',
            caption: '  첫 번째 단계  ',
        });

        expect(circleNode().data).toMatchObject({
            name: '공격 서클',
            caption: '첫 번째 단계',
        });
    });

    it('keeps the calculation snapshot stable for editor-only changes', () => {
        graphStore.addNode('ignition');
        const circle = circleNode();
        const userNode = userNodes()[0];
        const calculation = graphStore.calculation;

        graphStore.selectCircle(circle.id);
        graphStore.setSequenceDropPreview({
            targetCircleId: circle.id,
            insertionIndex: 0,
            indicatorY: 120,
            beforeNodeId: undefined,
            afterNodeId: undefined,
        });
        graphStore.resizeCircle(circle.id, { width: 600, height: 640 });
        graphStore.updateCircleMetadata(circle.id, {
            name: '표시 이름',
            caption: '표시 설명',
        });
        graphStore.acceptFlowNodes(graphStore.nodes.map(node => {
            if (node.id === circle.id) {
                return {
                    ...node,
                    position: { x: 320, y: -320 },
                    measured: { width: 600, height: 640 },
                };
            }
            if (
                node.id === userNode.id &&
                !isMagicCircleNode(node) &&
                node.data.nodeKind === MAGIC_NODE_KINDS.USER
            ) {
                return {
                    ...node,
                    parentId: 'forged-circle',
                    data: {
                        ...node.data,
                        magicType: 'stream',
                        sequenceIndex: 99,
                    },
                    selected: true,
                };
            }
            return node;
        }));

        expect(graphStore.calculation).toBe(calculation);
        expect(graphStore.nodes.find(node =>
            node.id === userNode.id
        )).toMatchObject({
            parentId: circle.id,
            data: {
                magicType: 'ignition',
                sequenceIndex: 0,
            },
            selected: true,
        });
        expect(graphStore.createPresetSnapshot('Stable document'))
            .toMatchObject({
                nodes: [{
                    id: userNode.id,
                    magicType: 'ignition',
                    circleId: circle.id,
                    sequenceIndex: 0,
                }],
            });
    });

    it('refreshes the calculation snapshot for node content changes', () => {
        const initialCalculation = graphStore.calculation;

        graphStore.addNode('ignition');
        expect(graphStore.calculation).not.toBe(initialCalculation);

        const afterAdd = graphStore.calculation;
        graphStore.updateNodeSettings(userNodes()[0].id, { weight: '2' });
        expect(graphStore.calculation).not.toBe(afterAdd);
    });

    it('commits circle layout once after live positions finish changing', () => {
        graphStore.addNode('ignition');
        const firstCircleId = circleNode().id;
        const secondCircleId = graphStore.addCircle({ x: 520, y: -320 });
        graphStore.addNode('stream', secondCircleId);
        const calculation = graphStore.calculation;
        const beforeMovePreset =
            graphStore.createPresetSnapshot('Before move');
        expect(beforeMovePreset).not.toBe(false);
        if (!beforeMovePreset) {
            throw new Error('Expected a preset before moving circles');
        }

        graphStore.acceptFlowNodes(graphStore.nodes.map(node => {
            if (node.id === firstCircleId) {
                return {
                    ...node,
                    position: { x: 520, y: -320 },
                    width: 999,
                    height: 999,
                };
            }
            if (node.id === secondCircleId) {
                return {
                    ...node,
                    position: { x: -240, y: -320 },
                    width: 999,
                    height: 999,
                };
            }
            return node;
        }));

        expect(graphStore.calculation).toBe(calculation);
        expect(graphStore.circleStates.map(state => state.circleId))
            .toEqual([firstCircleId, secondCircleId]);
        expect(graphStore.createPresetSnapshot('During move'))
            .toMatchObject({
                circles: beforeMovePreset.circles,
            });

        graphStore.commitCircleLayoutChanges();

        expect(graphStore.calculation).not.toBe(calculation);
        expect(graphStore.circleStates.map(state => state.circleId))
            .toEqual([secondCircleId, firstCircleId]);
        expect(graphStore.createPresetSnapshot('After move'))
            .toMatchObject({
                circles: [
                    expect.objectContaining({
                        id: firstCircleId,
                        position: { x: 520, y: -320 },
                        width: 480,
                        height: 640,
                    }),
                    expect.objectContaining({
                        id: secondCircleId,
                        position: { x: -240, y: -320 },
                        width: 480,
                        height: 640,
                    }),
                ],
            });
    });

    it('refreshes the calculation snapshot immediately after external edge events', () => {
        graphStore.addNode('ignition');
        const firstCircleId = circleNode().id;
        const secondCircleId = graphStore.addCircle({ x: 520, y: -320 });
        graphStore.addNode('stream', secondCircleId);
        const connection = {
            source: firstCircleId,
            target: secondCircleId,
            sourceHandle: MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
            targetHandle: MAGIC_CIRCLE_HANDLE_IDS.INPUT,
        };
        const beforeConnect = graphStore.calculation;

        const preparedEdge = graphStore.prepareEdge(connection);
        expect(preparedEdge).not.toBe(false);
        if (!preparedEdge) throw new Error('Expected a prepared edge');
        graphStore.acceptFlowEdges([...graphStore.edges, preparedEdge]);
        expect(graphStore.edges).toHaveLength(1);
        expect(graphStore.calculation).toBe(beforeConnect);

        graphStore.onEdgeConnected(connection);
        expect(graphStore.calculation).not.toBe(beforeConnect);
        const join = graphStore.nodes.find(
            isMagicCircleConnectionJoinNode
        );
        expect(join?.data.connectionJoin).toMatchObject({
            sourceCircleId: firstCircleId,
        });
        expect(join && graphStore.deleteEditorNodeById(join.id))
            .toBe(false);

        const deletedEdge = graphStore.edges[0];
        const beforeDelete = graphStore.calculation;
        graphStore.acceptFlowEdges([]);
        graphStore.onDelete([], [deletedEdge]);

        expect(graphStore.calculation).not.toBe(beforeDelete);
        expect(graphStore.nodes.some(
            isMagicCircleConnectionJoinNode
        )).toBe(false);
    });

    it('moves a selected sequence block to another circle at an insertion index', () => {
        graphStore.addNode('ignition');
        graphStore.addNode('stream');
        const sourceCircle = circleNode();
        const [first, second] = userNodes();
        const targetCircleId = graphStore.addCircle({ x: 520, y: -320 });
        graphStore.addNode('merge', targetCircleId);

        expect(graphStore.moveNodeGroup(
            [
                {
                    nodeId: first.id,
                    circleId: sourceCircle.id,
                    sequenceIndex: 0,
                },
                {
                    nodeId: second.id,
                    circleId: sourceCircle.id,
                    sequenceIndex: 1,
                },
            ],
            targetCircleId,
            0
        )).toBe(true);

        expect(userNodes()
            .filter(node => node.parentId === targetCircleId)
            .map(node => [node.id, node.data.sequenceIndex])
        ).toEqual([
            [first.id, 0],
            [second.id, 1],
            [userNodes().find(node => node.data.magicType === 'merge')!.id, 2],
        ]);
    });

    it('reindexes remaining children after deletion without shrinking the circle', () => {
        graphStore.addNode('ignition');
        graphStore.addNode('stream');
        graphStore.addNode('merge');
        const circleHeight = circleNode().height;
        const [, deleted] = userNodes();

        graphStore.onDelete([deleted], []);

        expect(userNodes().map(node => node.data.sequenceIndex)).toEqual([0, 1]);
        expect(userNodes().map(node => node.position.y)).toEqual([80, 120]);
        expect(circleNode().height).toBe(circleHeight);
    });

    it('cleans a control pair after Flow removes one marker first', () => {
        graphStore.addNode('branch');
        const [start] = userNodes();

        graphStore.acceptFlowNodes(
            graphStore.nodes.filter(node => node.id !== start.id)
        );
        graphStore.onDelete([start], []);

        expect(userNodes()).toEqual([]);
    });

    it('cleans circle children after Flow removes the parent first', () => {
        graphStore.addNode('ignition');
        const circle = circleNode();

        graphStore.acceptFlowNodes(
            graphStore.nodes.filter(node => node.id !== circle.id)
        );
        graphStore.onDelete([circle], []);

        expect(getMagicCircleNodes(graphStore.nodes)).toEqual([]);
        expect(graphStore.nodes.some(node =>
            node.parentId === circle.id
        )).toBe(false);
    });

    it('grows a circle to fit appended nodes and keeps the grown height after deletion', () => {
        for (let index = 0; index < 15; index += 1) {
            graphStore.addNode('ignition');
        }
        const grownHeight = circleNode().height;
        expect(grownHeight).toBeGreaterThan(640);

        graphStore.onDelete([userNodes()[14]], []);
        expect(circleNode().height).toBe(grownHeight);
    });

    it('resizes sequence card widths while respecting the dynamic minimum height', () => {
        graphStore.addNode('ignition');
        graphStore.resizeCircle(circleNode().id, { width: 600, height: 100 });

        expect(circleNode()).toMatchObject({ width: 600, height: 400 });
        expect(userNodes()[0].style).toContain('--node-editor-node-width: 520px');
    });

    it('calculates every serial child in an isolated valid circle', () => {
        graphStore.addNode('ignition');
        graphStore.addNode('stream');

        expect(graphStore.circles).toHaveLength(1);
        expect(graphStore.circles[0].nodes.map(node => node.data.magicType))
            .toEqual(['ignition', 'stream']);
    });

    it('rejects every attempted internal unit connection', () => {
        graphStore.addNode('ignition');
        graphStore.addNode('stream');
        const [source, target] = userNodes();

        expect(graphStore.checkConnection({
            source: source.id,
            target: target.id,
            sourceHandle: 'output-0',
            targetHandle: 'input-0',
        })).toBe(false);
    });

    it('loads and snapshots the v6 sequence preset without internal edges', () => {
        graphStore.loadPreset(preset);

        expect(userNodes()[0]).toMatchObject({
            id: 'preset-ignition',
            parentId: 'store-circle',
            position: { x: 40, y: 80 },
            data: { sequenceIndex: 0 },
        });
        expect(graphStore.edges).toEqual([]);
        expect(getMagicCircleNodes(graphStore.nodes)[0].data).toMatchObject({
            inputHandleCount: 1,
            outputHandleCount: 1,
        });
        expect(graphStore.createPresetSnapshot('Saved')).toMatchObject({
            circles: [{
                systemNodeSlots: [{
                    magicType: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
                    slotIndex: 1,
                }],
            }],
            nodes: [{
                id: 'preset-ignition',
                circleId: 'store-circle',
                sequenceIndex: 0,
            }],
        });
    });

    it('deletes a circle with its children and external edges', () => {
        graphStore.addNode('ignition');
        const circleId = circleNode().id;

        expect(graphStore.deleteEditorNodeById(circleId)).toBe(true);
        expect(getMagicCircleNodes(graphStore.nodes)).toEqual([]);
        expect(userNodes()).toEqual([]);
        expect(graphStore.edges).toEqual([]);
    });

    it('rejects direct deletion of a non-deletable system node', () => {
        const manifestation = getMagicUnitNodes(graphStore.nodes)
            .find(node => isCircleSystemMagicNode(node))!;

        expect(graphStore.deleteEditorNodeById(manifestation.id)).toBe(false);
        expect(graphStore.nodes.some(node =>
            node.id === manifestation.id
        )).toBe(true);
    });

    it('clear restores one empty circle and signature metadata', () => {
        graphStore.addNode('ignition');
        graphStore.setSignatureMetadata({ name: 'Spell', description: 'Note' });
        graphStore.clear();

        expect(getMagicCircleNodes(graphStore.nodes)).toHaveLength(1);
        expect(userNodes()).toEqual([]);
        expect(graphStore.signatureMetadata).toEqual({ name: '', description: '' });
    });
});
