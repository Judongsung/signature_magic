import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import {
    GRAPH_NODE_TYPES,
    MAGIC_CIRCLE_HANDLE_IDS,
} from '../../../constants/graphConfigs';
import {
    type MagicEditorNode,
    type MagicNode,
} from '../magicGraphTypes';
import {
    type MagicStats,
} from '../../../types/magicStats';
import {
    type MagicType,
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import { calculateMagic } from '../calculation/magicCalculator';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from '../model/magicCircleGraph';
import {
    normalizeMagicCircleSequences,
} from '../model/magicCircleGraphActions';
import { syncGraphTopology } from '../model/graphEventHandlers';
import { buildMagicCircleRenderModels } from '../presentation/magicCircleRenderer';

const PERFORMANCE_SCENARIO_NODE_COUNTS = [25, 50, 100] as const;
const PERFORMANCE_SCENARIO_MAX_DURATION_MS = 1500;
const AMPLIFY_MAGIC_TYPE = 'amplify';
const MAGIC_TYPE_SEQUENCE: readonly MagicType[] = [
    'ignition',
    'stream',
    'air',
    'soil',
    'force',
];
const BASE_STATS: MagicStats = {
    castingTime: 1,
    instability: 1,
    power: 1,
    range: 1,
    manaCost: 1,
    duration: 1,
};

const scenarioMagicTypes = [
    ...MAGIC_TYPE_SEQUENCE.map(type =>
        magicType(type, 'basic')
    ),
    {
        ...magicType(AMPLIFY_MAGIC_TYPE, 'control'),
        powerAmplification: {
            factor: 1.5,
            manaCostPerAddedPower: 1,
        },
        stats: {
            ...BASE_STATS,
            power: 0,
            manaCost: 5,
        },
    },
];

interface PerformanceScenarioGraph {
    nodes: MagicEditorNode[];
    edges: Edge[];
}

function magicType(
    type: MagicType,
    category: MagicTypeConfig['category']
): MagicTypeConfig {
    return {
        type,
        label: type,
        icon: '',
        color: '#fff',
        category,
        description: type,
        stats: BASE_STATS,
    };
}

function node(
    id: string,
    magicType: MagicType,
    settings?: Record<string, string>
): MagicNode {
    return {
        id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position: { x: 0, y: 0 },
        data: { magicType, nodeKind: 'user', settings },
    };
}

function connectCircles(
    source: string,
    target: string,
    sourcePort = 0,
    targetPort = 0
): Edge {
    return {
        id: `${source}-${target}`,
        source,
        target,
        sourceHandle: sourcePort === 0
            ? MAGIC_CIRCLE_HANDLE_IDS.OUTPUT
            : `${MAGIC_CIRCLE_HANDLE_IDS.OUTPUT}-${sourcePort}`,
        targetHandle: targetPort === 0
            ? MAGIC_CIRCLE_HANDLE_IDS.INPUT
            : `${MAGIC_CIRCLE_HANDLE_IDS.INPUT}-${targetPort}`,
    };
}

function createLinearCircleGraph(
    nodeCount: number
): PerformanceScenarioGraph {
    const circle = createMagicCircleNode(
        { x: 0, y: 0 },
        () => 'linear'
    );
    const children = Array.from({ length: nodeCount }, (_, index) =>
        attachNodeToCircle(
            node(
                `linear-${index}`,
                MAGIC_TYPE_SEQUENCE[index % MAGIC_TYPE_SEQUENCE.length]
            ),
            circle,
            index
        )
    );

    return { nodes: [circle, ...children], edges: [] };
}

function createConvergingCircleGraph(
    nodeCount: number
): PerformanceScenarioGraph {
    const circles = Array.from({ length: nodeCount }, (_, index) =>
        createMagicCircleNode(
            {
                x: (index % 4) * 520,
                y: Math.floor(index / 4) * 720,
            },
            () => `converge-${index}`
        )
    );
    const children = circles.map((circle, index) =>
        attachNodeToCircle(
            node(
                `converge-node-${index}`,
                MAGIC_TYPE_SEQUENCE[index % MAGIC_TYPE_SEQUENCE.length]
            ),
            circle,
            0
        )
    );
    const terminal = circles.at(-1)!;
    const edges = circles.slice(0, -1).map((circle, index) =>
        connectCircles(circle.id, terminal.id, 0, index)
    );
    const synced = syncGraphTopology({
        nodes: [...circles, ...children],
        edges,
    });

    return {
        nodes: synced.nodes,
        edges: synced.edges,
    };
}

function createAmplifiedCircleGraph(
    nodeCount: number
): PerformanceScenarioGraph {
    const circle = createMagicCircleNode(
        { x: 0, y: 0 },
        () => 'amplified'
    );
    const children = Array.from({ length: nodeCount }, (_, index) => {
        const isAmplification = index % 2 === 1;

        return attachNodeToCircle(
            node(
                `amplified-${index}`,
                isAmplification
                    ? AMPLIFY_MAGIC_TYPE
                    : MAGIC_TYPE_SEQUENCE[
                        index % MAGIC_TYPE_SEQUENCE.length
                    ],
                isAmplification ? { weight: '3' } : undefined
            ),
            circle,
            index
        );
    });

    return { nodes: [circle, ...children], edges: [] };
}

function measureDuration(operation: () => void): number {
    const startedAt = performance.now();
    operation();
    return performance.now() - startedAt;
}

function expectWithinPerformanceBudget(durationMs: number): void {
    expect(durationMs).toBeGreaterThanOrEqual(0);
    expect(durationMs).toBeLessThan(
        PERFORMANCE_SCENARIO_MAX_DURATION_MS
    );
}

function runGraphPerformanceScenario(
    graph: PerformanceScenarioGraph
): void {
    let calculation = calculateMagic(
        graph.nodes,
        graph.edges,
        scenarioMagicTypes
    );

    const calculateDuration = measureDuration(() => {
        calculation = calculateMagic(
            graph.nodes,
            graph.edges,
            scenarioMagicTypes
        );
    });
    const normalizeDuration = measureDuration(() => {
        normalizeMagicCircleSequences(graph.nodes);
    });
    const syncDuration = measureDuration(() => {
        syncGraphTopology(graph);
    });
    const renderDuration = measureDuration(() => {
        buildMagicCircleRenderModels(calculation.circles);
    });

    expect(calculation.totalStats.power).toBeGreaterThanOrEqual(0);
    expect(calculation.circles.length).toBeGreaterThan(0);
    expectWithinPerformanceBudget(calculateDuration);
    expectWithinPerformanceBudget(normalizeDuration);
    expectWithinPerformanceBudget(syncDuration);
    expectWithinPerformanceBudget(renderDuration);
}

describe('graph performance scenarios', () => {
    it.each(PERFORMANCE_SCENARIO_NODE_COUNTS)(
        'handles a %i node circle sequence',
        nodeCount => {
            runGraphPerformanceScenario(
                createLinearCircleGraph(nodeCount)
            );
        }
    );

    it.each(PERFORMANCE_SCENARIO_NODE_COUNTS)(
        'handles a %i node converging circle graph',
        nodeCount => {
            runGraphPerformanceScenario(
                createConvergingCircleGraph(nodeCount)
            );
        }
    );

    it.each(PERFORMANCE_SCENARIO_NODE_COUNTS)(
        'handles a %i node weighted amplification sequence',
        nodeCount => {
            runGraphPerformanceScenario(
                createAmplifiedCircleGraph(nodeCount)
            );
        }
    );
});
