import { describe, expect, it } from 'vitest';
import {
    MAGIC_CIRCLE_HANDLE_IDS,
} from '../../../constants/graphConfigs';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import { calculateMagic } from '../calculation/magicCalculator';
import { magicTypes } from '../registry/magicTypeRegistry';
import {
    attachNodeToCircle,
    createMagicCircleNode,
    getCircleChildNodes,
} from './magicCircleGraph';
import {
    addMagicNodeToCircle,
    moveMagicNodeGroup,
    normalizeMagicCircleSequences,
} from './magicCircleGraphActions';
import {
    applyMagicCircleConnectionJoinSlots,
    isMagicCircleConnectionJoinNode,
    resolveMagicCircleConnectionJoinSlotIndex,
    syncMagicCircleConnectionNodes,
} from './magicCircleConnectionNodes';
import { syncGraphTopology } from './graphEventHandlers';

function externalEdge(
    id: string,
    source: string,
    target: string
) {
    return {
        id,
        source,
        target,
        sourceHandle: MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
        targetHandle: MAGIC_CIRCLE_HANDLE_IDS.INPUT,
    };
}

describe('magicCircleConnectionNodes', () => {
    it('creates one join per edge, preserves its slot, and removes it on disconnect', () => {
        const source = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'source'
        );
        const target = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'target'
        );
        const first = attachNodeToCircle(
            createTestMagicNode('first'),
            target,
            0
        );
        const second = attachNodeToCircle(
            createTestMagicNode('second'),
            target,
            1
        );
        const baseNodes = normalizeMagicCircleSequences([
            source,
            target,
            first,
            second,
        ]);
        const edge = externalEdge(
            'edge-a',
            source.id,
            target.id
        );
        const synced = syncGraphTopology({
            nodes: baseNodes,
            edges: [edge],
        });
        const join = synced.nodes.find(
            isMagicCircleConnectionJoinNode
        )!;

        expect(join.data.connectionJoin).toEqual({
            edgeId: edge.id,
            sourceCircleId: source.id,
        });
        expect(getCircleChildNodes(
            synced.nodes,
            target.id
        )[0].id).toBe(join.id);
        expect(resolveMagicCircleConnectionJoinSlotIndex(
            synced.nodes,
            edge.id
        )).toBe(0);

        const moved = normalizeMagicCircleSequences(
            applyMagicCircleConnectionJoinSlots(
                synced.nodes,
                new Map([[edge.id, 1]])
            )
        );
        expect(getCircleChildNodes(moved, target.id)
            .map(node => node.id)
            .slice(0, 3)).toEqual([
                first.id,
                join.id,
                second.id,
            ]);
        expect(resolveMagicCircleConnectionJoinSlotIndex(
            moved,
            edge.id
        )).toBe(1);

        const disconnected = syncGraphTopology({
            nodes: moved,
            edges: [],
        });
        expect(disconnected.nodes.some(
            isMagicCircleConnectionJoinNode
        )).toBe(false);
    });

    it('rejects moving a join inside a repeat interval', () => {
        const source = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'source'
        );
        const target = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'target'
        );
        const repeated = addMagicNodeToCircle(
            [source, target],
            'repeat',
            target.id
        );
        const withMiddle = addMagicNodeToCircle(
            repeated.nodes,
            'ignition',
            target.id,
            1
        );
        const edge = externalEdge(
            'edge-repeat',
            source.id,
            target.id
        );
        const connected = syncGraphTopology({
            nodes: withMiddle.nodes,
            edges: [edge],
        });
        const join = connected.nodes.find(
            isMagicCircleConnectionJoinNode
        )!;
        const origin = {
            nodeId: join.id,
            circleId: target.id,
            sequenceIndex: join.data.sequenceIndex!,
        };

        expect(moveMagicNodeGroup(
            connected,
            [origin],
            target.id,
            2
        ).moved).toBe(false);
        expect(moveMagicNodeGroup(
            connected,
            [origin],
            target.id,
            3
        ).moved).toBe(true);
    });

    it('does not change the existing external-circle stat result', () => {
        const source = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'source'
        );
        const target = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'target'
        );
        const nodes = normalizeMagicCircleSequences([
            source,
            target,
            attachNodeToCircle(
                createTestMagicNode('source-node', 'ignition'),
                source,
                0
            ),
            attachNodeToCircle(
                createTestMagicNode('target-node', 'stream'),
                target,
                0
            ),
        ]);
        const edge = externalEdge(
            'edge-stats',
            source.id,
            target.id
        );
        const before = calculateMagic(
            nodes,
            [edge],
            magicTypes
        );
        const withJoin = syncMagicCircleConnectionNodes(
            nodes,
            [edge]
        );
        const after = calculateMagic(
            normalizeMagicCircleSequences(withJoin.nodes),
            [edge],
            magicTypes
        );

        expect(after.totalStats).toEqual(before.totalStats);
        expect(after.circles.map(circle => circle.stats))
            .toEqual(before.circles.map(circle => circle.stats));
    });
});
