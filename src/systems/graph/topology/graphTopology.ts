import type { Edge } from '@xyflow/svelte';
import type { MagicGraphNode } from '../../../types/magic';

export interface GraphTopology {
    nodeMap: ReadonlyMap<string, MagicGraphNode>;
    outEdges: ReadonlyMap<string, readonly string[]>;
    inDegree: ReadonlyMap<string, number>;
    edges: readonly Edge[];
    nodes: readonly MagicGraphNode[];
    rootIds: readonly string[];
}

export function buildOutEdgeMap(edges: readonly Edge[]): Map<string, string[]> {
    const outEdges = new Map<string, string[]>();

    edges.forEach(edge => {
        if (!outEdges.has(edge.source)) outEdges.set(edge.source, []);
        outEdges.get(edge.source)!.push(edge.target);
    });

    return outEdges;
}

export function buildGraphTopology(
    nodes: readonly MagicGraphNode[],
    edges: readonly Edge[]
): GraphTopology {
    const nodeMap = new Map<string, MagicGraphNode>();
    const outEdges = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const validEdges: Edge[] = [];

    nodes.forEach(node => {
        nodeMap.set(node.id, node);
        outEdges.set(node.id, []);
        inDegree.set(node.id, 0);
    });

    edges.forEach(edge => {
        if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) return;

        validEdges.push(edge);
        outEdges.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    });

    return {
        nodeMap,
        outEdges,
        inDegree,
        edges: validEdges,
        nodes,
        rootIds: nodes
            .filter(node => (inDegree.get(node.id) ?? 0) === 0)
            .map(node => node.id),
    };
}
