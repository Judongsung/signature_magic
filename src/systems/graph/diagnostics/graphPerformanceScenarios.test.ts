import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { MAGIC_CONNECTION_RULE_KEYS } from '../../../constants/nodeEditorConfigs';
import { GRAPH_NODE_TYPES } from '../../../constants/graphConfigs';
import {
    type MagicNode,
    type MagicStats,
    type MagicType,
    type MagicTypeConfig,
} from '../../../types/magic';
import { calculateMagic } from '../calculation/magicCalculator';
import { syncGraphTopology } from '../model/graphEventHandlers';
import { buildMagicCircleRenderModels } from '../presentation/magicCircleRenderer';

const PERFORMANCE_SCENARIO_NODE_COUNTS = [25, 50, 100] as const;
const PERFORMANCE_SCENARIO_MAX_DURATION_MS = 1500;
const NODE_POSITION_STEP = 80;
const BRANCH_GROUP_SIZE = 5;
const MAGIC_TYPE_SEQUENCE: readonly MagicType[] = ['ignition', 'stream', 'air', 'soil', 'force'];
const BASE_STATS: MagicStats = {
    castingTime: 1,
    instability: 1,
    power: 1,
    range: 1,
    manaCost: 1,
    duration: 1,
};

const scenarioMagicTypes = [
    magicType('ignition', 'basic'),
    magicType('stream', 'basic'),
    magicType('air', 'basic'),
    magicType('soil', 'basic'),
    magicType('force', 'basic'),
    {
        ...magicType('split', 'extension'),
        connectionLimits: { maxInputs: 1, maxOutputs: null },
    },
    {
        ...magicType('merge', 'extension'),
        connectionLimits: { maxInputs: null, maxOutputs: 1 },
    },
    {
        ...magicType('repeat', 'control'),
        connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: true },
    },
] as MagicTypeConfig[];

interface PerformanceScenarioGraph {
    nodes: MagicNode[];
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

function node(id: string, magicType: MagicType, index: number): MagicNode {
    return {
        id,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position: { x: index * NODE_POSITION_STEP, y: 0 },
        data: { magicType },
    };
}

function edge(source: string, target: string): Edge {
    return { id: `${source}-${target}`, source, target };
}

function createLinearGraph(nodeCount: number): PerformanceScenarioGraph {
    const nodes = Array.from({ length: nodeCount }, (_, index) =>
        node(`linear-${index}`, MAGIC_TYPE_SEQUENCE[index % MAGIC_TYPE_SEQUENCE.length], index)
    );
    const edges = nodes.slice(1).map((currentNode, index) =>
        edge(nodes[index].id, currentNode.id)
    );

    return { nodes, edges };
}

function createBranchGraph(nodeCount: number): PerformanceScenarioGraph {
    const nodes: MagicNode[] = [];
    const edges: Edge[] = [];
    let cursor = 0;
    let previousMergeId: string | undefined;

    while (nodes.length + BRANCH_GROUP_SIZE <= nodeCount) {
        const groupIndex = cursor;
        const start = node(`branch-${groupIndex}-start`, 'ignition', nodes.length);
        const split = node(`branch-${groupIndex}-split`, 'split', nodes.length + 1);
        const left = node(`branch-${groupIndex}-left`, 'stream', nodes.length + 2);
        const right = node(`branch-${groupIndex}-right`, 'soil', nodes.length + 3);
        const merge = node(`branch-${groupIndex}-merge`, 'merge', nodes.length + 4);

        nodes.push(start, split, left, right, merge);
        if (previousMergeId) edges.push(edge(previousMergeId, start.id));
        edges.push(
            edge(start.id, split.id),
            edge(split.id, left.id),
            edge(split.id, right.id),
            edge(left.id, merge.id),
            edge(right.id, merge.id)
        );
        previousMergeId = merge.id;
        cursor += 1;
    }

    while (nodes.length < nodeCount) {
        const current = node(
            `branch-tail-${nodes.length}`,
            MAGIC_TYPE_SEQUENCE[nodes.length % MAGIC_TYPE_SEQUENCE.length],
            nodes.length
        );
        if (previousMergeId) edges.push(edge(previousMergeId, current.id));
        previousMergeId = current.id;
        nodes.push(current);
    }

    return { nodes, edges };
}

function createCycleGraph(nodeCount: number): PerformanceScenarioGraph {
    const nodes = Array.from({ length: nodeCount }, (_, index) =>
        node(
            `cycle-${index}`,
            index === nodeCount - 1 ? 'repeat' : MAGIC_TYPE_SEQUENCE[index % MAGIC_TYPE_SEQUENCE.length],
            index
        )
    );
    const edges = [
        ...nodes.slice(1).map((currentNode, index) => edge(nodes[index].id, currentNode.id)),
        edge(nodes[nodes.length - 1].id, nodes[0].id),
    ];

    return { nodes, edges };
}

function measureDuration(operation: () => void): number {
    const startedAt = performance.now();
    operation();
    return performance.now() - startedAt;
}

function expectWithinPerformanceBudget(durationMs: number): void {
    expect(durationMs).toBeGreaterThanOrEqual(0);
    expect(durationMs).toBeLessThan(PERFORMANCE_SCENARIO_MAX_DURATION_MS);
}

function runGraphPerformanceScenario(graph: PerformanceScenarioGraph): void {
    let calculation = calculateMagic(graph.nodes, graph.edges, scenarioMagicTypes);

    const calculateDuration = measureDuration(() => {
        calculation = calculateMagic(graph.nodes, graph.edges, scenarioMagicTypes);
    });
    const syncDuration = measureDuration(() => {
        syncGraphTopology(graph, scenarioMagicTypes);
    });
    const renderDuration = measureDuration(() => {
        buildMagicCircleRenderModels(calculation.circles);
    });

    expect(calculation.totalStats.power).toBeGreaterThanOrEqual(0);
    expect(calculation.circles.length).toBeGreaterThan(0);
    expectWithinPerformanceBudget(calculateDuration);
    expectWithinPerformanceBudget(syncDuration);
    expectWithinPerformanceBudget(renderDuration);
}

describe('graph performance scenarios', () => {
    it.each(PERFORMANCE_SCENARIO_NODE_COUNTS)('handles a %i node linear graph', nodeCount => {
        runGraphPerformanceScenario(createLinearGraph(nodeCount));
    });

    it.each(PERFORMANCE_SCENARIO_NODE_COUNTS)('handles a %i node branch graph', nodeCount => {
        runGraphPerformanceScenario(createBranchGraph(nodeCount));
    });

    it.each(PERFORMANCE_SCENARIO_NODE_COUNTS)('handles a %i node cycle graph', nodeCount => {
        runGraphPerformanceScenario(createCycleGraph(nodeCount));
    });
});
