import {
    GRAPH_EDGE_TYPES,
    MAGIC_EDGE_ID_PREFIX,
} from '../../../constants/graphConfigs';
import {
    type MagicEditorNode,
} from '../magicGraphTypes';
import type {
    MagicGraphConnection,
    MagicGraphEdge,
} from '../magicGraphTypes';
import {
    type IdFactory,
} from './graphActions';
import { createMagicGraphIdSegment } from './magicGraphIds';
import {
    analyzeMagicCircleFlowTopology,
} from './magicCircleFlowTopology';
import {
    getMagicCircleNodes,
    isMagicCirclePortHandleId,
    isMagicCircleNode,
} from './magicCircleGraph';

function isExactDuplicate(
    connection: MagicGraphConnection,
    edges: readonly MagicGraphEdge[]
): boolean {
    return edges.some(edge =>
        edge.source === connection.source &&
        edge.target === connection.target &&
        edge.sourceHandle === connection.sourceHandle &&
        edge.targetHandle === connection.targetHandle
    );
}

export function isExplicitMagicCircleExternalConnection(
    connection: MagicGraphConnection,
    nodes: readonly MagicEditorNode[]
): boolean {
    const sourceHandle = connection.sourceHandle;
    const targetHandle = connection.targetHandle;
    const circleIds = new Set(getMagicCircleNodes(nodes).map(circle => circle.id));
    const sourceIsCircle = Boolean(connection.source && circleIds.has(connection.source));
    const targetIsCircle = Boolean(connection.target && circleIds.has(connection.target));

    return (
        sourceIsCircle &&
        isMagicCirclePortHandleId(sourceHandle, 'output') &&
        targetIsCircle &&
        isMagicCirclePortHandleId(targetHandle, 'input')
    );
}

function wouldCreateExternalCircleCycle(
    connection: MagicGraphConnection,
    edges: readonly MagicGraphEdge[],
    nodes: readonly MagicEditorNode[]
): boolean {
    if (
        !connection.source ||
        !connection.target ||
        !isMagicCirclePortHandleId(connection.sourceHandle, 'output') ||
        !isMagicCirclePortHandleId(connection.targetHandle, 'input')
    ) {
        return false;
    }

    const circleIds = getMagicCircleNodes(nodes).map(circle =>
        circle.id
    );
    const circleIdSet = new Set(circleIds);
    if (
        !circleIdSet.has(connection.source) ||
        !circleIdSet.has(connection.target)
    ) {
        return false;
    }

    const externalEdges = edges.filter(edge =>
        circleIdSet.has(edge.source) &&
        circleIdSet.has(edge.target) &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        isMagicCirclePortHandleId(edge.targetHandle, 'input')
    );

    return analyzeMagicCircleFlowTopology(
        circleIds,
        [
            ...externalEdges,
            {
                source: connection.source,
                target: connection.target,
            },
        ]
    ).hasCycle;
}

export function filterExplicitEdgesReplacedByConnection(
    connection: MagicGraphConnection,
    edges: readonly MagicGraphEdge[],
    nodes: readonly MagicEditorNode[]
): MagicGraphEdge[] {
    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const sourceNode = connection.source
        ? nodeById.get(connection.source)
        : undefined;
    const targetNode = connection.target
        ? nodeById.get(connection.target)
        : undefined;
    const targetHandle = connection.targetHandle;

    return edges.filter(edge => {
        const replacesSourceHandle =
            sourceNode &&
            isMagicCircleNode(sourceNode) &&
            edge.source === connection.source;
        const replacesTargetHandle =
            targetNode &&
            isMagicCircleNode(targetNode) &&
            edge.target === connection.target &&
            edge.targetHandle === targetHandle;

        return !replacesSourceHandle && !replacesTargetHandle;
    });
}

export function isExplicitMagicCircleConnectionValid(
    connection: MagicGraphConnection,
    edges: MagicGraphEdge[],
    nodes: MagicEditorNode[]
): boolean {
    const { source, target } = connection;
    if (!source || !target) return false;

    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const sourceNode = nodeById.get(source);
    const targetNode = nodeById.get(target);
    if (!sourceNode || !targetNode) return false;

    const validationEdges = filterExplicitEdgesReplacedByConnection(
        connection,
        edges,
        nodes
    );
    if (isExactDuplicate(connection, validationEdges)) return false;

    if (isExplicitMagicCircleExternalConnection(
        connection,
        nodes
    )) {
        return !wouldCreateExternalCircleCycle(connection, validationEdges, nodes);
    }

    return false;
}

export function createExplicitMagicCircleEdgeUpdate(
    connection: MagicGraphConnection,
    edges: MagicGraphEdge[],
    nodes: MagicEditorNode[],
    createId: IdFactory = createMagicGraphIdSegment
): { edge: MagicGraphEdge; edges: MagicGraphEdge[] } | false {
    if (!isExplicitMagicCircleConnectionValid(connection, edges, nodes)) {
        return false;
    }

    const nextEdges = filterExplicitEdgesReplacedByConnection(connection, edges, nodes);
    return {
        edge: {
            id: `${MAGIC_EDGE_ID_PREFIX}-${createId()}`,
            source: connection.source!,
            target: connection.target!,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            type: GRAPH_EDGE_TYPES.MAGIC_EDGE,
        },
        edges: nextEdges,
    };
}
