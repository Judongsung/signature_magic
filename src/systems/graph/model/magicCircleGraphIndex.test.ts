import { describe, expect, it } from 'vitest';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from './magicCircleGraph';
import { createMagicCircleGraphIndex } from './magicCircleGraphIndex';

describe('magicCircleGraphIndex', () => {
    it('classifies nodes and sorts each child group without mutating input', () => {
        const firstCircle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'first'
        );
        const secondCircle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'second'
        );
        const lateChild = attachNodeToCircle(
            createTestMagicNode('late'),
            firstCircle,
            2
        );
        const earlyChild = attachNodeToCircle(
            createTestMagicNode('early'),
            firstCircle,
            0
        );
        const orphan = {
            ...createTestMagicNode('orphan'),
            parentId: 'missing-circle',
            data: {
                ...createTestMagicNode('orphan').data,
                sequenceIndex: 1,
            },
        };
        const topLevelUnit = createTestMagicNode('top-level');
        const nodes = [
            firstCircle,
            lateChild,
            secondCircle,
            orphan,
            earlyChild,
            topLevelUnit,
        ];
        const originalOrder = [...nodes];

        const index = createMagicCircleGraphIndex(nodes);

        expect(index.circles).toEqual([firstCircle, secondCircle]);
        expect(index.unitNodes).toEqual([
            lateChild,
            orphan,
            earlyChild,
            topLevelUnit,
        ]);
        expect(index.childrenByCircleId.get(firstCircle.id)
            ?.map(node => node.id)).toEqual(['early', 'late']);
        expect(index.childrenByCircleId.get('missing-circle'))
            .toEqual([orphan]);
        expect(index.nodeById.get(topLevelUnit.id)).toBe(topLevelUnit);
        expect(nodes).toEqual(originalOrder);
    });
});
