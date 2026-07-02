import {
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import {
    type MagicCircleNode,
    type MagicEditorNode,
    type MagicGraphEdge,
    type MagicNode,
} from '../magicGraphTypes';
import {
    MAGIC_GRAPH_COMPLETION_ISSUES,
    type MagicCircleState,
    type MagicGraphCompletionIssue,
} from './magicCalculationTypes';
import {
    isMagicCirclePortHandleId,
} from '../model/magicCircleGraph';
import {
    createMagicCircleGraphIndex,
} from '../model/magicCircleGraphIndex';
import {
    isMagicControlPairGraphValid,
} from '../model/magicControlPairs';
import { isCircleSystemMagicNode } from '../model/circleSystemMagicNodes';
import {
    hasValidMagicCircleConnectionNodePlacement,
    isMagicCircleConnectionJoinNode,
} from '../model/magicCircleConnectionNodes';
import {
    analyzeMagicCircleFlowTopology,
} from '../model/magicCircleFlowTopology';

export interface CircleInternalAnalysis {
    circle: MagicCircleNode;
    sequenceNodes: readonly MagicNode[];
    calculationNodes: MagicNode[];
    hasLocalCalculation: boolean;
    isInternallyValid: boolean;
}

export interface ExplicitMagicCircleGraphAnalysis {
    circles: readonly MagicCircleNode[];
    states: MagicCircleState[];
    internalByCircleId: ReadonlyMap<string, CircleInternalAnalysis>;
    externalEdges: readonly MagicGraphEdge[];
    incomingEdgesByCircleId: ReadonlyMap<
        string,
        readonly MagicGraphEdge[]
    >;
    orderedCircleIds: string[];
    orderedCalculatedCircleIds: string[];
    terminalCircleId?: string;
    completionIssue?: MagicGraphCompletionIssue;
}

function analyzeCircleInternals(
    circle: MagicCircleNode,
    childNodes: readonly MagicNode[],
    incomingEdges: readonly MagicGraphEdge[]
): CircleInternalAnalysis {
    const userSequenceNodes = childNodes.filter(node =>
        !isCircleSystemMagicNode(node)
    );
    const calculationNodes = userSequenceNodes.filter(node =>
        node.data.controlPair?.role !== MAGIC_CONTROL_PAIR_ROLES.END
    );
    const hasLocalCalculation = calculationNodes.length > 0;
    const joinEdgeIds = childNodes
        .filter(isMagicCircleConnectionJoinNode)
        .map(node => node.data.connectionJoin.edgeId);
    const incomingEdgeIds = new Set(
        incomingEdges.map(edge => edge.id)
    );
    const hasValidConnectionJoins =
        joinEdgeIds.length === incomingEdges.length &&
        new Set(joinEdgeIds).size === joinEdgeIds.length &&
        joinEdgeIds.every(edgeId => incomingEdgeIds.has(edgeId));

    return {
        circle,
        sequenceNodes: childNodes,
        calculationNodes,
        hasLocalCalculation,
        isInternallyValid:
            (hasLocalCalculation || incomingEdges.length > 0) &&
            hasValidConnectionJoins &&
            isMagicControlPairGraphValid([circle, ...childNodes]),
    };
}

function isExternalCircleEdge(
    edge: MagicGraphEdge,
    circleIds: ReadonlySet<string>
): boolean {
    return circleIds.has(edge.source) &&
        circleIds.has(edge.target) &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        isMagicCirclePortHandleId(edge.targetHandle, 'input');
}

function resolveCompletionIssue(
    circles: readonly MagicCircleNode[],
    hasInvalidExternalEdge: boolean,
    hasInvalidJoinPlacement: boolean,
    topology: ReturnType<typeof analyzeMagicCircleFlowTopology>,
    internalByCircleId: ReadonlyMap<string, CircleInternalAnalysis>,
    calculatedCircleIds: ReadonlySet<string>
): MagicGraphCompletionIssue | undefined {
    if (
        circles.length === 0 ||
        calculatedCircleIds.size === 0
    ) {
        return MAGIC_GRAPH_COMPLETION_ISSUES.NO_CALCULABLE_CIRCLE;
    }
    if (
        hasInvalidExternalEdge ||
        topology.hasUnknownEndpoint ||
        topology.hasMultipleOutputs ||
        topology.hasCycle
    ) {
        return MAGIC_GRAPH_COMPLETION_ISSUES.INVALID_TOPOLOGY;
    }
    if (
        hasInvalidJoinPlacement ||
        circles.some(circle =>
            !internalByCircleId.get(circle.id)?.isInternallyValid
        )
    ) {
        return MAGIC_GRAPH_COMPLETION_ISSUES.INVALID_CIRCLE;
    }
    if (
        topology.terminalCircleIds.length !== 1 ||
        calculatedCircleIds.size !== circles.length
    ) {
        return MAGIC_GRAPH_COMPLETION_ISSUES.INCOMPLETE_FLOW;
    }

    return undefined;
}

export function analyzeExplicitMagicCircleGraph(
    nodes: readonly MagicEditorNode[],
    edges: readonly MagicGraphEdge[]
): ExplicitMagicCircleGraphAnalysis {
    const index = createMagicCircleGraphIndex(nodes);
    const circles = index.circles;
    const circleIds = new Set(circles.map(circle => circle.id));
    const externalEdges = edges.filter(edge =>
        isExternalCircleEdge(edge, circleIds)
    );
    const positionOrderedCircleIds = [...circles]
        .sort((left, right) =>
            left.position.x - right.position.x ||
            left.position.y - right.position.y
        )
        .map(circle => circle.id);
    const topology = analyzeMagicCircleFlowTopology(
        positionOrderedCircleIds,
        externalEdges
    );
    const incomingEdgesByCircleId = new Map(
        circles.map(circle => [
            circle.id,
            externalEdges.filter(edge => edge.target === circle.id),
        ])
    );
    const internalByCircleId = new Map(circles.map(circle => [
        circle.id,
        analyzeCircleInternals(
            circle,
            index.childrenByCircleId.get(circle.id) ?? [],
            incomingEdgesByCircleId.get(circle.id) ?? []
        ),
    ]));
    const calculatedCircleIds = new Set<string>();

    topology.orderedCircleIds.forEach(circleId => {
        const internal = internalByCircleId.get(circleId);
        if (!internal?.isInternallyValid) return;

        const incomingEdges =
            incomingEdgesByCircleId.get(circleId) ?? [];
        const hasValidIncomingFlow = incomingEdges.every(edge =>
            calculatedCircleIds.has(edge.source) &&
            internal.sequenceNodes.some(node =>
                isMagicCircleConnectionJoinNode(node) &&
                node.data.connectionJoin.edgeId ===
                    edge.id
            )
        );
        if (
            incomingEdges.length === 0
                ? internal.hasLocalCalculation
                : hasValidIncomingFlow
        ) {
            calculatedCircleIds.add(circleId);
        }
    });

    const fallbackCircleIds = circles
        .filter(circle =>
            !topology.orderedCircleIds.includes(circle.id)
        )
        .sort((left, right) =>
            left.position.y - right.position.y ||
            left.position.x - right.position.x
        )
        .map(circle => circle.id);
    const orderedCircleIds = [
        ...topology.orderedCircleIds,
        ...fallbackCircleIds,
    ];
    const displayOrderById = new Map(
        orderedCircleIds.map((circleId, orderIndex) => [
            circleId,
            orderIndex + 1,
        ])
    );
    const completionIssue = resolveCompletionIssue(
        circles,
        externalEdges.length !== edges.length,
        !hasValidMagicCircleConnectionNodePlacement(nodes),
        topology,
        internalByCircleId,
        calculatedCircleIds
    );

    return {
        circles,
        states: orderedCircleIds.map(circleId => {
            const internal = internalByCircleId.get(circleId)!;
            return {
                circleId,
                nodeIds: internal.sequenceNodes.map(node => node.id),
                isInternallyValid:
                    internal.isInternallyValid &&
                    calculatedCircleIds.has(circleId),
                displayOrder: displayOrderById.get(circleId)!,
            };
        }),
        internalByCircleId,
        externalEdges,
        incomingEdgesByCircleId,
        orderedCircleIds,
        orderedCalculatedCircleIds: orderedCircleIds.filter(circleId =>
            calculatedCircleIds.has(circleId)
        ),
        terminalCircleId: completionIssue === undefined
            ? topology.terminalCircleIds[0]
            : undefined,
        completionIssue,
    };
}
