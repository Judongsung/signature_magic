import type { Edge } from '@xyflow/svelte';
import {
    type MagicEditorNode,
} from '../magicGraphTypes';
import {
    isMagicCircleNode,
} from '../model/magicCircleGraph';
import type {
    MagicGraphDocumentEdge,
    MagicGraphDocumentNode,
} from '../model/magicGraphDocument';

export interface MagicCircleLayoutCommit {
    nodes: MagicGraphDocumentNode[];
    changed: boolean;
}

export function acceptMagicGraphFlowNodes(
    documentNodes: readonly MagicGraphDocumentNode[],
    incomingNodes: readonly MagicEditorNode[]
): MagicEditorNode[] {
    const documentById = new Map(
        documentNodes.map(node => [node.id, node])
    );
    const acceptedIds = new Set<string>();

    return incomingNodes.flatMap(incoming => {
        const documentNode = documentById.get(incoming.id);
        if (!documentNode || acceptedIds.has(incoming.id)) return [];

        acceptedIds.add(incoming.id);
        return [mergeAcceptedNodeView(documentNode, incoming)];
    });
}

export function acceptMagicGraphFlowEdges(
    documentEdges: readonly MagicGraphDocumentEdge[],
    incomingEdges: readonly Edge[]
): Edge[] {
    const documentById = new Map(
        documentEdges.map(edge => [edge.id, edge])
    );
    const acceptedIds = new Set<string>();

    return incomingEdges.flatMap(incoming => {
        const documentEdge = documentById.get(incoming.id);
        if (!documentEdge || acceptedIds.has(incoming.id)) return [];

        acceptedIds.add(incoming.id);
        return [{
            ...documentEdge,
            selected: Boolean(incoming.selected),
        }];
    });
}

export function projectMagicGraphFlowNodes(
    documentNodes: readonly MagicGraphDocumentNode[],
    previousNodes: readonly MagicEditorNode[] = []
): MagicEditorNode[] {
    const previousById = new Map(
        previousNodes.map(node => [node.id, node])
    );

    return documentNodes.map(documentNode =>
        mergeProjectedNodeView(
            documentNode,
            previousById.get(documentNode.id)
        )
    );
}

export function projectMagicGraphFlowEdges(
    documentEdges: readonly MagicGraphDocumentEdge[],
    previousEdges: readonly Edge[] = []
): Edge[] {
    const previousById = new Map(
        previousEdges.map(edge => [edge.id, edge])
    );

    return documentEdges.map(documentEdge => ({
        ...documentEdge,
        selected: Boolean(previousById.get(documentEdge.id)?.selected),
    }));
}

export function readSelectedMagicGraphNodeIds(
    nodes: readonly MagicEditorNode[]
): Set<string> {
    return new Set(
        nodes.filter(node => node.selected).map(node => node.id)
    );
}

export function selectMagicGraphFlowNodes(
    nodes: readonly MagicEditorNode[],
    selectedNodeIds: ReadonlySet<string>
): MagicEditorNode[] {
    return nodes.map(node => {
        const selected = selectedNodeIds.has(node.id);
        return Boolean(node.selected) === selected
            ? node
            : { ...node, selected };
    });
}

export function promoteMagicCircleFlowPositions(
    documentNodes: readonly MagicGraphDocumentNode[],
    flowNodes: readonly MagicEditorNode[]
): MagicCircleLayoutCommit {
    const flowById = new Map(flowNodes.map(node => [node.id, node]));
    let changed = false;
    const nodes = documentNodes.map(node => {
        if (!isMagicCircleNode(node)) return node;

        const flowNode = flowById.get(node.id);
        if (
            !flowNode ||
            !isMagicCircleNode(flowNode) ||
            (
                node.position.x === flowNode.position.x &&
                node.position.y === flowNode.position.y
            )
        ) {
            return node;
        }

        changed = true;
        return {
            ...node,
            position: { ...flowNode.position },
        };
    });

    return { nodes, changed };
}

function mergeAcceptedNodeView(
    documentNode: MagicGraphDocumentNode,
    incoming: MagicEditorNode
): MagicEditorNode {
    // Flow setter는 실시간 geometry와 view 상태만 반영한다.
    // data·부모·시퀀스 같은 의미 필드는 항상 document 값을 유지한다.
    return {
        ...documentNode,
        position: { ...incoming.position },
        width: incoming.width,
        height: incoming.height,
        selected: Boolean(incoming.selected),
        dragging: incoming.dragging,
        measured: incoming.measured
            ? { ...incoming.measured }
            : undefined,
        zIndex: incoming.zIndex,
    } as MagicEditorNode;
}

function mergeProjectedNodeView(
    documentNode: MagicGraphDocumentNode,
    previous: MagicEditorNode | undefined
): MagicEditorNode {
    // 드래그 중 위치만 잠시 보존하며 drag stop에서 document로 승격한다.
    return {
        ...documentNode,
        position: previous?.dragging
            ? { ...previous.position }
            : { ...documentNode.position },
        selected: Boolean(previous?.selected),
        dragging: previous?.dragging,
        measured: previous?.measured
            ? { ...previous.measured }
            : undefined,
        zIndex: previous?.zIndex,
    } as MagicEditorNode;
}
