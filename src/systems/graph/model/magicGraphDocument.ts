import type { Edge } from '@xyflow/svelte';
import type {
    MagicCircleNode,
    MagicEditorNode,
    MagicNode,
} from '../../../types/magic';

type MagicGraphNodeViewKey =
    | 'selected'
    | 'dragging'
    | 'measured';

type WithoutMagicGraphNodeView<T> =
    Omit<T, MagicGraphNodeViewKey>;

export type MagicGraphDocumentNode =
    | WithoutMagicGraphNodeView<MagicNode>
    | WithoutMagicGraphNodeView<MagicCircleNode>;

export type MagicGraphDocumentEdge = Omit<Edge, 'selected'>;

export interface MagicGraphDocument {
    nodes: MagicGraphDocumentNode[];
    edges: MagicGraphDocumentEdge[];
}

export interface MagicGraphDocumentSource {
    nodes: readonly MagicEditorNode[];
    edges: readonly Edge[];
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
    edge: Edge
): MagicGraphDocumentEdge {
    const {
        selected: _selected,
        ...documentEdge
    } = edge;

    return documentEdge;
}
