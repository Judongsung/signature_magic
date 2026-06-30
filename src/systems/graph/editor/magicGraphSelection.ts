import type {
    MagicCircleNode,
    MagicEditorNode,
} from '../../../types/magic';
import {
    getMagicCircleNodes,
    isMagicCircleNode,
} from '../model/magicCircleGraph';
import type { Point } from './editorCanvas';
import { findMagicCircleAtPoint } from './magicCircleEditorInteraction';

export const MAGIC_GRAPH_SELECTION_MODES = {
    CIRCLES: 'circles',
    UNITS: 'units',
} as const;

export type MagicGraphSelectionScope =
    | { mode: typeof MAGIC_GRAPH_SELECTION_MODES.CIRCLES }
    | {
        mode: typeof MAGIC_GRAPH_SELECTION_MODES.UNITS;
        circleId: string;
    };

export function resolveMagicGraphSelectionScope(
    point: Point,
    circles: readonly MagicCircleNode[]
): MagicGraphSelectionScope {
    const circle = findMagicCircleAtPoint(circles, point);

    return circle
        ? {
            mode: MAGIC_GRAPH_SELECTION_MODES.UNITS,
            circleId: circle.id,
        }
        : { mode: MAGIC_GRAPH_SELECTION_MODES.CIRCLES };
}

export function resolveMagicGraphCircleClickTargetId(
    point: Point,
    circles: readonly MagicCircleNode[]
): string | undefined {
    return findMagicCircleAtPoint(circles, point)?.id;
}

export function normalizeMagicGraphSelection(
    nodes: readonly MagicEditorNode[],
    scope: MagicGraphSelectionScope
): MagicEditorNode[] {
    let changed = false;
    const nextNodes = nodes.map(node => {
        const selected = shouldKeepNodeSelected(node, scope);
        if (Boolean(node.selected) === selected) return node;

        changed = true;
        return { ...node, selected };
    });

    return changed ? nextNodes : [...nodes];
}

function shouldKeepNodeSelected(
    node: MagicEditorNode,
    scope: MagicGraphSelectionScope
): boolean {
    if (!node.selected) return false;
    if (scope.mode === MAGIC_GRAPH_SELECTION_MODES.CIRCLES) {
        return isMagicCircleNode(node);
    }

    return !isMagicCircleNode(node) &&
        node.parentId === scope.circleId;
}

export function resolveMagicGraphSelectionTargetCircleId(
    nodes: readonly MagicEditorNode[]
): string | undefined {
    const selectedUnitCircleId = nodes.find(node =>
        !isMagicCircleNode(node) &&
        node.selected &&
        node.parentId
    )?.parentId;
    if (selectedUnitCircleId) return selectedUnitCircleId;

    return resolveUppermostSelectedCircle(getMagicCircleNodes(nodes))?.id;
}

export function resolveUppermostSelectedCircle(
    circles: readonly MagicCircleNode[]
): MagicCircleNode | undefined {
    return circles.reduce<{
        circle: MagicCircleNode;
        index: number;
    } | undefined>((current, circle, index) => {
        if (!circle.selected) return current;
        if (!current) return { circle, index };
        if (circle.position.y < current.circle.position.y) {
            return { circle, index };
        }
        if (
            circle.position.y === current.circle.position.y &&
            index > current.index
        ) {
            return { circle, index };
        }
        return current;
    }, undefined)?.circle;
}
