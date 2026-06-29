import { describe, expect, it } from 'vitest';
import {
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import type { MagicNode, MagicType } from '../../../types/magic';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from './magicCircleGraph';
import {
    canMoveMagicControlPairsAcrossCircles,
    collectMagicControlPairDeletionIds,
    isMagicControlPairGraphValid,
    resolveMagicControlPairLanes,
} from './magicControlPairs';

function marker(
    id: string,
    magicType: MagicType,
    pairId: string,
    role: 'start' | 'end'
): MagicNode {
    return {
        ...createTestMagicNode(id, magicType),
        data: {
            ...createTestMagicNode(id, magicType).data,
            controlPair: { id: pairId, role },
            ...(role === MAGIC_CONTROL_PAIR_ROLES.END
                ? { excludeFromStatScaling: true }
                : {}),
        },
    };
}

function pair(
    circle: ReturnType<typeof createMagicCircleNode>,
    pairId: string,
    magicType: MagicType,
    startIndex: number,
    endIndex: number
): MagicNode[] {
    return [
        attachNodeToCircle(
            marker(
                `${pairId}-start`,
                magicType,
                pairId,
                MAGIC_CONTROL_PAIR_ROLES.START
            ),
            circle,
            startIndex
        ),
        attachNodeToCircle(
            marker(
                `${pairId}-end`,
                magicType,
                pairId,
                MAGIC_CONTROL_PAIR_ROLES.END
            ),
            circle,
            endIndex
        ),
    ];
}

describe('magicControlPairs', () => {
    it('allows nested repeats and rejects crossed repeats', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'repeat'
        );
        const outer = pair(circle, 'outer', 'repeat', 0, 5);
        const nested = pair(circle, 'nested', 'repeat', 1, 4);
        const crossed = pair(circle, 'crossed', 'repeat', 3, 6);

        expect(isMagicControlPairGraphValid([
            circle,
            ...outer,
            ...nested,
        ])).toBe(true);
        expect(isMagicControlPairGraphValid([
            circle,
            ...outer,
            ...crossed,
        ])).toBe(false);
    });

    it('allows crossed branch intervals', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'branch'
        );

        expect(isMagicControlPairGraphValid([
            circle,
            ...pair(circle, 'first', 'branch', 0, 3),
            ...pair(circle, 'second', 'branch', 1, 4),
        ])).toBe(true);
    });

    it('allows a branch target above its condition marker', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'branch-up'
        );

        expect(isMagicControlPairGraphValid([
            circle,
            ...pair(circle, 'inverted', 'branch', 3, 1),
        ])).toBe(true);
    });

    it('requires complete ordered pairs in one circle', () => {
        const first = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'first'
        );
        const second = createMagicCircleNode(
            { x: 520, y: 0 },
            () => 'second'
        );
        const [start, end] = pair(first, 'pair', 'repeat', 0, 1);

        expect(isMagicControlPairGraphValid([first, start])).toBe(false);
        expect(isMagicControlPairGraphValid([
            first,
            second,
            start,
            { ...end, parentId: second.id },
        ])).toBe(false);
        expect(isMagicControlPairGraphValid([
            first,
            { ...start, data: { ...start.data, sequenceIndex: 2 } },
            end,
        ])).toBe(false);
    });

    it('expands deletion to the partner but not enclosed nodes', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'delete'
        );
        const [start, end] = pair(circle, 'pair', 'repeat', 0, 2);
        const middle = attachNodeToCircle(
            createTestMagicNode('middle'),
            circle,
            1
        );

        expect(collectMagicControlPairDeletionIds(
            [circle, start, middle, end],
            new Set([start.id])
        )).toEqual(new Set([start.id, end.id]));
    });

    it('requires both markers for a cross-circle move', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'move'
        );
        const [start, end] = pair(circle, 'pair', 'branch', 0, 1);
        const nodes = [circle, start, end];

        expect(canMoveMagicControlPairsAcrossCircles(
            nodes,
            new Set([start.id])
        )).toBe(false);
        expect(canMoveMagicControlPairsAcrossCircles(
            nodes,
            new Set([start.id, end.id])
        )).toBe(true);
    });

    it('assigns separate lanes only to overlapping spans', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'lanes'
        );
        const nodes = [
            circle,
            ...pair(circle, 'first', 'branch', 0, 2),
            ...pair(circle, 'overlap', 'branch', 1, 3),
            ...pair(circle, 'inverted', 'branch', 6, 4),
            ...pair(circle, 'later', 'branch', 4, 5),
        ];

        expect(resolveMagicControlPairLanes(nodes, circle.id)
            .map(item => [item.pair.id, item.lane])
        ).toEqual([
            ['first', 0],
            ['overlap', 1],
            ['later', 0],
            ['inverted', 1],
        ]);
    });
});
