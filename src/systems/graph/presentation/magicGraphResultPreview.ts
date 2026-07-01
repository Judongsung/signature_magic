import type { Edge, FitViewOptions } from '@xyflow/svelte';
import {
    MAGIC_GRAPH_RESULT_PREVIEW_CONFIG,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import {
    type MagicEditorNode,
} from '../magicGraphTypes';
import { isMagicCircleNode } from '../model/magicCircleGraph';

type MagicGraphResultPreviewConfig = typeof MAGIC_GRAPH_RESULT_PREVIEW_CONFIG;

export interface MagicGraphResultPreviewBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
}

export interface MagicGraphResultPreviewModel {
    nodes: MagicEditorNode[];
    edges: Edge[];
    bounds: MagicGraphResultPreviewBounds;
    aspectRatio: number;
    fitViewOptions: FitViewOptions<MagicEditorNode>;
}

function clonePreviewNode(node: MagicEditorNode): MagicEditorNode {
    if (isMagicCircleNode(node)) {
        return {
            ...node,
            data: { ...node.data },
            position: { ...node.position },
            draggable: false,
            selectable: false,
            connectable: false,
            selected: false,
        };
    }

    if (node.data.nodeKind === MAGIC_NODE_KINDS.USER) {
        return {
            ...node,
            data: { ...node.data, showTooltip: false },
            position: { ...node.position },
            draggable: false,
            selectable: false,
            connectable: false,
            selected: false,
        };
    }

    return {
        ...node,
        data: { ...node.data, showTooltip: false },
        position: { ...node.position },
        draggable: false,
        selectable: false,
        connectable: false,
        selected: false,
    };
}

function clonePreviewEdge(edge: Edge): Edge {
    return {
        ...edge,
        selectable: false,
        selected: false,
    };
}

function createEmptyBounds(config: MagicGraphResultPreviewConfig): MagicGraphResultPreviewBounds {
    const width = config.NODE_SIZE.width + config.BOUNDS_PADDING_PX * 2;
    const height = config.NODE_SIZE.height + config.BOUNDS_PADDING_PX * 2;

    return {
        minX: -width / 2,
        minY: -height / 2,
        maxX: width / 2,
        maxY: height / 2,
        width,
        height,
    };
}

function calculatePreviewBounds(
    nodes: readonly MagicEditorNode[],
    config: MagicGraphResultPreviewConfig
): MagicGraphResultPreviewBounds {
    if (nodes.length === 0) return createEmptyBounds(config);

    const rootNodes = nodes.filter(node => !node.parentId);
    const minX = Math.min(...rootNodes.map(node => node.position.x)) - config.BOUNDS_PADDING_PX;
    const minY = Math.min(...rootNodes.map(node => node.position.y)) - config.BOUNDS_PADDING_PX;
    const maxX = Math.max(...rootNodes.map(node =>
        node.position.x + (isMagicCircleNode(node) ? node.width : config.NODE_SIZE.width)
    ))
        + config.BOUNDS_PADDING_PX;
    const maxY = Math.max(...rootNodes.map(node =>
        node.position.y + (isMagicCircleNode(node) ? node.height : config.NODE_SIZE.height)
    ))
        + config.BOUNDS_PADDING_PX;

    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

function calculateAspectRatio(
    bounds: MagicGraphResultPreviewBounds,
    config: MagicGraphResultPreviewConfig
): number {
    if (bounds.width <= 0 || bounds.height <= 0) return config.DEFAULT_ASPECT_RATIO;

    return bounds.width / bounds.height;
}

function filterPreviewEdges(edges: readonly Edge[], nodes: readonly MagicEditorNode[]): Edge[] {
    const nodeIds = new Set(nodes.map(node => node.id));

    return edges
        .filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
        .map(clonePreviewEdge);
}

export function buildMagicGraphResultPreview(
    nodes: readonly MagicEditorNode[],
    edges: readonly Edge[],
    config: MagicGraphResultPreviewConfig = MAGIC_GRAPH_RESULT_PREVIEW_CONFIG
): MagicGraphResultPreviewModel {
    const previewNodes = nodes.map(clonePreviewNode);
    const bounds = calculatePreviewBounds(previewNodes, config);

    return {
        nodes: previewNodes,
        edges: filterPreviewEdges(edges, previewNodes),
        bounds,
        aspectRatio: previewNodes.length === 0
            ? config.DEFAULT_ASPECT_RATIO
            : calculateAspectRatio(bounds, config),
        fitViewOptions: {
            padding: config.FIT_VIEW_PADDING,
            minZoom: config.FIT_VIEW_MIN_ZOOM,
            maxZoom: config.FIT_VIEW_MAX_ZOOM,
            duration: 0,
            includeHiddenNodes: true,
        },
    };
}
