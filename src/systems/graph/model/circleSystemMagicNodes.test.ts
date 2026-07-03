import { describe, expect, it } from 'vitest';
import { MAGIC_NODE_KINDS } from '../../../constants/graphConfigs';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import {
    attachNodeToCircle,
    createMagicCircleNode,
    getCircleChildNodes,
} from './magicCircleGraph';
import {
    createCircleSystemMagicNode,
    isCircleSystemMagicNode,
    normalizeCircleSystemNodeChildren,
    resolveCircleSystemNodeSlotsFromChildren,
} from './circleSystemMagicNodes';

const testCircleSystemNodeConfigs = [
    {
        magicType: 'manifestation',
        idSuffix: 'manifestation',
        fixedAtSequenceEnd: true,
    },
    { magicType: 'test-system', idSuffix: 'test-system' },
] as const;

describe('circleSystemMagicNodes', () => {
    it('keeps exactly one registered circle system node per circle', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'circle');
        const editable = attachNodeToCircle(
            createTestMagicNode('editable'),
            circle,
            1
        );
        const firstSystem = createCircleSystemMagicNode(
            circle,
            testCircleSystemNodeConfigs[0],
            0
        );
        const duplicateSystem = createCircleSystemMagicNode(
            circle,
            testCircleSystemNodeConfigs[0],
            2
        );

        const normalized = normalizeCircleSystemNodeChildren(
            circle,
            [firstSystem, editable, duplicateSystem],
            testCircleSystemNodeConfigs
        );

        expect(normalized.map(node => node.id)).toEqual([
            'editable',
            `${circle.id}-manifestation`,
            `${circle.id}-test-system`,
        ]);
        expect(normalized.filter(node =>
            isCircleSystemMagicNode(node, testCircleSystemNodeConfigs)
        )).toHaveLength(2);
        expect(normalized[1].selectable).toBe(true);
        expect(normalized[1].draggable).toBe(false);
        expect(normalized[1].data.showTooltip).toBe(true);
        expect(normalized[2].data).toMatchObject({
            magicType: 'test-system',
            nodeKind: MAGIC_NODE_KINDS.SYSTEM,
            excludeFromStatScaling: true,
        });
    });

    it('normalizes and snapshots manifestation caption settings', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'caption'
        );
        const manifestation = createCircleSystemMagicNode(
            circle,
            testCircleSystemNodeConfigs[0],
            0,
            {
                caption: '  최종 발현  ',
                weight: '9',
            }
        );

        expect(manifestation.data.settings).toEqual({
            caption: '최종 발현',
        });
        expect(resolveCircleSystemNodeSlotsFromChildren(
            [manifestation],
            [testCircleSystemNodeConfigs[0]]
        )).toEqual([{
            magicType: 'manifestation',
            slotIndex: 0,
            settings: { caption: '최종 발현' },
        }]);
    });

    it('moves a fixed system node behind editable and connection nodes', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'fixed-end'
        );
        const manifestation = createCircleSystemMagicNode(
            circle,
            testCircleSystemNodeConfigs[0],
            0
        );
        const editable = attachNodeToCircle(
            createTestMagicNode('editable'),
            circle,
            1
        );
        const connectionJoin = {
            ...attachNodeToCircle(
                createTestMagicNode('join', 'circleJoin'),
                circle,
                2
            ),
            data: {
                magicType: 'circleJoin',
                nodeKind: MAGIC_NODE_KINDS.SYSTEM,
                sequenceIndex: 2,
                connectionJoin: {
                    edgeId: 'edge-a',
                    sourceCircleId: 'source',
                },
            },
        } as const;

        const normalized = normalizeCircleSystemNodeChildren(
            circle,
            [manifestation, editable, connectionJoin],
            [testCircleSystemNodeConfigs[0]]
        );

        expect(normalized.map(node => node.id)).toEqual([
            'editable',
            'join',
            `${circle.id}-manifestation`,
        ]);
        expect(resolveCircleSystemNodeSlotsFromChildren(
            normalized,
            [testCircleSystemNodeConfigs[0]]
        )).toEqual([{
            magicType: 'manifestation',
            slotIndex: 1,
        }]);
    });

    it('resolves generic system node slots by editable-node position', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'circle');
        const system = createCircleSystemMagicNode(
            circle,
            testCircleSystemNodeConfigs[1],
            1
        );
        const normalized = normalizeCircleSystemNodeChildren(
            circle,
            [
                attachNodeToCircle(createTestMagicNode('first'), circle, 0),
                system,
                attachNodeToCircle(createTestMagicNode('second'), circle, 2),
            ],
            testCircleSystemNodeConfigs
        );
        const laidOutNodes = normalized.map((node, sequenceIndex) =>
            attachNodeToCircle(node, circle, sequenceIndex)
        );
        const nodes = [circle, ...laidOutNodes];

        expect(resolveCircleSystemNodeSlotsFromChildren(
            getCircleChildNodes(nodes, circle.id),
            testCircleSystemNodeConfigs
        )).toEqual([
            { magicType: 'manifestation', slotIndex: 2 },
            { magicType: 'test-system', slotIndex: 1 },
        ]);
        expect(getCircleChildNodes(nodes, circle.id).map(node =>
            node.data.sequenceIndex
        )).toEqual([0, 1, 2, 3]);
    });
});
