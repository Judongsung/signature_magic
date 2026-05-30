import type { Connection, Edge } from '@xyflow/svelte';
import type { MagicNode, MagicTypeConfig } from '../../types/magic';
import {
    createEdgeUpdate,
    filterEdgesForDeletedNodes,
    normalizeEdgeHandles,
    refreshNodeRoles,
} from './graphActions';

export interface GraphSnapshot {
    nodes: MagicNode[];
    edges: Edge[];
}

export interface GraphTopologyUpdate extends GraphSnapshot {
    changed: boolean;
}

export interface GraphEdgePreparation {
    edge: Edge;
    edges: Edge[];
}

export function prepareGraphEdge(
    connection: Connection,
    snapshot: GraphSnapshot,
    magicTypes: readonly MagicTypeConfig[]
): GraphEdgePreparation | false {
    return createEdgeUpdate(connection, snapshot.edges, snapshot.nodes, magicTypes);
}

export function removeDeletedGraphElements(
    snapshot: GraphSnapshot,
    deletedNodes: MagicNode[],
    deletedEdges: Edge[]
): GraphSnapshot {
    let { nodes, edges } = snapshot;

    if (deletedNodes.length) {
        const ids = new Set(deletedNodes.map(node => node.id));
        nodes = nodes.filter(node => !ids.has(node.id));
        edges = filterEdgesForDeletedNodes(ids, edges);
    }

    if (deletedEdges.length) {
        const ids = new Set(deletedEdges.map(edge => edge.id));
        edges = edges.filter(edge => !ids.has(edge.id));
    }

    return { nodes, edges };
}

export function syncGraphTopology(
    snapshot: GraphSnapshot,
    magicTypes: readonly MagicTypeConfig[]
): GraphTopologyUpdate {
    const edges = normalizeEdgeHandles(snapshot.edges);
    const nodeRoles = refreshNodeRoles(snapshot.nodes, edges, magicTypes);
    const changed = !areEdgesEquivalent(snapshot.edges, edges) || nodeRoles.changed;

    return {
        nodes: nodeRoles.nodes,
        edges,
        changed,
    };
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
