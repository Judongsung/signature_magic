interface ReachableGraph {
    outEdges: ReadonlyMap<string, readonly string[]>;
}

export interface ReachabilityCache {
    distancesByStart: Map<string, Map<string, number>>;
    nearestCommonNodeByStarts: Map<string, string | undefined>;
}

const REACHABILITY_CACHE_KEY_SEPARATOR = '|';

export function createReachabilityCache(): ReachabilityCache {
    return {
        distancesByStart: new Map(),
        nearestCommonNodeByStarts: new Map(),
    };
}

export function canReach(
    graph: ReachableGraph,
    from: string,
    to: string,
    visited = new Set<string>(),
    cache?: ReachabilityCache
): boolean {
    if (from === to) return true;
    if (cache && visited.size === 0) return reachableDistances(graph, from, cache).has(to);
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

    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
        const nodeId = queue[queueIndex];
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
    startNodeId: string,
    cache?: ReachabilityCache
): Map<string, number> {
    const cached = cache?.distancesByStart.get(startNodeId);
    if (cached) return cached;

    const distances = new Map<string, number>();
    const queue = [{ nodeId: startNodeId, distance: 0 }];

    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
        const current = queue[queueIndex];
        if (distances.has(current.nodeId)) continue;

        distances.set(current.nodeId, current.distance);
        (graph.outEdges.get(current.nodeId) ?? []).forEach(nextId => {
            queue.push({ nodeId: nextId, distance: current.distance + 1 });
        });
    }

    cache?.distancesByStart.set(startNodeId, distances);
    return distances;
}

export function findNearestCommonReachableNode(
    graph: ReachableGraph,
    startNodeIds: readonly string[],
    cache?: ReachabilityCache
): string | undefined {
    const cacheKey = createNearestCommonCacheKey(startNodeIds);
    if (cache?.nearestCommonNodeByStarts.has(cacheKey)) {
        return cache.nearestCommonNodeByStarts.get(cacheKey);
    }

    const distanceMaps = startNodeIds.map(startNodeId => reachableDistances(graph, startNodeId, cache));
    if (distanceMaps.length === 0) return undefined;

    const [first, ...rest] = distanceMaps;
    const commonNodeIds = [...first.keys()].filter(nodeId => rest.every(distances => distances.has(nodeId)));

    const nearestCommonNodeId = commonNodeIds
        .map(nodeId => ({
            nodeId,
            maxDistance: Math.max(...distanceMaps.map(distances => distances.get(nodeId) ?? Number.POSITIVE_INFINITY)),
            totalDistance: distanceMaps.reduce((total, distances) => total + (distances.get(nodeId) ?? 0), 0),
        }))
        .sort((a, b) => a.maxDistance - b.maxDistance || a.totalDistance - b.totalDistance)[0]?.nodeId;

    cache?.nearestCommonNodeByStarts.set(cacheKey, nearestCommonNodeId);
    return nearestCommonNodeId;
}

function createNearestCommonCacheKey(startNodeIds: readonly string[]): string {
    return [...startNodeIds].sort().join(REACHABILITY_CACHE_KEY_SEPARATOR);
}
