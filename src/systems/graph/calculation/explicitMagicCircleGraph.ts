import type { Edge } from '@xyflow/svelte';
import {
    MAGIC_EDGE_ID_PREFIX,
} from '../../../constants/graphConfigs';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import type {
    MagicCircleNode,
    MagicCircleState,
    MagicEditorNode,
    MagicNode,
} from '../../../types/magic';
import {
    getCircleChildNodes,
    getMagicCircleNodes,
    isMagicCirclePortHandleId,
} from '../model/magicCircleGraph';

const VIRTUAL_ANCHOR_MAGIC_TYPE = '__circle-anchor__';
const VIRTUAL_START_SUFFIX = 'start';
const VIRTUAL_END_SUFFIX = 'end';

export interface CircleInternalAnalysis {
    circle: MagicCircleNode;
    sequenceNodes: MagicNode[];
    projectedNodes: MagicNode[];
    projectedEdges: Edge[];
    isInternallyValid: boolean;
}

export interface ExplicitMagicCircleGraphAnalysis {
    circles: MagicCircleNode[];
    states: MagicCircleState[];
    internalByCircleId: ReadonlyMap<string, CircleInternalAnalysis>;
    projectedNodes: MagicNode[];
    projectedEdges: Edge[];
    orderedOutputCircleIds: string[];
}

function startAnchorId(circleId: string): string {
    return `${circleId}:${VIRTUAL_START_SUFFIX}`;
}

function endAnchorId(circleId: string): string {
    return `${circleId}:${VIRTUAL_END_SUFFIX}`;
}

function createVirtualAnchor(id: string): MagicNode {
    return {
        id,
        position: { x: 0, y: 0 },
        data: {
            magicType: VIRTUAL_ANCHOR_MAGIC_TYPE,
            excludeFromStatScaling: true,
        },
    };
}

function addAdjacency(
    outEdges: Map<string, string[]>,
    inEdges: Map<string, string[]>,
    source: string,
    target: string
): void {
    const targets = outEdges.get(source) ?? [];
    targets.push(target);
    outEdges.set(source, targets);

    const sources = inEdges.get(target) ?? [];
    sources.push(source);
    inEdges.set(target, sources);
}

function collectReachable(
    adjacency: ReadonlyMap<string, readonly string[]>,
    starts: readonly string[]
): Set<string> {
    const reachable = new Set<string>();
    const queue = [...starts];

    for (let index = 0; index < queue.length; index += 1) {
        const nodeId = queue[index];
        if (reachable.has(nodeId)) continue;

        reachable.add(nodeId);
        (adjacency.get(nodeId) ?? []).forEach(nextId => queue.push(nextId));
    }

    return reachable;
}

function analyzeCircleInternals(
    circle: MagicCircleNode,
    nodes: readonly MagicEditorNode[]
): CircleInternalAnalysis {
    const childNodes = getCircleChildNodes(nodes, circle.id);
    const startId = startAnchorId(circle.id);
    const endId = endAnchorId(circle.id);
    const sequenceIds = [
        startId,
        ...childNodes.map(node => node.id),
        endId,
    ];
    const projectedEdges = childNodes.length === 0
        ? []
        : sequenceIds.slice(0, -1).map((source, index) => ({
            id: `${MAGIC_EDGE_ID_PREFIX}-${circle.id}-sequence-${index}`,
            source,
            target: sequenceIds[index + 1],
        }));

    return {
        circle,
        sequenceNodes: childNodes,
        projectedNodes: [
            createVirtualAnchor(startId),
            ...childNodes,
            createVirtualAnchor(endId),
        ],
        projectedEdges,
        isInternallyValid: childNodes.length > 0,
    };
}

function externalEdgeEndpoints(
    edge: Edge,
    circleById: ReadonlyMap<string, MagicCircleNode>
): { source: string; target: string } | undefined {
    const sourceCircle = circleById.get(edge.source);
    const targetCircle = circleById.get(edge.target);
    const isSourceSystem = edge.source === SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id;
    const isTargetSystem = edge.target === SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id;

    if (
        isSourceSystem &&
        targetCircle &&
        isMagicCirclePortHandleId(edge.targetHandle, 'input')
    ) {
        return { source: edge.source, target: targetCircle.id };
    }
    if (
        sourceCircle &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        targetCircle &&
        isMagicCirclePortHandleId(edge.targetHandle, 'input')
    ) {
        return { source: sourceCircle.id, target: targetCircle.id };
    }
    if (
        sourceCircle &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        isTargetSystem
    ) {
        return { source: sourceCircle.id, target: edge.target };
    }

    return undefined;
}

function resolveCircleOrder(
    circles: readonly MagicCircleNode[],
    outputPathCircleIds: ReadonlySet<string>,
    externalOutEdges: ReadonlyMap<string, readonly string[]>
): string[] {
    const relevantIds = new Set([
        SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
        SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
        ...outputPathCircleIds,
    ]);
    const indegreeById = new Map(
        [...relevantIds].map(nodeId => [nodeId, 0])
    );
    externalOutEdges.forEach((targetIds, sourceId) => {
        if (!relevantIds.has(sourceId)) return;
        targetIds.forEach(targetId => {
            if (!relevantIds.has(targetId)) return;
            indegreeById.set(targetId, (indegreeById.get(targetId) ?? 0) + 1);
        });
    });
    const levelById = new Map<string, number>([
        [SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id, 0],
    ]);
    const queue = [...indegreeById]
        .filter(([, indegree]) => indegree === 0)
        .map(([nodeId]) => nodeId);

    for (let index = 0; index < queue.length; index += 1) {
        const sourceId = queue[index];
        const nextLevel = (levelById.get(sourceId) ?? 0) + 1;
        (externalOutEdges.get(sourceId) ?? []).forEach(targetId => {
            if (!relevantIds.has(targetId)) return;

            levelById.set(
                targetId,
                Math.max(levelById.get(targetId) ?? 0, nextLevel)
            );
            const indegree = (indegreeById.get(targetId) ?? 0) - 1;
            indegreeById.set(targetId, indegree);
            if (indegree === 0) queue.push(targetId);
        });
    }

    return [...circles]
        .sort((left, right) => {
            const leftOnPath = outputPathCircleIds.has(left.id);
            const rightOnPath = outputPathCircleIds.has(right.id);
            if (leftOnPath !== rightOnPath) return leftOnPath ? -1 : 1;
            if (leftOnPath && rightOnPath) {
                const levelDifference =
                    (levelById.get(left.id) ?? Number.POSITIVE_INFINITY) -
                    (levelById.get(right.id) ?? Number.POSITIVE_INFINITY);
                if (levelDifference) return levelDifference;
                return left.position.x - right.position.x;
            }

            return left.position.y - right.position.y ||
                left.position.x - right.position.x;
        })
        .map(circle => circle.id);
}

export function analyzeExplicitMagicCircleGraph(
    nodes: readonly MagicEditorNode[],
    edges: readonly Edge[]
): ExplicitMagicCircleGraphAnalysis {
    const circles = getMagicCircleNodes(nodes);
    const circleById = new Map(circles.map(circle => [circle.id, circle]));
    const internalByCircleId = new Map(circles.map(circle => [
        circle.id,
        analyzeCircleInternals(circle, nodes),
    ]));
    const externalOutEdges = new Map<string, string[]>();
    const externalInEdges = new Map<string, string[]>();
    const externalEdges: Array<Edge & { source: string; target: string }> = [];

    edges.forEach(edge => {
        const endpoints = externalEdgeEndpoints(edge, circleById);
        if (!endpoints) return;
        const sourceIsValid = !circleById.has(endpoints.source) ||
            internalByCircleId.get(endpoints.source)?.isInternallyValid;
        const targetIsValid = !circleById.has(endpoints.target) ||
            internalByCircleId.get(endpoints.target)?.isInternallyValid;
        if (!sourceIsValid || !targetIsValid) return;

        addAdjacency(externalOutEdges, externalInEdges, endpoints.source, endpoints.target);
        externalEdges.push({ ...edge, ...endpoints });
    });

    const reachableFromSource = collectReachable(externalOutEdges, [
        SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
    ]);
    const canReachOutput = collectReachable(externalInEdges, [
        SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
    ]);
    const outputPathCircleIds = new Set(circles
        .filter(circle =>
            internalByCircleId.get(circle.id)?.isInternallyValid &&
            reachableFromSource.has(circle.id) &&
            canReachOutput.has(circle.id)
        )
        .map(circle => circle.id));
    const orderedCircleIds = resolveCircleOrder(
        circles,
        outputPathCircleIds,
        externalOutEdges
    );
    const displayOrderById = new Map(
        orderedCircleIds.map((circleId, index) => [circleId, index + 1])
    );
    const projectedNodes: MagicNode[] = [];
    const projectedEdges: Edge[] = [];

    if (outputPathCircleIds.size > 0) {
        projectedNodes.push(
            createVirtualAnchor(SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id),
            createVirtualAnchor(SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id)
        );
    }
    orderedCircleIds.forEach(circleId => {
        if (!outputPathCircleIds.has(circleId)) return;
        const internal = internalByCircleId.get(circleId);
        if (!internal) return;

        projectedNodes.push(...internal.projectedNodes);
        projectedEdges.push(...internal.projectedEdges);
    });
    externalEdges.forEach((edge, index) => {
        const sourceOnPath = edge.source === SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id ||
            outputPathCircleIds.has(edge.source);
        const targetOnPath = edge.target === SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id ||
            outputPathCircleIds.has(edge.target);
        if (!sourceOnPath || !targetOnPath) return;

        projectedEdges.push({
            id: `${MAGIC_EDGE_ID_PREFIX}-projected-${index}`,
            source: edge.source === SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id
                ? edge.source
                : endAnchorId(edge.source),
            target: edge.target === SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id
                ? edge.target
                : startAnchorId(edge.target),
        });
    });

    return {
        circles,
        states: orderedCircleIds.map(circleId => {
            const internal = internalByCircleId.get(circleId)!;
            return {
                circleId,
                nodeIds: internal.sequenceNodes.map(node => node.id),
                isInternallyValid: internal.isInternallyValid,
                isOnOutputPath: outputPathCircleIds.has(circleId),
                displayOrder: displayOrderById.get(circleId)!,
            };
        }),
        internalByCircleId,
        projectedNodes,
        projectedEdges,
        orderedOutputCircleIds: orderedCircleIds.filter(circleId =>
            outputPathCircleIds.has(circleId)
        ),
    };
}
