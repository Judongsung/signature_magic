import {
    type MagicCircleNode,
    type MagicEditorNode,
} from '../magicGraphTypes';
import {
    getMagicCircleNodes,
    getCircleChildNodes,
    getMagicUnitNodes,
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

export function selectOnlyCircle(
    nodes: readonly MagicEditorNode[],
    circleId: string | undefined
): MagicEditorNode[] {
    return nodes.map(node => {
        const selected = isMagicCircleNode(node)
            ? node.id === circleId
            : false;
        return Boolean(node.selected) === selected
            ? node
            : { ...node, selected };
    });
}

export function activateCircleForUnitSelection(
    nodes: readonly MagicEditorNode[]
): MagicEditorNode[] {
    return nodes.map(node =>
        isMagicCircleNode(node) && node.selected
            ? { ...node, selected: false }
            : node
    );
}

export function resolveSelectedUnitCircleId(
    nodes: readonly MagicEditorNode[]
): string | undefined {
    const selectedCircleIds = new Set(
        getMagicUnitNodes(nodes)
            .filter(node => node.selected && node.parentId)
            .map(node => node.parentId!)
    );

    return selectedCircleIds.size === 1
        ? selectedCircleIds.values().next().value
        : undefined;
}

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

export function resolveSelectedUnitInsertionIndex(
    nodes: readonly MagicEditorNode[],
    circleId: string,
    selectedNodeIds: ReadonlySet<string>
): number | undefined {
    const children = getCircleChildNodes(nodes, circleId);
    const lastSelectedIndex = children.findLastIndex(node =>
        selectedNodeIds.has(node.id)
    );

    return lastSelectedIndex < 0
        ? undefined
        : lastSelectedIndex + 1;
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
    const selectedNodeIds = new Set(
        nodes.filter(node => node.selected).map(node => node.id)
    );
    const selectedUnitCircleId = nodes.find(node =>
        !isMagicCircleNode(node) &&
        selectedNodeIds.has(node.id) &&
        node.parentId
    )?.parentId;
    if (selectedUnitCircleId) return selectedUnitCircleId;

    return resolveUppermostSelectedCircle(
        getMagicCircleNodes(nodes),
        selectedNodeIds
    )?.id;
}

export function resolveUppermostSelectedCircle(
    circles: readonly MagicCircleNode[],
    selectedNodeIds: ReadonlySet<string>
): MagicCircleNode | undefined {
    return circles.reduce<{
        circle: MagicCircleNode;
        index: number;
    } | undefined>((current, circle, index) => {
        if (!selectedNodeIds.has(circle.id)) return current;
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
