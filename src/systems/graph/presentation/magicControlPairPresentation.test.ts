import { describe, expect, it } from 'vitest';
import {
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import type { MagicNode, MagicType } from '../../../types/magic';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from '../model/magicCircleGraph';
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
    it('places repeat connectors on left indentation lanes and branches on the right', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'presentation'
        );
        const connectors = resolveMagicControlPairConnectors([
            circle,
            ...pair(circle, 'outer', 'repeat', 0, 4),
            ...pair(circle, 'inner', 'repeat', 1, 3),
            ...pair(circle, 'branch', 'branch', 5, 6),
        ], circle.id);

        expect(connectors).toEqual([
            {
                pairId: 'outer',
                kind: 'repeat',
                lane: 0,
                side: 'left',
                startY: 100,
                endY: 260,
            },
            {
                pairId: 'inner',
                kind: 'repeat',
                lane: 1,
                side: 'left',
                startY: 140,
                endY: 220,
            },
            {
                pairId: 'branch',
                kind: 'branch',
                lane: 0,
                side: 'right',
                startY: 300,
                endY: 340,
            },
        ]);
    });
});
