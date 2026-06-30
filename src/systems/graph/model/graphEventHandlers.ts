import type { Connection, Edge } from '@xyflow/svelte';
import type { MagicEditorNode } from '../../../types/magic';
import { filterEdgesForDeletedNodes } from './graphActions';
import {
    GRAPH_PERFORMANCE_OPERATION_IDS,
    measureGraphOperation,
} from '../diagnostics/graphPerformance';
import {
    isMagicCircleNode,
    normalizeMagicCirclePortHandles,
    syncMagicCirclePortCounts,
} from './magicCircleGraph';
import {
    createExplicitMagicCircleEdgeUpdate,
    isExplicitMagicCircleConnectionValid,
} from './magicCircleConnectionRules';
import { collectMagicControlPairDeletionIds } from './magicControlPairs';
import { isCircleSystemMagicNode } from './circleSystemMagicNodes';

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
    snapshot: GraphSnapshot
): boolean {
    return isExplicitMagicCircleConnectionValid(
        connection,
        snapshot.edges,
        snapshot.nodes
    );
}

export function prepareGraphEdge(
    connection: Connection,
    snapshot: GraphSnapshot
): GraphEdgePreparation | false {
    return createExplicitMagicCircleEdgeUpdate(
        connection,
        snapshot.edges,
        snapshot.nodes
    );
}

export function removeDeletedGraphElements(
    snapshot: GraphSnapshot,
    deletedNodes: MagicEditorNode[],
    deletedEdges: Edge[]
): GraphSnapshot {
    let { nodes, edges } = snapshot;

    if (deletedNodes.length) {
        const deletedCircleIds = new Set(
            deletedNodes.filter(isMagicCircleNode).map(node => node.id)
        );
        const protectedCircleSystemNodes = deletedNodes.filter(node =>
            isCircleSystemMagicNode(node) &&
            !deletedCircleIds.has(node.parentId ?? '') &&
            !nodes.some(candidate => candidate.id === node.id) &&
            nodes.some(candidate =>
                isMagicCircleNode(candidate) &&
                candidate.id === node.parentId
            )
        );
        if (protectedCircleSystemNodes.length > 0) {
            nodes = [...nodes, ...protectedCircleSystemNodes];
        }
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
                        !isCircleSystemMagicNode(node);
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
        nodes,
        edges,
    };
}

export function syncGraphTopology(
    snapshot: GraphSnapshot
): GraphTopologyUpdate {
    return measureGraphOperation(
        GRAPH_PERFORMANCE_OPERATION_IDS.SYNC_GRAPH_TOPOLOGY,
        {
            nodeCount: snapshot.nodes.length,
            edgeCount: snapshot.edges.length,
        },
        () => syncGraphTopologyNow(snapshot)
    );
}

function syncGraphTopologyNow(
    snapshot: GraphSnapshot
): GraphTopologyUpdate {
    const edges = normalizeMagicCirclePortHandles(
        snapshot.edges,
        snapshot.nodes
    );
    const circlePortUpdate = syncMagicCirclePortCounts(
        snapshot.nodes,
        edges
    );
    const changed = !areEdgesEquivalent(snapshot.edges, edges) ||
        circlePortUpdate.changed;

    return {
        nodes: circlePortUpdate.nodes,
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
