import type { Edge } from '@xyflow/svelte';
import {
    MAGIC_STAT_KEYS,
    type MagicEditorNode,
    type MagicGraphNode,
    type MagicStatEffectBundle,
    type MagicStatEffectConfig,
    type MagicStats,
    type MagicTypeConfig,
    type CirclePath,
    type MagicCalculationResult,
} from '../../../types/magic';
import { buildMagicTypeMap, calculateMagicStats } from './magicStatCalculator';
import { applyMagicStatEffectsToStats } from './magicStatEffects';
import { clampMagicStats } from './magicStatRules';
import {
    buildMagicGraphAnalysis,
    type MagicGraphAnalysis,
} from './magicGraphAnalysis';
import {
    GRAPH_PERFORMANCE_OPERATION_IDS,
    measureGraphOperation,
} from '../diagnostics/graphPerformance';
import {
    buildMagicControlPairExecutionCounts,
    type MagicNodeExecutionCounts,
} from './magicRepeatCalculation';
import { createEmptyMagicStatEffectBundle } from './magicStatEffectBundles';
import {
    analyzeExplicitMagicCircleGraph,
    type ExplicitMagicCircleGraphAnalysis,
} from './explicitMagicCircleGraph';

type CalculatedCirclePath = Omit<CirclePath, 'statAdjustments'>;

export function calculateMagic(
    nodes: MagicEditorNode[],
    edges: Edge[],
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
    edges: Edge[],
    magicTypes: readonly MagicTypeConfig[],
    statEffects: MagicStatEffectBundle
): MagicCalculationResult {
    const magicTypeMap = buildMagicTypeMap(magicTypes);
    const explicitAnalysis = analyzeExplicitMagicCircleGraph(nodes, edges);
    const projectedAnalysis = buildMagicGraphAnalysis(
        explicitAnalysis.projectedNodes,
        explicitAnalysis.projectedEdges
    );
    const nodeExecutionCounts = buildMagicControlPairExecutionCounts(
        nodes,
        magicTypeMap
    );
    const calculatedCircles = calculateExplicitCircles(
        explicitAnalysis,
        magicTypeMap,
        statEffects.nodeEffects,
        nodeExecutionCounts
    );
    const hasNodeEffects = statEffects.nodeEffects.length > 0;
    const baselineCircles = hasNodeEffects
        ? calculateExplicitCircles(
            explicitAnalysis,
            magicTypeMap,
            [],
            nodeExecutionCounts
        )
        : calculatedCircles;
    const circles = attachCircleStatAdjustments(calculatedCircles, baselineCircles);
    const totalStats = calculateMagicStats(
        explicitAnalysis.projectedNodes,
        explicitAnalysis.projectedEdges,
        magicTypeMap,
        'total',
        statEffects.nodeEffects,
        projectedAnalysis,
        nodeExecutionCounts
    );
    const adjustedTotalStats = clampMagicStats(
        applyMagicStatEffectsToStats(
            applyCircleInstabilityToTotalStats(totalStats, circles),
            statEffects.finalEffects
        )
    );
    const baselineTotalStats = calculateBaselineTotalStats(
        explicitAnalysis.projectedNodes,
        explicitAnalysis.projectedEdges,
        projectedAnalysis,
        magicTypeMap,
        nodeExecutionCounts,
        baselineCircles,
        totalStats,
        hasNodeEffects
    );

    return {
        circles,
        circleStates: explicitAnalysis.states,
        totalStats: adjustedTotalStats,
        totalStatAdjustments: subtractMagicStats(
            adjustedTotalStats,
            baselineTotalStats
        ),
    };
}

function calculateExplicitCircles(
    analysis: ExplicitMagicCircleGraphAnalysis,
    magicTypeMap: ReadonlyMap<string, MagicTypeConfig>,
    nodeStatEffects: readonly MagicStatEffectConfig[],
    nodeExecutionCounts: MagicNodeExecutionCounts
): CalculatedCirclePath[] {
    return analysis.orderedCalculatedCircleIds.map(circleId => {
        const internal = analysis.internalByCircleId.get(circleId)!;
        const calculationNodeIds = new Set(
            internal.calculationNodes.map(node => node.id)
        );
        const statEdges = internal.projectedEdges.filter(edge =>
            calculationNodeIds.has(edge.source) &&
            calculationNodeIds.has(edge.target)
        );

        return {
            id: circleId,
            nodes: internal.calculationNodes,
            stats: calculateMagicStats(
                internal.calculationNodes,
                statEdges,
                magicTypeMap,
                'circle',
                nodeStatEffects,
                undefined,
                nodeExecutionCounts
            ),
        };
    });
}

function calculateBaselineTotalStats(
    nodes: readonly MagicGraphNode[],
    edges: readonly Edge[],
    analysis: MagicGraphAnalysis,
    magicTypeMap: ReadonlyMap<string, MagicTypeConfig>,
    nodeExecutionCounts: MagicNodeExecutionCounts,
    baselineCircles: readonly CalculatedCirclePath[],
    adjustedStatsBeforeFinalEffects: MagicStats,
    hasNodeEffects: boolean
): MagicStats {
    if (!hasNodeEffects) {
        return applyCircleInstabilityToTotalStats(
            adjustedStatsBeforeFinalEffects,
            baselineCircles
        );
    }
    const baselineStats = calculateMagicStats(
        nodes,
        edges,
        magicTypeMap,
        'total',
        [],
        analysis,
        nodeExecutionCounts
    );

    return applyCircleInstabilityToTotalStats(baselineStats, baselineCircles);
}

function attachCircleStatAdjustments(
    adjustedCircles: readonly CalculatedCirclePath[],
    baselineCircles: readonly CalculatedCirclePath[]
): CirclePath[] {
    const baselineById = new Map(baselineCircles.map(circle => [circle.id, circle]));

    return adjustedCircles.map(circle => ({
        ...circle,
        statAdjustments: subtractMagicStats(
            circle.stats,
            baselineById.get(circle.id)?.stats ?? circle.stats
        ),
    }));
}

function subtractMagicStats(adjusted: MagicStats, baseline: MagicStats): MagicStats {
    return Object.fromEntries(
        MAGIC_STAT_KEYS.map(statKey => [
            statKey,
            adjusted[statKey] - baseline[statKey],
        ])
    ) as MagicStats;
}

function applyCircleInstabilityToTotalStats(
    totalStats: MagicStats,
    circles: readonly { stats: MagicStats }[]
): MagicStats {
    return {
        ...totalStats,
        instability: circles.length === 0
            ? 0
            : Math.max(...circles.map(circle => circle.stats.instability)),
    };
}
