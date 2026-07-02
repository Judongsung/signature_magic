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
import { resolveMagicControlPairOverlayPresentation } from './magicControlPairPresentation';

const TEST_CIRCLE_WIDTH = 480;

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
        const overlay = resolveMagicControlPairOverlayPresentation(
            resolveMagicControlPairLayout(children),
            TEST_CIRCLE_WIDTH
        );

        expect(overlay.connectors).toEqual([
            {
                pairId: 'branch',
                path: [
                    'M 412 300',
                    'H 424',
                    'Q 430 300 430 306',
                    'V 334',
                    'Q 430 340 424 340',
                    'H 412',
                ].join(' '),
            },
        ]);
        expect(overlay.marker).toEqual({
            width: 6,
            height: 6,
            refX: 6,
            refY: 3,
            path: 'M 0 0 L 6 3 L 0 6',
        });
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
        const overlay = resolveMagicControlPairOverlayPresentation(
            resolveMagicControlPairLayout(children),
            TEST_CIRCLE_WIDTH
        );

        expect(overlay.connectors).toEqual([{
            pairId: 'branch',
            path: [
                'M 392 140',
                'H 424',
                'Q 430 140 430 146',
                'V 294',
                'Q 430 300 424 300',
                'H 392',
            ].join(' '),
        }]);
    });

    it('renders a malformed legacy upward pair defensively', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'upward-presentation'
        );
        const children = pair(
            circle,
            'upward',
            'branch',
            1,
            0
        ).sort(compareMagicCircleSequenceNodes);
        const overlay = resolveMagicControlPairOverlayPresentation(
            resolveMagicControlPairLayout(children),
            TEST_CIRCLE_WIDTH
        );

        expect(overlay.connectors).toEqual([{
            pairId: 'upward',
            path: [
                'M 412 140',
                'H 424',
                'Q 430 140 430 134',
                'V 106',
                'Q 430 100 424 100',
                'H 412',
            ].join(' '),
        }]);
    });
});
