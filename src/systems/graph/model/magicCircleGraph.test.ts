import { describe, expect, it } from 'vitest';
import {
    MAGIC_CIRCLE_NODE_CONFIG,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import {
    activateCircleForUnitSelection,
    attachNodeToCircle,
    createMagicCircleNode,
    createMagicCirclePortHandleIds,
    getCircleChildNodes,
    isMagicCirclePortHandleId,
    isMagicTypeAllowedInCircleSequence,
    orderMagicEditorNodes,
    readMagicCirclePortHandleIndex,
    resolveMagicCircleRequiredHeight,
    resolveSelectedUnitCircleId,
    selectOnlyCircle,
    syncMagicCirclePortCounts,
} from './magicCircleGraph';

describe('magicCircleGraph sequence model', () => {
    it('creates a selected circle with configured geometry', () => {
        expect(createMagicCircleNode({ x: 80, y: 120 }, () => 'fixed')).toMatchObject({
            id: 'circle-fixed',
            type: 'magicCircle',
            position: { x: 80, y: 120 },
            width: MAGIC_CIRCLE_NODE_CONFIG.DEFAULT_SIZE.width,
            height: MAGIC_CIRCLE_NODE_CONFIG.DEFAULT_SIZE.height,
            dragHandle: MAGIC_CIRCLE_NODE_CONFIG.DRAG_HANDLE_SELECTOR,
            selectable: false,
            selected: true,
            data: {
                nodeKind: MAGIC_NODE_KINDS.CIRCLE,
                inputHandleCount: 1,
                outputHandleCount: 1,
            },
        });
    });

    it('synchronizes connected circle ports and preserves references when unchanged', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'ports');
        const nodes = [circle];
        const edges = [
            {
                id: 'input-0',
                source: 'source-a',
                target: circle.id,
                sourceHandle: 'output-0',
                targetHandle: 'circle-input',
            },
            {
                id: 'input-1',
                source: 'source-b',
                target: circle.id,
                sourceHandle: 'output-0',
                targetHandle: 'circle-input-1',
            },
            {
                id: 'output-0',
                source: circle.id,
                target: 'target',
                sourceHandle: 'circle-output',
                targetHandle: 'input-0',
            },
        ];

        const firstSync = syncMagicCirclePortCounts(nodes, edges);
        const syncedCircle = firstSync.nodes[0];

        expect(firstSync.changed).toBe(true);
        expect(syncedCircle.data).toMatchObject({
            inputHandleCount: 3,
            outputHandleCount: 2,
        });

        const secondSync = syncMagicCirclePortCounts(firstSync.nodes, edges);

        expect(secondSync.changed).toBe(false);
        expect(secondSync.nodes).toBe(firstSync.nodes);
        expect(secondSync.nodes[0]).toBe(syncedCircle);
        expect(secondSync.nodes[0].data).toBe(syncedCircle.data);
    });

    it('updates only the circle whose port layout changed', () => {
        const first = createMagicCircleNode({ x: 0, y: 0 }, () => 'first-port');
        const second = createMagicCircleNode({ x: 520, y: 0 }, () => 'second-port');
        const nodes = [first, second];

        const update = syncMagicCirclePortCounts(nodes, [{
            id: 'first-input',
            source: 'source',
            target: first.id,
            sourceHandle: 'output-0',
            targetHandle: 'circle-input',
        }]);

        expect(update.nodes[0]).not.toBe(first);
        expect(update.nodes[0].data.inputHandleCount).toBe(2);
        expect(update.nodes[1]).toBe(second);
        expect(update.nodes[1].data).toBe(second.data);
    });

    it('attaches a unit node at its derived sequence slot', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'parent');
        const node = attachNodeToCircle(createTestMagicNode('child'), circle, 2);

        expect(node).toMatchObject({
            parentId: circle.id,
            position: { x: 32, y: 152 },
            connectable: false,
            data: { showBadges: false, sequenceIndex: 2 },
        });
        expect(node.style).toContain('--node-editor-node-width: 416px');
        expect(node.style).toContain('--node-editor-node-height: 40px');
    });

    it('sorts children by sequence index instead of runtime position', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'parent');
        const second = {
            ...attachNodeToCircle(createTestMagicNode('second'), circle, 1),
            position: { x: 0, y: 0 },
        };
        const first = {
            ...attachNodeToCircle(createTestMagicNode('first'), circle, 0),
            position: { x: 0, y: 999 },
        };

        expect(getCircleChildNodes([circle, second, first], circle.id)
            .map(node => node.id)
        ).toEqual(['first', 'second']);
    });

    it('calculates the minimum height from sequence length', () => {
        expect(resolveMagicCircleRequiredHeight(0)).toBe(400);
        expect(resolveMagicCircleRequiredHeight(8)).toBe(440);
    });

    it('keeps circle selection separate from selected unit nodes', () => {
        const first = createMagicCircleNode({ x: 0, y: 0 }, () => 'first');
        const second = createMagicCircleNode({ x: 520, y: 0 }, () => 'second');
        const child = {
            ...attachNodeToCircle(createTestMagicNode('child'), first, 0),
            selected: true,
        };

        const selected = selectOnlyCircle([first, second, child], second.id);
        expect(selected.find(node => node.id === second.id)?.selected).toBe(true);
        expect(selected.find(node => node.id === child.id)?.selected).toBe(false);

        const active = activateCircleForUnitSelection([first, child]);
        expect(active.find(node => node.id === first.id)?.selected).toBe(false);
        expect(active.find(node => node.id === child.id)?.selected).toBe(true);
    });

    it('keeps parents before ordered child nodes', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'parent');
        const second = attachNodeToCircle(createTestMagicNode('second'), circle, 1);
        const first = attachNodeToCircle(createTestMagicNode('first'), circle, 0);

        expect(orderMagicEditorNodes([second, circle, first]).map(node => node.id))
            .toEqual([circle.id, first.id, second.id]);
    });

    it('creates and parses dynamic external port ids', () => {
        expect(createMagicCirclePortHandleIds('input', 3)).toEqual([
            'circle-input',
            'circle-input-1',
            'circle-input-2',
        ]);
        expect(readMagicCirclePortHandleIndex('circle-input-2', 'input')).toBe(2);
        expect(isMagicCirclePortHandleId('circle-output-1', 'output')).toBe(true);
        expect(isMagicCirclePortHandleId('circle-start', 'output')).toBe(false);
    });

    it('disables repeat while retaining other sequence node types', () => {
        expect(isMagicTypeAllowedInCircleSequence('repeat')).toBe(false);
        expect(isMagicTypeAllowedInCircleSequence('branch')).toBe(true);
    });

    it('resolves an active circle only for one selected parent group', () => {
        const first = createMagicCircleNode({ x: 0, y: 0 }, () => 'first');
        const second = createMagicCircleNode({ x: 520, y: 0 }, () => 'second');
        const firstChild = {
            ...attachNodeToCircle(createTestMagicNode('first-child'), first, 0),
            selected: true,
        };
        const secondChild = {
            ...attachNodeToCircle(createTestMagicNode('second-child'), second, 0),
            selected: true,
        };

        expect(resolveSelectedUnitCircleId([first, second, firstChild])).toBe(first.id);
        expect(resolveSelectedUnitCircleId([
            first,
            second,
            firstChild,
            secondChild,
        ])).toBeUndefined();
    });
});
