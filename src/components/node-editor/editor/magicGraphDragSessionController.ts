import {
    type MagicNodeSequenceOrigin,
} from '../../../systems/graph/model/magicCircleGraphActions';
import {
    getMagicCircleNodes,
    isMagicCircleNode,
} from '../../../systems/graph/model/magicCircleGraph';
import {
    createMagicNodeDragOrigins,
    resolveMagicCircleSequenceInsertion,
    resolveMagicNodeSequenceDrop,
    type MagicNodeSequenceDrop,
} from '../../../systems/graph/editor/magicCircleEditorInteraction';
import {
    MAGIC_GRAPH_SELECTION_MODES,
    type MagicGraphSelectionScope,
} from '../../../systems/graph/editor/magicGraphSelection';
import {
    type MagicEditorNode,
} from '../../../systems/graph/magicGraphTypes';
import {
    type MagicType,
} from '../../../types/magicTypeConfig';
import {
    type Point,
} from '../../../systems/graph/editor/editorCanvas';

export const MAGIC_TYPE_DRAG_MIME_TYPE = 'application/magictype';

export interface MagicGraphDragSessionOptions {
    readNodes: () => readonly MagicEditorNode[];
    screenToFlowPosition: (point: Point) => Point;
    applySelectionScope: (scope: MagicGraphSelectionScope) => void;
    setSequenceDropPreview: (drop: MagicNodeSequenceDrop | undefined) => void;
    selectCircle: (circleId: string) => void;
    addNode: (
        magicType: MagicType,
        circleId: string,
        insertionIndex: number
    ) => boolean;
    moveNodeGroup: (
        origins: readonly MagicNodeSequenceOrigin[],
        targetCircleId: string | undefined,
        insertionIndex: number
    ) => boolean;
    commitCircleLayoutChanges: () => void;
}

export interface MagicGraphDragSessionController {
    startToolbarDrag: (event: DragEvent, magicType: MagicType) => void;
    updateToolbarDrag: (event: DragEvent) => void;
    dropToolbarNode: (event: DragEvent) => void;
    leaveToolbarDropArea: (event: DragEvent) => void;
    endToolbarDrag: () => void;
    startNodeDrag: (targetNode: MagicEditorNode | null | undefined) => void;
    updateNodeDrag: (event: MouseEvent | TouchEvent) => void;
    stopNodeDrag: (targetNode: MagicEditorNode | null | undefined) => void;
}

export function createMagicGraphDragSessionController(
    options: MagicGraphDragSessionOptions
): MagicGraphDragSessionController {
    let draggedNodeOrigins: MagicNodeSequenceOrigin[] = [];
    let sequenceDrop = createEmptySequenceDrop();

    function readNodesAndCircles() {
        const nodes = options.readNodes();
        return {
            nodes,
            circles: getMagicCircleNodes(nodes),
        };
    }

    function showSequenceDropPreview(drop: MagicNodeSequenceDrop): void {
        options.setSequenceDropPreview(
            drop.targetCircleId && drop.indicatorY !== undefined
                ? drop
                : undefined
        );
    }

    function clearNodeDragSession(): void {
        draggedNodeOrigins = [];
        sequenceDrop = createEmptySequenceDrop();
        options.setSequenceDropPreview(undefined);
    }

    return {
        startToolbarDrag(event, magicType) {
            event.dataTransfer?.setData(MAGIC_TYPE_DRAG_MIME_TYPE, magicType);
            if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
        },
        updateToolbarDrag(event) {
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
            if (!event.dataTransfer?.types.includes(MAGIC_TYPE_DRAG_MIME_TYPE)) {
                return;
            }

            const { nodes, circles } = readNodesAndCircles();
            showSequenceDropPreview(resolveMagicCircleSequenceInsertion(
                options.screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                }),
                nodes,
                circles
            ));
        },
        dropToolbarNode(event) {
            event.preventDefault();
            const magicType = event.dataTransfer?.getData(
                MAGIC_TYPE_DRAG_MIME_TYPE
            ) as MagicType | undefined;
            if (!magicType) {
                options.setSequenceDropPreview(undefined);
                return;
            }

            const { nodes, circles } = readNodesAndCircles();
            const drop = resolveMagicCircleSequenceInsertion(
                options.screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                }),
                nodes,
                circles
            );
            if (!drop.targetCircleId) {
                options.setSequenceDropPreview(undefined);
                return;
            }

            options.selectCircle(drop.targetCircleId);
            options.addNode(
                magicType,
                drop.targetCircleId,
                drop.insertionIndex
            );
            options.setSequenceDropPreview(undefined);
        },
        leaveToolbarDropArea(event) {
            const currentTarget = event.currentTarget;
            if (
                currentTarget instanceof HTMLElement &&
                event.relatedTarget instanceof Node &&
                currentTarget.contains(event.relatedTarget)
            ) {
                return;
            }

            options.setSequenceDropPreview(undefined);
        },
        endToolbarDrag() {
            options.setSequenceDropPreview(undefined);
        },
        startNodeDrag(targetNode) {
            sequenceDrop = createEmptySequenceDrop();
            options.setSequenceDropPreview(undefined);
            if (targetNode && isMagicCircleNode(targetNode)) {
                options.applySelectionScope({
                    mode: MAGIC_GRAPH_SELECTION_MODES.CIRCLES,
                });
                draggedNodeOrigins = [];
                return;
            }

            if (targetNode?.parentId) {
                options.applySelectionScope({
                    mode: MAGIC_GRAPH_SELECTION_MODES.UNITS,
                    circleId: targetNode.parentId,
                });
            }
            draggedNodeOrigins = createMagicNodeDragOrigins(options.readNodes());
            if (
                draggedNodeOrigins.length === 0 &&
                targetNode &&
                !isMagicCircleNode(targetNode) &&
                targetNode.parentId
            ) {
                draggedNodeOrigins = [{
                    nodeId: targetNode.id,
                    circleId: targetNode.parentId,
                    sequenceIndex: targetNode.data.sequenceIndex ?? 0,
                }];
            }
        },
        updateNodeDrag(event) {
            const screenPoint = readEventScreenPoint(event);
            if (!screenPoint || draggedNodeOrigins.length === 0) return;

            const { nodes, circles } = readNodesAndCircles();
            sequenceDrop = resolveMagicNodeSequenceDrop(
                options.screenToFlowPosition(screenPoint),
                draggedNodeOrigins,
                nodes,
                circles
            );
            showSequenceDropPreview(sequenceDrop);
        },
        stopNodeDrag(targetNode) {
            if (targetNode && isMagicCircleNode(targetNode)) {
                options.commitCircleLayoutChanges();
                clearNodeDragSession();
                return;
            }
            if (draggedNodeOrigins.length === 0) {
                clearNodeDragSession();
                return;
            }

            options.moveNodeGroup(
                draggedNodeOrigins,
                sequenceDrop.targetCircleId,
                sequenceDrop.insertionIndex
            );
            clearNodeDragSession();
        },
    };
}

export function readEventScreenPoint(
    event: MouseEvent | TouchEvent
): Point | undefined {
    if ('touches' in event) {
        const touch = event.touches[0] ?? event.changedTouches[0];
        return touch
            ? { x: touch.clientX, y: touch.clientY }
            : undefined;
    }

    return { x: event.clientX, y: event.clientY };
}

function createEmptySequenceDrop(): MagicNodeSequenceDrop {
    return {
        targetCircleId: undefined,
        insertionIndex: 0,
        indicatorY: undefined,
        beforeNodeId: undefined,
        afterNodeId: undefined,
    };
}
