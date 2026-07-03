import { MAGIC_CIRCLE_SEQUENCE_CONFIG } from '../../../constants/graphConfigs';
import {
    type MagicCircleNode,
    type MagicEditorNode,
} from '../magicGraphTypes';
import {
    getCircleChildNodes,
    getMagicUnitNodes,
    readMagicCircleSequenceIndex,
} from '../model/magicCircleGraph';
import type {
    MagicNodeSequenceOrigin,
} from '../model/magicCircleGraphActions';
import type { Point } from './editorCanvas';

export interface MagicNodeSequenceDrop {
    targetCircleId: string | undefined;
    insertionIndex: number;
    indicatorY: number | undefined;
    beforeNodeId: string | undefined;
    afterNodeId: string | undefined;
}

export function findMagicCircleAtPoint(
    circles: readonly MagicCircleNode[],
    point: Point
): MagicCircleNode | undefined {
    return [...circles].reverse().find(circle =>
        point.x >= circle.position.x &&
        point.x <= circle.position.x + circle.width &&
        point.y >= circle.position.y &&
        point.y <= circle.position.y + circle.height
    );
}

export function createMagicNodeDragOrigins(
    nodes: readonly MagicEditorNode[]
): MagicNodeSequenceOrigin[] {
    return getMagicUnitNodes(nodes)
        .filter(node =>
            node.selected &&
            node.parentId &&
            node.draggable !== false
        )
        .map(node => ({
            nodeId: node.id,
            circleId: node.parentId!,
            sequenceIndex: readMagicCircleSequenceIndex(node),
        }));
}

export function resolveMagicNodeSequenceDrop(
    point: Point,
    origins: readonly MagicNodeSequenceOrigin[],
    nodes: readonly MagicEditorNode[],
    circles: readonly MagicCircleNode[]
): MagicNodeSequenceDrop {
    const sourceCircleIds = new Set(origins.map(origin => origin.circleId));
    if (
        origins.length === 0 ||
        sourceCircleIds.size !== 1
    ) {
        return {
            targetCircleId: undefined,
            insertionIndex: 0,
            indicatorY: undefined,
            beforeNodeId: undefined,
            afterNodeId: undefined,
        };
    }

    const movingIds = new Set(origins.map(origin => origin.nodeId));
    return resolveMagicCircleSequenceInsertion(
        point,
        nodes,
        circles,
        movingIds
    );
}

export function resolveMagicCircleSequenceInsertion(
    point: Point,
    nodes: readonly MagicEditorNode[],
    circles: readonly MagicCircleNode[],
    excludedNodeIds: ReadonlySet<string> = new Set()
): MagicNodeSequenceDrop {
    const targetCircle = findMagicCircleAtPoint(circles, point);
    if (!targetCircle) {
        return {
            targetCircleId: undefined,
            insertionIndex: 0,
            indicatorY: undefined,
            beforeNodeId: undefined,
            afterNodeId: undefined,
        };
    }

    const targetChildren = getCircleChildNodes(nodes, targetCircle.id)
        .filter(node => !excludedNodeIds.has(node.id));
    const relativeY = point.y - targetCircle.position.y;
    const slotSize =
        MAGIC_CIRCLE_SEQUENCE_CONFIG.NODE_HEIGHT +
        MAGIC_CIRCLE_SEQUENCE_CONFIG.VERTICAL_GAP;
    const rawIndex = Math.ceil(
        (
            relativeY -
            MAGIC_CIRCLE_SEQUENCE_CONFIG.CONTENT_TOP -
            MAGIC_CIRCLE_SEQUENCE_CONFIG.NODE_HEIGHT / 2
        ) / slotSize
    );
    const insertionIndex = Math.max(
        0,
        Math.min(rawIndex, targetChildren.length)
    );
    const indicatorY =
        MAGIC_CIRCLE_SEQUENCE_CONFIG.CONTENT_TOP +
        insertionIndex * slotSize;

    return {
        targetCircleId: targetCircle.id,
        insertionIndex,
        indicatorY,
        beforeNodeId: targetChildren[insertionIndex]?.id,
        afterNodeId: insertionIndex === targetChildren.length
            ? targetChildren.at(-1)?.id
            : undefined,
    };
}
