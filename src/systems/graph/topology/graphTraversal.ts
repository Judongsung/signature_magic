interface ReachableGraph {
    outEdges: ReadonlyMap<string, readonly string[]>;
}

export function canReach(
    graph: ReachableGraph,
    from: string,
    to: string,
    visited = new Set<string>()
): boolean {
    if (from === to) return true;
    if (visited.has(from)) return false;

    visited.add(from);
    return (graph.outEdges.get(from) ?? []).some(neighbor => canReach(graph, neighbor, to, visited));
}

export function reachableNodeIds(
    graph: ReachableGraph,
    startNodeIds: readonly string[]
): Set<string> {
    const reachable = new Set<string>();
    const queue = [...startNodeIds];

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (reachable.has(nodeId)) continue;

        reachable.add(nodeId);
        (graph.outEdges.get(nodeId) ?? []).forEach(nextId => {
            queue.push(nextId);
        });
    }

    return reachable;
}

export function reachableDistances(
    graph: ReachableGraph,
    startNodeId: string
): Map<string, number> {
    const distances = new Map<string, number>();
    const queue = [{ nodeId: startNodeId, distance: 0 }];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (distances.has(current.nodeId)) continue;

        distances.set(current.nodeId, current.distance);
        (graph.outEdges.get(current.nodeId) ?? []).forEach(nextId => {
            queue.push({ nodeId: nextId, distance: current.distance + 1 });
        });
    }

    return distances;
}

export function findNearestCommonReachableNode(
    graph: ReachableGraph,
    startNodeIds: readonly string[]
): string | undefined {
    const distanceMaps = startNodeIds.map(startNodeId => reachableDistances(graph, startNodeId));
    if (distanceMaps.length === 0) return undefined;

    const [first, ...rest] = distanceMaps;
    const commonNodeIds = [...first.keys()].filter(nodeId => rest.every(distances => distances.has(nodeId)));

    return commonNodeIds
        .map(nodeId => ({
            nodeId,
            maxDistance: Math.max(...distanceMaps.map(distances => distances.get(nodeId) ?? Number.POSITIVE_INFINITY)),
            totalDistance: distanceMaps.reduce((total, distances) => total + (distances.get(nodeId) ?? 0), 0),
        }))
        .sort((a, b) => a.maxDistance - b.maxDistance || a.totalDistance - b.totalDistance)[0]?.nodeId;
}
