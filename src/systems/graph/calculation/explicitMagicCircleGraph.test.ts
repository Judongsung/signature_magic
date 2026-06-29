import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import type { MagicTypeConfig } from '../../../types/magic';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from '../model/magicCircleGraph';
import { analyzeExplicitMagicCircleGraph } from './explicitMagicCircleGraph';
import { calculateMagic } from './magicCalculator';

function externalPath(circleId: string): Edge[] {
    return [
        {
            id: `source-${circleId}`,
            source: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
            target: circleId,
            sourceHandle: 'output-0',
            targetHandle: 'circle-input',
        },
        {
            id: `${circleId}-output`,
            source: circleId,
            target: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
            sourceHandle: 'circle-output',
            targetHandle: 'input-0',
        },
    ];
}

describe('explicitMagicCircleGraph sequence projection', () => {
    it('marks an empty circle invalid without projecting a sequence edge', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'empty');
        const analysis = analyzeExplicitMagicCircleGraph(
            [box],
            externalPath(box.id)
        );

        expect(analysis.states[0]).toMatchObject({
            circleId: box.id,
            nodeIds: [],
            isInternallyValid: false,
            isOnOutputPath: false,
        });
        expect(analysis.projectedEdges).toEqual([]);
    });

    it('projects every child as one sequence ordered by sequenceIndex', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'ordered');
        const second = attachNodeToCircle(createTestMagicNode('second'), box, 1);
        const first = attachNodeToCircle(createTestMagicNode('first'), box, 0);
        const analysis = analyzeExplicitMagicCircleGraph(
            [box, second, first],
            externalPath(box.id)
        );
        const internal = analysis.internalByCircleId.get(box.id)!;

        expect(internal.sequenceNodes.map(node => node.id)).toEqual(['first', 'second']);
        expect(internal.projectedEdges.map(edge => [edge.source, edge.target]))
            .toEqual([
                [`${box.id}:start`, 'first'],
                ['first', 'second'],
                ['second', `${box.id}:end`],
            ]);
        expect(analysis.states[0]).toMatchObject({
            nodeIds: ['first', 'second'],
            isInternallyValid: true,
            isOnOutputPath: true,
        });
    });

    it('ignores stored internal edges and uses sequence order only', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'ignore');
        const first = attachNodeToCircle(createTestMagicNode('first'), box, 0);
        const second = attachNodeToCircle(createTestMagicNode('second'), box, 1);
        const staleInternalEdge: Edge = {
            id: 'stale',
            source: second.id,
            target: first.id,
            sourceHandle: 'output-0',
            targetHandle: 'input-0',
        };
        const internal = analyzeExplicitMagicCircleGraph(
            [box, first, second],
            [...externalPath(box.id), staleInternalEdge]
        ).internalByCircleId.get(box.id)!;

        expect(internal.projectedEdges.map(edge => [edge.source, edge.target]))
            .toContainEqual(['first', 'second']);
        expect(internal.projectedEdges.map(edge => edge.id)).not.toContain('stale');
    });

    it('excludes an internally valid circle outside the external output path', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'isolated');
        const child = attachNodeToCircle(createTestMagicNode('child'), box, 0);
        const analysis = analyzeExplicitMagicCircleGraph([box, child], []);

        expect(analysis.states[0]).toMatchObject({
            isInternallyValid: true,
            isOnOutputPath: false,
        });
        expect(analysis.orderedOutputCircleIds).toEqual([]);
        expect(analysis.projectedNodes).toEqual([]);
    });

    it('accepts numbered external ports in the output path projection', () => {
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'ports');
        const child = attachNodeToCircle(createTestMagicNode('child'), box, 0);
        const edges: Edge[] = [
            {
                id: 'source',
                source: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
                target: box.id,
                sourceHandle: 'output-2',
                targetHandle: 'circle-input-2',
            },
            {
                id: 'output',
                source: box.id,
                target: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
                sourceHandle: 'circle-output-3',
                targetHandle: 'input-3',
            },
        ];

        expect(analyzeExplicitMagicCircleGraph(
            [box, child],
            edges
        ).orderedOutputCircleIds).toEqual([box.id]);
    });

    it('orders output-path circles topologically and then by x position', () => {
        const left = createMagicCircleNode({ x: 0, y: 0 }, () => 'left');
        const right = createMagicCircleNode({ x: 520, y: 0 }, () => 'right');
        const leftChild = attachNodeToCircle(createTestMagicNode('left-child'), left, 0);
        const rightChild = attachNodeToCircle(createTestMagicNode('right-child'), right, 0);
        const edges: Edge[] = [
            {
                id: 'source-left',
                source: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
                target: left.id,
                sourceHandle: 'output-0',
                targetHandle: 'circle-input',
            },
            {
                id: 'left-right',
                source: left.id,
                target: right.id,
                sourceHandle: 'circle-output',
                targetHandle: 'circle-input',
            },
            {
                id: 'right-output',
                source: right.id,
                target: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
                sourceHandle: 'circle-output',
                targetHandle: 'input-0',
            },
        ];

        expect(analyzeExplicitMagicCircleGraph(
            [right, left, rightChild, leftChild],
            edges
        ).states.map(state => [state.circleId, state.displayOrder]))
            .toEqual([
                [left.id, 1],
                [right.id, 2],
            ]);
    });

    it('keeps external fan-out branches as separate valid circles', () => {
        const root = createMagicCircleNode({ x: 0, y: 0 }, () => 'root');
        const left = createMagicCircleNode({ x: -520, y: 700 }, () => 'left');
        const right = createMagicCircleNode({ x: 520, y: 700 }, () => 'right');
        const nodes = [
            root,
            left,
            right,
            attachNodeToCircle(createTestMagicNode('root-node'), root, 0),
            attachNodeToCircle(createTestMagicNode('left-node'), left, 0),
            attachNodeToCircle(createTestMagicNode('right-node'), right, 0),
        ];
        const edges: Edge[] = [
            {
                id: 'source-root',
                source: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
                target: root.id,
                sourceHandle: 'output-0',
                targetHandle: 'circle-input',
            },
            {
                id: 'root-left',
                source: root.id,
                target: left.id,
                sourceHandle: 'circle-output',
                targetHandle: 'circle-input',
            },
            {
                id: 'root-right',
                source: root.id,
                target: right.id,
                sourceHandle: 'circle-output-1',
                targetHandle: 'circle-input',
            },
            {
                id: 'left-output',
                source: left.id,
                target: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
                sourceHandle: 'circle-output',
                targetHandle: 'input-0',
            },
            {
                id: 'right-output',
                source: right.id,
                target: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
                sourceHandle: 'circle-output',
                targetHandle: 'input-1',
            },
        ];

        expect(analyzeExplicitMagicCircleGraph(nodes, edges).orderedOutputCircleIds)
            .toEqual([root.id, left.id, right.id]);
    });

    it('preserves the existing serial stat result through virtual projection', () => {
        const magicTypes: MagicTypeConfig[] = [
            {
                type: 'ignition',
                label: 'Ignition',
                icon: '',
                color: '',
                category: 'basic',
                description: '',
                stats: {
                    castingTime: 1,
                    instability: 1,
                    power: 2,
                    range: 3,
                    manaCost: 4,
                    duration: 5,
                },
            },
            {
                type: 'stream',
                label: 'Stream',
                icon: '',
                color: '',
                category: 'basic',
                description: '',
                stats: {
                    castingTime: 2,
                    instability: 2,
                    power: 3,
                    range: 4,
                    manaCost: 5,
                    duration: 6,
                },
            },
        ];
        const first = createTestMagicNode('first');
        const second = {
            ...createTestMagicNode('second'),
            data: { magicType: 'stream' as const },
        };
        const generic = calculateMagic(
            [first, second],
            [{ id: 'serial', source: first.id, target: second.id }],
            magicTypes
        );
        const box = createMagicCircleNode({ x: 0, y: 0 }, () => 'regression');
        const explicit = calculateMagic(
            [
                box,
                attachNodeToCircle(first, box, 0),
                attachNodeToCircle(second, box, 1),
            ],
            externalPath(box.id),
            magicTypes
        );

        expect(explicit.circles[0].stats).toEqual(generic.circles[0].stats);
        expect(explicit.totalStats).toEqual(generic.totalStats);
    });
});
