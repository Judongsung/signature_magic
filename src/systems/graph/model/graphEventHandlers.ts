import type { Connection, Edge } from '@xyflow/svelte';
import type { MagicNode } from '../../../types/magic';
import type { MagicTypeLookup } from './graphRules';
import {
    createEdgeUpdate,
    filterEdgesForDeletedNodes,
    normalizeEdgeHandles,
    refreshNodeRoles,
} from './graphActions';
import { ensureSystemMagicNodes, isSystemMagicNode } from './systemMagicNodes';

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
    magicTypes: MagicTypeLookup
): GraphEdgePreparation | false {
    return createEdgeUpdate(connection, snapshot.edges, snapshot.nodes, magicTypes);
}

export function removeDeletedGraphElements(
    snapshot: GraphSnapshot,
    deletedNodes: MagicNode[],
    deletedEdges: Edge[]
): GraphSnapshot {
    let { nodes, edges } = snapshot;
    const shouldMaintainSystemNodes = hasSystemNodes(snapshot.nodes) || deletedNodes.some(isSystemMagicNode);

    if (deletedNodes.length) {
        const ids = new Set(deletedNodes.filter(node => !isSystemMagicNode(node)).map(node => node.id));
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
    const nodes = hasSystemNodes(snapshot.nodes)
        ? ensureSystemMagicNodes(snapshot.nodes)
        : snapshot.nodes;
    const edges = normalizeEdgeHandles(snapshot.edges);
    const nodeRoles = refreshNodeRoles(nodes, edges, magicTypes);
    const changed = snapshot.nodes.length !== nodes.length ||
        !areEdgesEquivalent(snapshot.edges, edges) ||
        nodeRoles.changed;

    return {
        nodes: nodeRoles.nodes,
        edges,
        changed,
    };
}

function hasSystemNodes(nodes: MagicNode[]): boolean {
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
