import type { Connection, Edge } from '@xyflow/svelte';
import type { MagicEditorNode } from '../../../types/magic';
import {
    isConnectionValid,
    type MagicTypeLookup,
} from './graphRules';
import {
    createEdgeUpdate,
    filterEdgesForDeletedNodes,
    normalizeEdgeHandles,
    refreshNodeRoles,
} from './graphActions';
import { ensureSystemMagicNodes, isSystemMagicNode } from './systemMagicNodes';
import {
    GRAPH_PERFORMANCE_OPERATION_IDS,
    measureGraphOperation,
} from '../diagnostics/graphPerformance';
import {
    getMagicCircleNodes,
    getMagicUnitNodes,
    isMagicCircleNode,
    syncMagicCirclePortCounts,
} from './magicCircleGraph';
import {
    createExplicitMagicCircleEdgeUpdate,
    isExplicitMagicCircleConnectionValid,
} from './magicCircleConnectionRules';
import { collectMagicControlPairDeletionIds } from './magicControlPairs';

export interface GraphSnapshot {
    nodes: MagicEditorNode[];
    edges: Edge[];
}

export interface GraphTopologyUpdate extends GraphSnapshot {
    changed: boolean;
}

export interface GraphEdgePreparation {
    edge: Edge;
    edges: Edge[];
}

export function isGraphConnectionValid(
    connection: Connection,
    snapshot: GraphSnapshot,
    magicTypes: MagicTypeLookup
): boolean {
    return getMagicCircleNodes(snapshot.nodes).length > 0
        ? isExplicitMagicCircleConnectionValid(
            connection,
            snapshot.edges,
            snapshot.nodes,
            magicTypes
        )
        : isConnectionValid(
            connection,
            snapshot.edges,
            getMagicUnitNodes(snapshot.nodes),
            magicTypes
        );
}

export function prepareGraphEdge(
    connection: Connection,
    snapshot: GraphSnapshot,
    magicTypes: MagicTypeLookup
): GraphEdgePreparation | false {
    if (getMagicCircleNodes(snapshot.nodes).length > 0) {
        return createExplicitMagicCircleEdgeUpdate(
            connection,
            snapshot.edges,
            snapshot.nodes,
            magicTypes
        );
    }

    return createEdgeUpdate(
        connection,
        snapshot.edges,
        getMagicUnitNodes(snapshot.nodes),
        magicTypes
    );
}

export function removeDeletedGraphElements(
    snapshot: GraphSnapshot,
    deletedNodes: MagicEditorNode[],
    deletedEdges: Edge[]
): GraphSnapshot {
    let { nodes, edges } = snapshot;
    const shouldMaintainSystemNodes = hasSystemNodes(snapshot.nodes) || deletedNodes.some(isSystemMagicNode);

    if (deletedNodes.length) {
        const deletedCircleIds = new Set(
            deletedNodes.filter(isMagicCircleNode).map(node => node.id)
        );
        const deletionReferenceNodes = [
            ...nodes,
            ...deletedNodes.filter(deletedNode =>
                !nodes.some(node => node.id === deletedNode.id)
            ),
        ];
        const explicitlyDeletedIds = collectMagicControlPairDeletionIds(
            deletionReferenceNodes,
            new Set(deletedNodes.map(node => node.id))
        );
        const ids = new Set(
            nodes
                .filter(node => {
                    if (deletedCircleIds.has(node.parentId ?? '')) return true;
                    return explicitlyDeletedIds.has(node.id) &&
                        !isSystemMagicNode(node);
                })
                .map(node => node.id)
        );
        nodes = nodes.filter(node => !ids.has(node.id));
        edges = filterEdgesForDeletedNodes(ids, edges);
    }

    if (deletedEdges.length) {
        const ids = new Set(deletedEdges.map(edge => edge.id));
        edges = edges.filter(edge => !ids.has(edge.id));
    }

    return {
        nodes: shouldMaintainSystemNodes ? ensureSystemMagicNodes(nodes) : nodes,
        edges,
    };
}

export function syncGraphTopology(
    snapshot: GraphSnapshot,
    magicTypes: MagicTypeLookup
): GraphTopologyUpdate {
    return measureGraphOperation(
        GRAPH_PERFORMANCE_OPERATION_IDS.SYNC_GRAPH_TOPOLOGY,
        {
            nodeCount: snapshot.nodes.length,
            edgeCount: snapshot.edges.length,
        },
        () => syncGraphTopologyNow(snapshot, magicTypes)
    );
}

function syncGraphTopologyNow(
    snapshot: GraphSnapshot,
    magicTypes: MagicTypeLookup
): GraphTopologyUpdate {
    const nodes = hasSystemNodes(snapshot.nodes)
        ? ensureSystemMagicNodes(snapshot.nodes)
        : snapshot.nodes;
    const edges = normalizeEdgeHandles(snapshot.edges, nodes);
    const circlePortUpdate = syncMagicCirclePortCounts(nodes, edges);
    const nodeRoles = refreshNodeRoles(
        getMagicUnitNodes(circlePortUpdate.nodes),
        edges,
        magicTypes
    );
    const updatedUnitNodeById = new Map(
        nodeRoles.nodes.map(node => [node.id, node])
    );
    const updatedNodes = circlePortUpdate.nodes.map(node =>
        updatedUnitNodeById.get(node.id) ?? node
    );
    const changed = snapshot.nodes.length !== nodes.length ||
        !areEdgesEquivalent(snapshot.edges, edges) ||
        circlePortUpdate.changed ||
        nodeRoles.changed;

    return {
        nodes: updatedNodes,
        edges,
        changed,
    };
}

function hasSystemNodes(nodes: MagicEditorNode[]): boolean {
    return nodes.some(isSystemMagicNode);
}

function areEdgesEquivalent(a: Edge[], b: Edge[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((edge, index) => {
        const other = b[index];
        return Boolean(other) &&
            edge.id === other.id &&
            edge.source === other.source &&
            edge.target === other.target &&
            edge.sourceHandle === other.sourceHandle &&
            edge.targetHandle === other.targetHandle;
    });
}
