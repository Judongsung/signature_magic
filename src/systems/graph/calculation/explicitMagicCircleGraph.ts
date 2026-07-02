import type { MagicGraphEdge } from '../magicGraphTypes';
import {
    MAGIC_CONTROL_PAIR_ROLES,
    MAGIC_EDGE_ID_PREFIX,
} from '../../../constants/graphConfigs';
import {
    type MagicCircleNode,
    type MagicEditorNode,
    type MagicNode,
} from '../magicGraphTypes';
import {
    type MagicCalculationAnchorNode,
    type MagicCalculationNode,
    type MagicCircleState,
} from './magicCalculationTypes';
import {
    isMagicCirclePortHandleId,
} from '../model/magicCircleGraph';
import {
    createMagicCircleGraphIndex,
} from '../model/magicCircleGraphIndex';
import {
    isMagicControlPairGraphValid,
    isMagicControlPairNode,
} from '../model/magicControlPairs';
import { isCircleSystemMagicNode } from '../model/circleSystemMagicNodes';

const VIRTUAL_ANCHOR_MAGIC_TYPE = '__circle-anchor__';
const VIRTUAL_START_SUFFIX = 'start';
const VIRTUAL_END_SUFFIX = 'end';

export interface CircleInternalAnalysis {
    circle: MagicCircleNode;
    sequenceNodes: readonly MagicNode[];
    calculationNodes: MagicNode[];
    projectedNodes: MagicCalculationNode[];
    projectedEdges: MagicGraphEdge[];
    isInternallyValid: boolean;
}

export interface ExplicitMagicCircleGraphAnalysis {
    circles: readonly MagicCircleNode[];
    states: MagicCircleState[];
    internalByCircleId: ReadonlyMap<string, CircleInternalAnalysis>;
    projectedNodes: MagicCalculationNode[];
    projectedEdges: MagicGraphEdge[];
    orderedCalculatedCircleIds: string[];
}

function startAnchorId(circleId: string): string {
    return `${circleId}:${VIRTUAL_START_SUFFIX}`;
}

function endAnchorId(circleId: string): string {
    return `${circleId}:${VIRTUAL_END_SUFFIX}`;
}

function createVirtualAnchor(id: string): MagicCalculationAnchorNode {
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
    source: string,
    target: string
): void {
    const targets = outEdges.get(source) ?? [];
    targets.push(target);
    outEdges.set(source, targets);
}

function analyzeCircleInternals(
    circle: MagicCircleNode,
    childNodes: readonly MagicNode[]
): CircleInternalAnalysis {
    const calculationSequenceNodes = childNodes.filter(node =>
        !isCircleSystemMagicNode(node)
    );
    const startId = startAnchorId(circle.id);
    const endId = endAnchorId(circle.id);
    const sequenceIds = [
        startId,
        ...childNodes.map(node => node.id),
        endId,
    ];
    // 내부 분기는 런타임의 정방향 이동 규칙이다. 조건을 평가할 수 없는
    // 정적 빌드 스탯은 분기하지 않은 전체 시퀀스를 직렬 계산한다.
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
        calculationNodes: calculationSequenceNodes
            .filter(node =>
                node.data.controlPair?.role !== MAGIC_CONTROL_PAIR_ROLES.END
            ),
        projectedNodes: [
            createVirtualAnchor(startId),
            ...childNodes.map(node =>
                isMagicControlPairNode(node) &&
                node.data.controlPair.role === MAGIC_CONTROL_PAIR_ROLES.END
                    ? createVirtualAnchor(node.id)
                    : node
            ),
            createVirtualAnchor(endId),
        ],
        projectedEdges,
        isInternallyValid: calculationSequenceNodes.length > 0 &&
            isMagicControlPairGraphValid([circle, ...childNodes]),
    };
}

function externalEdgeEndpoints(
    edge: MagicGraphEdge,
    circleById: ReadonlyMap<string, MagicCircleNode>
): { source: string; target: string } | undefined {
    const sourceCircle = circleById.get(edge.source);
    const targetCircle = circleById.get(edge.target);
    if (
        sourceCircle &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        targetCircle &&
        isMagicCirclePortHandleId(edge.targetHandle, 'input')
    ) {
        return { source: sourceCircle.id, target: targetCircle.id };
    }
    return undefined;
}

function resolveCircleOrder(
    circles: readonly MagicCircleNode[],
    calculatedCircleIds: ReadonlySet<string>,
    externalOutEdges: ReadonlyMap<string, readonly string[]>
): string[] {
    const relevantIds = new Set(calculatedCircleIds);
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
    const levelById = new Map<string, number>();
    const queue = [...indegreeById]
        .filter(([, indegree]) => indegree === 0)
        .map(([nodeId]) => nodeId);
    queue.forEach(nodeId => levelById.set(nodeId, 0));

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
            const leftCalculated = calculatedCircleIds.has(left.id);
            const rightCalculated = calculatedCircleIds.has(right.id);
            if (leftCalculated !== rightCalculated) {
                return leftCalculated ? -1 : 1;
            }
            if (leftCalculated && rightCalculated) {
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
    edges: readonly MagicGraphEdge[]
): ExplicitMagicCircleGraphAnalysis {
    const index = createMagicCircleGraphIndex(nodes);
    const circles = index.circles;
    const circleById = new Map(circles.map(circle => [circle.id, circle]));
    const internalByCircleId = new Map(circles.map(circle => [
        circle.id,
        analyzeCircleInternals(
            circle,
            index.childrenByCircleId.get(circle.id) ?? []
        ),
    ]));
    const externalOutEdges = new Map<string, string[]>();
    const externalEdges: Array<
        MagicGraphEdge & { source: string; target: string }
    > = [];

    edges.forEach(edge => {
        const endpoints = externalEdgeEndpoints(edge, circleById);
        if (!endpoints) return;
        const sourceIsValid = !circleById.has(endpoints.source) ||
            internalByCircleId.get(endpoints.source)?.isInternallyValid;
        const targetIsValid = !circleById.has(endpoints.target) ||
            internalByCircleId.get(endpoints.target)?.isInternallyValid;
        if (!sourceIsValid || !targetIsValid) return;

        addAdjacency(
            externalOutEdges,
            endpoints.source,
            endpoints.target
        );
        externalEdges.push({ ...edge, ...endpoints });
    });

    const calculatedCircleIds = new Set(circles
        .filter(circle =>
            internalByCircleId.get(circle.id)?.isInternallyValid
        )
        .map(circle => circle.id));
    const orderedCircleIds = resolveCircleOrder(
        circles,
        calculatedCircleIds,
        externalOutEdges
    );
    const displayOrderById = new Map(
        orderedCircleIds.map((circleId, index) => [circleId, index + 1])
    );
    const projectedNodes: MagicCalculationNode[] = [];
    const projectedEdges: MagicGraphEdge[] = [];

    orderedCircleIds.forEach(circleId => {
        if (!calculatedCircleIds.has(circleId)) return;
        const internal = internalByCircleId.get(circleId);
        if (!internal) return;

        projectedNodes.push(...internal.projectedNodes);
        projectedEdges.push(...internal.projectedEdges);
    });
    externalEdges.forEach((edge, index) => {
        if (
            !calculatedCircleIds.has(edge.source) ||
            !calculatedCircleIds.has(edge.target)
        ) return;

        projectedEdges.push({
            id: `${MAGIC_EDGE_ID_PREFIX}-projected-${index}`,
            source: endAnchorId(edge.source),
            target: startAnchorId(edge.target),
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
                displayOrder: displayOrderById.get(circleId)!,
            };
        }),
        internalByCircleId,
        projectedNodes,
        projectedEdges,
        orderedCalculatedCircleIds: orderedCircleIds.filter(circleId =>
            calculatedCircleIds.has(circleId)
        ),
    };
}
