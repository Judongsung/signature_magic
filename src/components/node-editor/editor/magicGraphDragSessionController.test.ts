// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from '../../../systems/graph/model/magicCircleGraph';
import {
    MAGIC_GRAPH_SELECTION_MODES,
} from '../../../systems/graph/editor/magicGraphSelection';
import {
    createMagicGraphDragSessionController,
    MAGIC_TYPE_DRAG_MIME_TYPE,
    type MagicGraphDragSessionOptions,
} from './magicGraphDragSessionController';

function createOptions(
    overrides: Partial<MagicGraphDragSessionOptions> = {}
) {
    const source = createMagicCircleNode({ x: 0, y: 0 }, () => 'source');
    const target = createMagicCircleNode({ x: 520, y: 0 }, () => 'target');
    const movingNodes = ['a', 'b'].map((id, index) => ({
        ...attachNodeToCircle(createTestMagicNode(id), source, index),
        selected: true,
    }));
    const targetNode = attachNodeToCircle(
        createTestMagicNode('target-node'),
        target,
        0
    );
    const nodes = [source, target, ...movingNodes, targetNode];
    const options = {
        readNodes: vi.fn(() => nodes),
        screenToFlowPosition: vi.fn(point => point),
        applySelectionScope: vi.fn(),
        setSequenceDropPreview: vi.fn(),
        selectCircle: vi.fn(),
        addNode: vi.fn(() => true),
        moveNodeGroup: vi.fn(() => true),
        commitCircleLayoutChanges: vi.fn(),
        ...overrides,
    } satisfies MagicGraphDragSessionOptions;

    return { source, target, movingNodes, targetNode, options };
}

function createDragEvent(
    dataTransfer: Partial<DataTransfer>,
    point = { x: 600, y: 120 }
): DragEvent {
    return {
        clientX: point.x,
        clientY: point.y,
        dataTransfer,
        preventDefault: vi.fn(),
        currentTarget: null,
        relatedTarget: null,
    } as unknown as DragEvent;
}

describe('magicGraphDragSessionController', () => {
    it('writes the toolbar drag contract and inserts at the resolved slot', () => {
        const { target, options } = createOptions();
        const controller = createMagicGraphDragSessionController(options);
        const setData = vi.fn();
        const startTransfer = {
            effectAllowed: 'uninitialized',
            setData,
        } as unknown as DataTransfer;
        const startEvent = createDragEvent(startTransfer);

        controller.startToolbarDrag(startEvent, 'ignition');

        expect(setData).toHaveBeenCalledWith(
            MAGIC_TYPE_DRAG_MIME_TYPE,
            'ignition'
        );
        expect(startTransfer.effectAllowed).toBe('move');

        const dropTransfer = {
            types: [MAGIC_TYPE_DRAG_MIME_TYPE],
            dropEffect: 'none',
            getData: vi.fn(() => 'ignition'),
        } as unknown as DataTransfer;
        const dropEvent = createDragEvent(dropTransfer);

        controller.updateToolbarDrag(dropEvent);
        expect(options.setSequenceDropPreview).toHaveBeenLastCalledWith(
            expect.objectContaining({
                targetCircleId: target.id,
                insertionIndex: 1,
            })
        );

        controller.dropToolbarNode(dropEvent);

        expect(options.selectCircle).toHaveBeenCalledWith(target.id);
        expect(options.addNode).toHaveBeenCalledWith(
            'ignition',
            target.id,
            1
        );
        expect(options.setSequenceDropPreview).toHaveBeenLastCalledWith(
            undefined
        );
    });

    it('clears toolbar previews on invalid drop and external leave only', () => {
        const { options } = createOptions();
        const controller = createMagicGraphDragSessionController(options);
        const invalidDrop = createDragEvent({
            types: [],
            getData: vi.fn(() => ''),
        });

        controller.dropToolbarNode(invalidDrop);
        expect(options.addNode).not.toHaveBeenCalled();
        expect(options.setSequenceDropPreview).toHaveBeenLastCalledWith(
            undefined
        );

        vi.mocked(options.setSequenceDropPreview).mockClear();
        const parent = document.createElement('div');
        const child = document.createElement('span');
        parent.append(child);
        controller.leaveToolbarDropArea({
            currentTarget: parent,
            relatedTarget: child,
        } as unknown as DragEvent);
        expect(options.setSequenceDropPreview).not.toHaveBeenCalled();

        controller.leaveToolbarDropArea({
            currentTarget: parent,
            relatedTarget: document.body,
        } as unknown as DragEvent);
        expect(options.setSequenceDropPreview).toHaveBeenCalledWith(undefined);
    });

    it('moves the selected unit group using the current drop session', () => {
        const { target, movingNodes, options } = createOptions();
        const controller = createMagicGraphDragSessionController(options);

        controller.startNodeDrag(movingNodes[0]);
        controller.updateNodeDrag(new MouseEvent('mousemove', {
            clientX: 600,
            clientY: 120,
        }));
        controller.stopNodeDrag(movingNodes[0]);

        expect(options.applySelectionScope).toHaveBeenCalledWith({
            mode: MAGIC_GRAPH_SELECTION_MODES.UNITS,
            circleId: movingNodes[0].parentId,
        });
        expect(options.moveNodeGroup).toHaveBeenCalledWith(
            movingNodes.map((node, sequenceIndex) => ({
                nodeId: node.id,
                circleId: node.parentId,
                sequenceIndex,
            })),
            target.id,
            1
        );
        expect(options.setSequenceDropPreview).toHaveBeenLastCalledWith(
            undefined
        );
    });

    it('commits circle layout without invoking unit movement', () => {
        const { source, options } = createOptions();
        const controller = createMagicGraphDragSessionController(options);

        controller.startNodeDrag(source);
        controller.stopNodeDrag(source);

        expect(options.applySelectionScope).toHaveBeenCalledWith({
            mode: MAGIC_GRAPH_SELECTION_MODES.CIRCLES,
        });
        expect(options.commitCircleLayoutChanges).toHaveBeenCalledOnce();
        expect(options.moveNodeGroup).not.toHaveBeenCalled();
    });
});
