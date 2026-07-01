import {
    type MagicCircleNode,
    type MagicEditorNode,
    type MagicNode,
} from '../magicGraphTypes';
import type { MagicGraphEdge } from '../magicGraphTypes';

type MagicGraphNodeViewKey =
    | 'selected'
    | 'dragging'
    | 'measured';

type WithoutMagicGraphNodeView<T> =
    T extends unknown
        ? Omit<T, MagicGraphNodeViewKey>
        : never;

export type MagicGraphDocumentNode =
    | WithoutMagicGraphNodeView<MagicNode>
    | WithoutMagicGraphNodeView<MagicCircleNode>;

export type MagicGraphDocumentEdge = Omit<MagicGraphEdge, 'selected'>;

export interface MagicGraphDocument {
    nodes: MagicGraphDocumentNode[];
    edges: MagicGraphDocumentEdge[];
}

export interface MagicGraphDocumentSource {
    nodes: readonly MagicEditorNode[];
    edges: readonly MagicGraphEdge[];
}

export function createMagicGraphDocument(
    source: MagicGraphDocumentSource
): MagicGraphDocument {
    return {
        nodes: source.nodes.map(toMagicGraphDocumentNode),
        edges: source.edges.map(toMagicGraphDocumentEdge),
    };
}

function toMagicGraphDocumentNode(
    node: MagicEditorNode
): MagicGraphDocumentNode {
    const {
        selected: _selected,
        dragging: _dragging,
        measured: _measured,
        ...documentNode
    } = node;

    return documentNode;
}

function toMagicGraphDocumentEdge(
    edge: MagicGraphEdge
): MagicGraphDocumentEdge {
    const {
        selected: _selected,
        ...documentEdge
    } = edge;

    return documentEdge;
}
