import { beforeEach, describe, expect, it } from 'vitest';
import { resetGraphStoreFixture } from '../test-utils/graphFixtures';
import type { MagicGraphPresetConfig } from '../types/magic';
import {
    getMagicCircleNodes,
    getMagicUnitNodes,
} from '../systems/graph/model/magicCircleGraph';
import { isCircleSystemMagicNode } from '../systems/graph/model/circleSystemMagicNodes';
import { isSystemMagicNode } from '../systems/graph/model/systemMagicNodes';
import { CIRCLE_SYSTEM_MAGIC_NODE_TYPES } from '../constants/systemMagicNodeConfigs';
import { graphStore } from './graphStore.svelte';

function userNodes() {
    return getMagicUnitNodes(graphStore.nodes)
        .filter(node => !isSystemMagicNode(node));
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

    it('appends nodes to the active circle in contiguous sequence order', () => {
        expect(graphStore.addNode('ignition')).toBe(true);
        expect(graphStore.addNode('stream')).toBe(true);

        expect(userNodes().map(node => node.data.sequenceIndex)).toEqual([0, 1]);
        expect(userNodes().map(node => node.position)).toEqual([
            { x: 32, y: 72 },
            { x: 32, y: 112 },
        ]);
        expect(userNodes().every(node => node.connectable === false)).toBe(true);
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
        expect(userNodes().map(node => node.position.y)).toEqual([72, 112]);
        expect(circleNode().height).toBe(circleHeight);
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
        expect(userNodes()[0].style).toContain('--node-editor-node-width: 536px');
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
            position: { x: 32, y: 72 },
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
        graphStore.onDelete([circleNode()], []);

        expect(getMagicCircleNodes(graphStore.nodes)).toEqual([]);
        expect(userNodes()).toEqual([]);
        expect(graphStore.edges).toEqual([]);
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
