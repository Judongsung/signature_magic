import { describe, expect, it } from 'vitest';
import {
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import {
    type MagicNode,
} from '../magicGraphTypes';
import {
    type MagicType,
} from '../../../types/magicTypeConfig';
import {
    attachNodeToCircle,
    compareMagicCircleSequenceNodes,
    createMagicCircleNode,
} from '../model/magicCircleGraph';
import { resolveMagicControlPairLayout } from '../model/magicControlPairs';
import { resolveMagicControlPairConnectors } from './magicControlPairPresentation';

function marker(
    id: string,
    magicType: MagicType,
    pairId: string,
    role: 'start' | 'end',
    circle: ReturnType<typeof createMagicCircleNode>,
    sequenceIndex: number
): MagicNode {
    const node = createTestMagicNode(id, magicType);
    return attachNodeToCircle({
        ...node,
        data: {
            ...node.data,
            controlPair: { id: pairId, role },
            ...(role === MAGIC_CONTROL_PAIR_ROLES.END
                ? { excludeFromStatScaling: true }
                : {}),
        },
    }, circle, sequenceIndex);
}

function pair(
    circle: ReturnType<typeof createMagicCircleNode>,
    pairId: string,
    magicType: MagicType,
    startIndex: number,
    endIndex: number
): MagicNode[] {
    return [
        marker(
            `${pairId}-start`,
            magicType,
            pairId,
            MAGIC_CONTROL_PAIR_ROLES.START,
            circle,
            startIndex
        ),
        marker(
            `${pairId}-end`,
            magicType,
            pairId,
            MAGIC_CONTROL_PAIR_ROLES.END,
            circle,
            endIndex
        ),
    ];
}

describe('magicControlPairPresentation', () => {
    it('omits repeat connectors and keeps branch connectors on the right', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'presentation'
        );
        const children = [
            ...pair(circle, 'outer', 'repeat', 0, 4),
            ...pair(circle, 'inner', 'repeat', 1, 3),
            ...pair(circle, 'branch', 'branch', 5, 6),
        ].sort(compareMagicCircleSequenceNodes);
        const connectors = resolveMagicControlPairConnectors(
            resolveMagicControlPairLayout(children)
        );

        expect(connectors).toEqual([
            {
                pairId: 'branch',
                lane: 0,
                startIndentDepth: 0,
                endIndentDepth: 0,
                railIndentDepth: 0,
                startY: 300,
                endY: 340,
            },
        ]);
    });

    it('places a nested branch rail beyond the deepest repeated content', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'nested-presentation'
        );
        const children = [
            ...pair(circle, 'outer', 'repeat', 0, 6),
            ...pair(circle, 'branch', 'branch', 1, 5),
            ...pair(circle, 'inner', 'repeat', 2, 4),
            attachNodeToCircle(
                createTestMagicNode('content'),
                circle,
                3
            ),
        ].sort(compareMagicCircleSequenceNodes);
        const connectors = resolveMagicControlPairConnectors(
            resolveMagicControlPairLayout(children)
        );

        expect(connectors).toEqual([{
            pairId: 'branch',
            lane: 0,
            startIndentDepth: 1,
            endIndentDepth: 1,
            railIndentDepth: 2,
            startY: 140,
            endY: 300,
        }]);
    });
});
