import type { Connection, Edge } from '@xyflow/svelte';
import {
    GRAPH_EDGE_TYPES,
    MAGIC_EDGE_ID_PREFIX,
} from '../../../constants/graphConfigs';
import type { MagicEditorNode } from '../../../types/magic';
import { buildOutEdgeMap } from '../topology/graphTopology';
import { canReach } from '../topology/graphTraversal';
import {
    createUniqueId,
    type IdFactory,
} from './graphActions';
import {
    type MagicTypeLookup,
} from './graphRules';
import {
    getMagicCircleNodes,
    isMagicCirclePortHandleId,
    isMagicCircleNode,
} from './magicCircleGraph';

function isExactDuplicate(connection: Connection, edges: readonly Edge[]): boolean {
    return edges.some(edge =>
        edge.source === connection.source &&
        edge.target === connection.target &&
        edge.sourceHandle === connection.sourceHandle &&
        edge.targetHandle === connection.targetHandle
    );
}

export function isExplicitMagicCircleExternalConnection(
    connection: Connection,
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
    connection: Connection,
    edges: readonly Edge[],
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

    const circleIds = new Set(getMagicCircleNodes(nodes).map(circle => circle.id));
    if (!circleIds.has(connection.source) || !circleIds.has(connection.target)) {
        return false;
    }

    const externalEdges = edges.filter(edge =>
        circleIds.has(edge.source) &&
        circleIds.has(edge.target) &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        isMagicCirclePortHandleId(edge.targetHandle, 'input')
    );

    return canReach(
        { outEdges: buildOutEdgeMap(externalEdges) },
        connection.target,
        connection.source
    );
}

export function filterExplicitEdgesReplacedByConnection(
    connection: Connection,
    edges: readonly Edge[],
    nodes: readonly MagicEditorNode[]
): Edge[] {
    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const sourceNode = connection.source
        ? nodeById.get(connection.source)
        : undefined;
    const targetNode = connection.target
        ? nodeById.get(connection.target)
        : undefined;
    const sourceHandle = connection.sourceHandle;
    const targetHandle = connection.targetHandle;

    return edges.filter(edge => {
        const replacesSourceHandle =
            sourceNode &&
            isMagicCircleNode(sourceNode) &&
            edge.source === connection.source &&
            edge.sourceHandle === sourceHandle;
        const replacesTargetHandle =
            targetNode &&
            isMagicCircleNode(targetNode) &&
            edge.target === connection.target &&
            edge.targetHandle === targetHandle;

        return !replacesSourceHandle && !replacesTargetHandle;
    });
}

export function isExplicitMagicCircleConnectionValid(
    connection: Connection,
    edges: Edge[],
    nodes: MagicEditorNode[],
    _magicTypes: MagicTypeLookup
): boolean {
    const { source, target } = connection;
    if (!source || !target) return false;

    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const sourceNode = nodeById.get(source);
    const targetNode = nodeById.get(target);
    if (!sourceNode || !targetNode) return false;

    const sourceHandle = connection.sourceHandle;
    const targetHandle = connection.targetHandle;
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
    connection: Connection,
    edges: Edge[],
    nodes: MagicEditorNode[],
    magicTypes: MagicTypeLookup,
    createId: IdFactory = createUniqueId
): { edge: Edge; edges: Edge[] } | false {
    if (!isExplicitMagicCircleConnectionValid(connection, edges, nodes, magicTypes)) {
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
