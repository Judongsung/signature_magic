export interface MagicCircleFlowEdge {
    source: string;
    target: string;
}

export interface MagicCircleFlowTopology {
    orderedCircleIds: string[];
    incomingByCircleId: ReadonlyMap<string, readonly MagicCircleFlowEdge[]>;
    outgoingByCircleId: ReadonlyMap<string, readonly MagicCircleFlowEdge[]>;
    terminalCircleIds: string[];
    hasUnknownEndpoint: boolean;
    hasMultipleOutputs: boolean;
    hasCycle: boolean;
}

export function analyzeMagicCircleFlowTopology(
    circleIds: readonly string[],
    edges: readonly MagicCircleFlowEdge[]
): MagicCircleFlowTopology {
    const circleIdSet = new Set(circleIds);
    const incomingByCircleId = new Map(
        circleIds.map(circleId => [
            circleId,
            [] as MagicCircleFlowEdge[],
        ])
    );
    const outgoingByCircleId = new Map(
        circleIds.map(circleId => [
            circleId,
            [] as MagicCircleFlowEdge[],
        ])
    );
    let hasUnknownEndpoint = false;

    edges.forEach(edge => {
        if (
            !circleIdSet.has(edge.source) ||
            !circleIdSet.has(edge.target)
        ) {
            hasUnknownEndpoint = true;
            return;
        }

        outgoingByCircleId.get(edge.source)!.push(edge);
        incomingByCircleId.get(edge.target)!.push(edge);
    });

    const indegreeByCircleId = new Map(
        circleIds.map(circleId => [
            circleId,
            incomingByCircleId.get(circleId)!.length,
        ])
    );
    const queue = circleIds.filter(circleId =>
        indegreeByCircleId.get(circleId) === 0
    );
    const orderedCircleIds: string[] = [];

    for (let index = 0; index < queue.length; index += 1) {
        const circleId = queue[index];
        orderedCircleIds.push(circleId);

        outgoingByCircleId.get(circleId)!.forEach(edge => {
            const nextIndegree =
                indegreeByCircleId.get(edge.target)! - 1;
            indegreeByCircleId.set(edge.target, nextIndegree);
            if (nextIndegree === 0) queue.push(edge.target);
        });
    }

    return {
        orderedCircleIds,
        incomingByCircleId,
        outgoingByCircleId,
        terminalCircleIds: circleIds.filter(circleId =>
            outgoingByCircleId.get(circleId)!.length === 0
        ),
        hasUnknownEndpoint,
        hasMultipleOutputs: circleIds.some(circleId =>
            outgoingByCircleId.get(circleId)!.length > 1
        ),
        hasCycle: orderedCircleIds.length !== circleIds.length,
    };
}
