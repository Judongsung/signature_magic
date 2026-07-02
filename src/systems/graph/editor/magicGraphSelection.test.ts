import { describe, expect, it } from 'vitest';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import {
    type MagicEditorNode,
} from '../magicGraphTypes';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from '../model/magicCircleGraph';
import {
    MAGIC_GRAPH_SELECTION_MODES,
    normalizeMagicGraphSelection,
    resolveMagicGraphCircleClickTargetId,
    resolveMagicGraphSelectionScope,
    resolveMagicGraphSelectionTargetCircleId,
    resolveSelectedUnitInsertionIndex,
    resolveUppermostSelectedCircle,
} from './magicGraphSelection';

describe('magicGraphSelection', () => {
    it('uses the frontmost overlapping circle for an internal drag', () => {
        const back = createMagicCircleNode({ x: 0, y: 0 }, () => 'back');
        const front = createMagicCircleNode({ x: 0, y: 0 }, () => 'front');

        expect(resolveMagicGraphSelectionScope(
            { x: 100, y: 100 },
            [back, front]
        )).toEqual({
            mode: MAGIC_GRAPH_SELECTION_MODES.UNITS,
            circleId: front.id,
        });
        expect(resolveMagicGraphSelectionScope(
            { x: 1000, y: 1000 },
            [back, front]
        )).toEqual({ mode: MAGIC_GRAPH_SELECTION_MODES.CIRCLES });
        expect(resolveMagicGraphCircleClickTargetId(
            { x: 100, y: 100 },
            [back, front]
        )).toBe(front.id);
        expect(resolveMagicGraphCircleClickTargetId(
            { x: 1000, y: 1000 },
            [back, front]
        )).toBeUndefined();
    });

    it('keeps user and circle-system units from the scoped circle', () => {
        const first = createMagicCircleNode({ x: 0, y: 0 }, () => 'first');
        const second = createMagicCircleNode({ x: 520, y: 0 }, () => 'second');
        const firstUnit = {
            ...attachNodeToCircle(createTestMagicNode('first-unit'), first, 0),
            selected: true,
        };
        const secondUnit = {
            ...attachNodeToCircle(createTestMagicNode('second-unit'), second, 0),
            selected: true,
        };
        const manifestation: MagicEditorNode = {
            ...attachNodeToCircle(
                createTestMagicNode('manifestation', 'manifestation', {
                    nodeKind: 'system',
                }),
                first,
                1
            ),
            selected: true,
            selectable: true,
        };
        const selected = normalizeMagicGraphSelection(
            [
                { ...first, selected: true },
                { ...second, selected: true },
                firstUnit,
                secondUnit,
                manifestation,
            ],
            {
                mode: MAGIC_GRAPH_SELECTION_MODES.UNITS,
                circleId: first.id,
            }
        );

        expect(selected.filter(node => node.selected).map(node => node.id))
            .toEqual([firstUnit.id, manifestation.id]);
    });

    it('keeps only circles for an external drag', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'circle');
        const unit = {
            ...attachNodeToCircle(createTestMagicNode('unit'), circle, 0),
            selected: true,
        };
        const selected = normalizeMagicGraphSelection(
            [{ ...circle, selected: true }, unit],
            { mode: MAGIC_GRAPH_SELECTION_MODES.CIRCLES }
        );

        expect(selected.filter(node => node.selected).map(node => node.id))
            .toEqual([circle.id]);
    });

    it('inserts toolbar nodes after the lowest selected unit', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'circle');
        const first = attachNodeToCircle(
            createTestMagicNode('first'),
            circle,
            0
        );
        const second = attachNodeToCircle(
            createTestMagicNode('second'),
            circle,
            1
        );

        expect(resolveSelectedUnitInsertionIndex(
            [circle, first, second],
            circle.id,
            new Set([first.id, second.id])
        )).toBe(2);
        expect(resolveSelectedUnitInsertionIndex(
            [circle, first, second],
            circle.id,
            new Set()
        )).toBeUndefined();
    });

    it('targets the uppermost selected circle and breaks ties by front order', () => {
        const lower = {
            ...createMagicCircleNode({ x: 0, y: 200 }, () => 'lower'),
            selected: true,
        };
        const upperBack = {
            ...createMagicCircleNode({ x: 0, y: 0 }, () => 'upper-back'),
            selected: true,
        };
        const upperFront = {
            ...createMagicCircleNode({ x: 520, y: 0 }, () => 'upper-front'),
            selected: true,
        };

        expect(resolveUppermostSelectedCircle([
            lower,
            upperBack,
            upperFront,
        ], new Set([
            lower.id,
            upperBack.id,
            upperFront.id,
        ]))?.id).toBe(upperFront.id);
        expect(resolveMagicGraphSelectionTargetCircleId([
            lower,
            upperBack,
            upperFront,
        ])).toBe(upperFront.id);
    });
});
