import {
    EMPTY_MAGIC_STATS,
    MAGIC_STAT_KEYS,
    type MagicStats,
} from '../../../types/magicStats';
import {
    type MagicEditorNode,
    type MagicGraphEdge,
    type MagicNode,
} from '../magicGraphTypes';
import {
    createEmptyMagicStatEffectBundle,
    type MagicStatEffectBundle,
    type MagicStatEffectConfig,
} from '../../../types/magicStatEffects';
import {
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import {
    type CirclePath,
    type MagicCalculationResult,
} from './magicCalculationTypes';
import {
    applyMagicNodeSequenceStats,
    buildMagicTypeMap,
    calculateMagicStats,
} from './magicStatCalculator';
import { applyMagicStatEffectsToStats } from './magicStatEffects';
import { clampMagicStats } from './magicStatRules';
import {
    combineMagicCircleFlowStats,
    finalizeMagicCircleFlowStats,
    resolveMagicFlowTotalStats,
} from './magicCircleFlowStatPolicy';
import {
    GRAPH_PERFORMANCE_OPERATION_IDS,
    measureGraphOperation,
} from '../diagnostics/graphPerformance';
import {
    buildMagicControlPairExecutionCounts,
    type MagicNodeExecutionCounts,
} from './magicRepeatCalculation';
import {
    analyzeExplicitMagicCircleGraph,
    type CircleInternalAnalysis,
    type ExplicitMagicCircleGraphAnalysis,
} from './explicitMagicCircleGraph';
import {
    isMagicCircleConnectionJoinNode,
} from '../model/magicCircleConnectionNodes';

type CalculatedCirclePath = Omit<CirclePath, 'statAdjustments'>;

export function calculateMagic(
    nodes: MagicEditorNode[],
    edges: MagicGraphEdge[],
    magicTypes: readonly MagicTypeConfig[] = [],
    statEffects: MagicStatEffectBundle = createEmptyMagicStatEffectBundle()
): MagicCalculationResult {
    return measureGraphOperation(
        GRAPH_PERFORMANCE_OPERATION_IDS.CALCULATE_MAGIC,
        {
            nodeCount: nodes.length,
            edgeCount: edges.length,
            nodeEffectCount: statEffects.nodeEffects.length,
            finalEffectCount: statEffects.finalEffects.length,
        },
        () => calculateExplicitMagicNow(
            nodes,
            edges,
            magicTypes,
            statEffects
        )
    );
}

function calculateExplicitMagicNow(
    nodes: MagicEditorNode[],
    edges: MagicGraphEdge[],
    magicTypes: readonly MagicTypeConfig[],
    statEffects: MagicStatEffectBundle
): MagicCalculationResult {
    const magicTypeMap = buildMagicTypeMap(magicTypes);
    const analysis = analyzeExplicitMagicCircleGraph(nodes, edges);
    const nodeExecutionCounts = buildMagicControlPairExecutionCounts(
        nodes,
        magicTypeMap
    );
    const calculatedCircles = calculateExplicitCircles(
        analysis,
        magicTypeMap,
        statEffects.nodeEffects,
        nodeExecutionCounts
    );
    const hasNodeEffects = statEffects.nodeEffects.length > 0;
    const baselineCircles = hasNodeEffects
        ? calculateExplicitCircles(
            analysis,
            magicTypeMap,
            [],
            nodeExecutionCounts
        )
        : calculatedCircles;
    const circles = attachCircleStatAdjustments(
        calculatedCircles,
        baselineCircles
    );
    const terminalStats = analysis.terminalCircleId
        ? calculatedCircles.find(circle =>
            circle.id === analysis.terminalCircleId
        )?.stats
        : undefined;
    const baselineTerminalStats = analysis.terminalCircleId
        ? baselineCircles.find(circle =>
            circle.id === analysis.terminalCircleId
        )?.stats
        : undefined;
    const flowTotalStats = terminalStats
        ? resolveMagicFlowTotalStats(
            terminalStats,
            calculatedCircles.map(circle => circle.stats),
            analysis.externalEdges.length
        )
        : undefined;
    const baselineFlowTotalStats = baselineTerminalStats
        ? resolveMagicFlowTotalStats(
            baselineTerminalStats,
            baselineCircles.map(circle => circle.stats),
            analysis.externalEdges.length
        )
        : undefined;
    const adjustedTotalStats = flowTotalStats
        ? clampMagicStats(applyMagicStatEffectsToStats(
            flowTotalStats,
            statEffects.finalEffects
        ))
        : { ...EMPTY_MAGIC_STATS };
    const baselineTotalStats =
        baselineFlowTotalStats ?? EMPTY_MAGIC_STATS;

    return {
        circles,
        circleStates: analysis.states,
        ...(analysis.terminalCircleId
            ? { terminalCircleId: analysis.terminalCircleId }
            : {}),
        totalStats: adjustedTotalStats,
        totalStatAdjustments: subtractMagicStats(
            adjustedTotalStats,
            baselineTotalStats
        ),
        ...(analysis.completionIssue
            ? { completionIssue: analysis.completionIssue }
            : {}),
    };
}

function calculateExplicitCircles(
    analysis: ExplicitMagicCircleGraphAnalysis,
    magicTypeMap: ReadonlyMap<string, MagicTypeConfig>,
    nodeStatEffects: readonly MagicStatEffectConfig[],
    nodeExecutionCounts: MagicNodeExecutionCounts
): CalculatedCirclePath[] {
    const calculatedByCircleId = new Map<
        string,
        CalculatedCirclePath
    >();

    analysis.orderedCalculatedCircleIds.forEach(circleId => {
        const internal = analysis.internalByCircleId.get(circleId);
        if (!internal) return;

        const circle = calculateCircleFlow(
            internal,
            calculatedByCircleId,
            magicTypeMap,
            nodeStatEffects,
            nodeExecutionCounts
        );
        if (circle) calculatedByCircleId.set(circleId, circle);
    });

    return analysis.orderedCalculatedCircleIds.flatMap(circleId => {
        const circle = calculatedByCircleId.get(circleId);
        return circle ? [circle] : [];
    });
}

function calculateCircleFlow(
    internal: CircleInternalAnalysis,
    calculatedByCircleId: ReadonlyMap<string, CalculatedCirclePath>,
    magicTypeMap: ReadonlyMap<string, MagicTypeConfig>,
    nodeStatEffects: readonly MagicStatEffectConfig[],
    nodeExecutionCounts: MagicNodeExecutionCounts
): CalculatedCirclePath | undefined {
    const calculationNodeIds = new Set(
        internal.calculationNodes.map(node => node.id)
    );
    const localStats = calculateMagicStats(
        internal.calculationNodes,
        magicTypeMap,
        nodeStatEffects,
        nodeExecutionCounts
    );
    let currentStats: MagicStats | undefined;
    let segmentNodes: MagicNode[] = [];

    const flushSegment = (): void => {
        if (segmentNodes.length === 0) return;

        currentStats = clampMagicStats(applyMagicNodeSequenceStats(
            currentStats,
            segmentNodes,
            magicTypeMap,
            nodeStatEffects,
            nodeExecutionCounts
        ));
        segmentNodes = [];
    };

    for (const node of internal.sequenceNodes) {
        if (isMagicCircleConnectionJoinNode(node)) {
            flushSegment();
            const source = calculatedByCircleId.get(
                node.data.connectionJoin.sourceCircleId
            );
            if (!source) return undefined;

            currentStats = currentStats
                ? combineMagicCircleFlowStats(
                    currentStats,
                    source.stats,
                    'parallel'
                )
                : { ...source.stats };
            continue;
        }
        if (calculationNodeIds.has(node.id)) {
            segmentNodes.push(node);
        }
    }
    flushSegment();

    if (!currentStats) return undefined;

    return {
        id: internal.circle.id,
        name: internal.circle.data.name,
        nodes: internal.calculationNodes,
        starPointCount:
            internal.calculationNodes.length +
            internal.sequenceNodes.filter(isMagicCircleConnectionJoinNode)
                .length,
        stats: finalizeMagicCircleFlowStats(
            currentStats,
            localStats
        ),
    };
}

function attachCircleStatAdjustments(
    adjustedCircles: readonly CalculatedCirclePath[],
    baselineCircles: readonly CalculatedCirclePath[]
): CirclePath[] {
    const baselineById = new Map(
        baselineCircles.map(circle => [circle.id, circle])
    );

    return adjustedCircles.map(circle => ({
        ...circle,
        statAdjustments: subtractMagicStats(
            circle.stats,
            baselineById.get(circle.id)?.stats ?? circle.stats
        ),
    }));
}

function subtractMagicStats(
    adjusted: MagicStats,
    baseline: MagicStats
): MagicStats {
    return Object.fromEntries(
        MAGIC_STAT_KEYS.map(statKey => [
            statKey,
            adjusted[statKey] - baseline[statKey],
        ])
    ) as MagicStats;
}
