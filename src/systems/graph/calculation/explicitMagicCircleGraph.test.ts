import type { Edge } from '@xyflow/svelte';
import { describe, expect, it } from 'vitest';
import magicTypesData from '../../../data/magicTypes.json';
import {
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import { CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import type { MagicTypeConfig } from '../../../types/magic';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from '../model/magicCircleGraph';
import { createCircleSystemMagicNode } from '../model/circleSystemMagicNodes';
import { analyzeExplicitMagicCircleGraph } from './explicitMagicCircleGraph';
import { calculateMagic } from './magicCalculator';

function connectCircles(source: string, target: string): Edge {
    return {
        id: `${source}-${target}`,
        source,
        target,
        sourceHandle: 'circle-output',
        targetHandle: 'circle-input',
    };
}

describe('explicitMagicCircleGraph sequence projection', () => {
    const circleSystemNodeConfig = CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS[0];

    it('keeps an empty circle invalid without projecting nodes', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'empty'
        );
        const systemNode = createCircleSystemMagicNode(
            circle,
            circleSystemNodeConfig,
            0
        );
        const analysis = analyzeExplicitMagicCircleGraph(
            [circle, systemNode],
            []
        );

        expect(analysis.states[0]).toMatchObject({
            circleId: circle.id,
            nodeIds: [systemNode.id],
            isInternallyValid: false,
        });
        expect(analysis.orderedCalculatedCircleIds).toEqual([]);
        expect(analysis.projectedNodes).toEqual([]);
        expect(analysis.projectedEdges).toEqual([]);
    });

    it('calculates an isolated non-empty circle as an independent root', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'isolated'
        );
        const second = attachNodeToCircle(
            createTestMagicNode('second'),
            circle,
            1
        );
        const first = attachNodeToCircle(
            createTestMagicNode('first'),
            circle,
            0
        );
        const analysis = analyzeExplicitMagicCircleGraph(
            [circle, second, first],
            []
        );
        const internal = analysis.internalByCircleId.get(circle.id)!;

        expect(internal.sequenceNodes.map(node => node.id))
            .toEqual(['first', 'second']);
        expect(internal.projectedEdges.map(edge => [
            edge.source,
            edge.target,
        ])).toEqual([
            [`${circle.id}:start`, 'first'],
            ['first', 'second'],
            ['second', `${circle.id}:end`],
        ]);
        expect(analysis.orderedCalculatedCircleIds).toEqual([circle.id]);
        expect(analysis.states[0]).toMatchObject({
            isInternallyValid: true,
            displayOrder: 1,
        });
    });

    it('orders every valid circle topologically and then by x position', () => {
        const root = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'root'
        );
        const left = createMagicCircleNode(
            { x: -520, y: 700 },
            () => 'left'
        );
        const right = createMagicCircleNode(
            { x: 520, y: 700 },
            () => 'right'
        );
        const nodes = [
            root,
            left,
            right,
            attachNodeToCircle(createTestMagicNode('root-node'), root, 0),
            attachNodeToCircle(createTestMagicNode('left-node'), left, 0),
            attachNodeToCircle(createTestMagicNode('right-node'), right, 0),
        ];
        const edges = [
            connectCircles(root.id, left.id),
            {
                ...connectCircles(root.id, right.id),
                sourceHandle: 'circle-output-1',
            },
        ];

        const analysis = analyzeExplicitMagicCircleGraph(nodes, edges);
        expect(analysis.orderedCalculatedCircleIds)
            .toEqual([root.id, left.id, right.id]);
        expect(analysis.states.map(state => [
            state.circleId,
            state.displayOrder,
        ])).toEqual([
            [root.id, 1],
            [left.id, 2],
            [right.id, 3],
        ]);
    });

    it('calculates multiple disconnected valid circles', () => {
        const first = createMagicCircleNode(
            { x: -260, y: 0 },
            () => 'first-root'
        );
        const second = createMagicCircleNode(
            { x: 260, y: 0 },
            () => 'second-root'
        );
        const result = calculateMagic(
            [
                first,
                second,
                attachNodeToCircle(
                    createTestMagicNode('first-node'),
                    first,
                    0
                ),
                attachNodeToCircle(
                    createTestMagicNode('second-node'),
                    second,
                    0
                ),
            ],
            [],
            magicTypesData as MagicTypeConfig[]
        );

        expect(result.circles.map(circle => circle.id))
            .toEqual([first.id, second.id]);
    });

    it('projects pair end markers as zero-stat virtual anchors', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'pair'
        );
        const pairId = 'repeat-pair';
        const start = attachNodeToCircle({
            ...createTestMagicNode('repeat-start', 'repeat'),
            data: {
                ...createTestMagicNode('repeat-start', 'repeat').data,
                controlPair: {
                    id: pairId,
                    role: MAGIC_CONTROL_PAIR_ROLES.START,
                },
            },
        }, circle, 0);
        const middle = attachNodeToCircle(
            createTestMagicNode('middle'),
            circle,
            1
        );
        const end = attachNodeToCircle({
            ...createTestMagicNode('repeat-end', 'repeat'),
            data: {
                ...createTestMagicNode('repeat-end', 'repeat').data,
                controlPair: {
                    id: pairId,
                    role: MAGIC_CONTROL_PAIR_ROLES.END,
                },
                excludeFromStatScaling: true,
            },
        }, circle, 2);

        const internal = analyzeExplicitMagicCircleGraph(
            [circle, start, middle, end],
            []
        ).internalByCircleId.get(circle.id)!;

        expect(internal.calculationNodes.map(node => node.id))
            .toEqual([start.id, middle.id]);
        expect(internal.projectedNodes.find(node => node.id === end.id)?.data)
            .toMatchObject({
                magicType: '__circle-anchor__',
                excludeFromStatScaling: true,
            });
    });

    it('repeats only nodes enclosed by a repeat pair', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'repeat-stats'
        );
        const pairId = 'repeat-stats-pair';
        const start = attachNodeToCircle({
            ...createTestMagicNode('repeat-start', 'repeat'),
            data: {
                ...createTestMagicNode('repeat-start', 'repeat').data,
                settings: { repeatCount: '3' },
                controlPair: {
                    id: pairId,
                    role: MAGIC_CONTROL_PAIR_ROLES.START,
                },
            },
        }, circle, 0);
        const content = attachNodeToCircle(
            createTestMagicNode('content', 'ignition'),
            circle,
            1
        );
        const end = attachNodeToCircle({
            ...createTestMagicNode('repeat-end', 'repeat'),
            data: {
                ...createTestMagicNode('repeat-end', 'repeat').data,
                controlPair: {
                    id: pairId,
                    role: MAGIC_CONTROL_PAIR_ROLES.END,
                },
                excludeFromStatScaling: true,
            },
        }, circle, 2);

        const result = calculateMagic(
            [circle, start, content, end],
            [],
            magicTypesData as MagicTypeConfig[]
        );

        expect(result.circles[0].nodes.map(node => node.id))
            .toEqual([start.id, content.id]);
        expect(result.circles[0].stats).toMatchObject({
            castingTime: 5,
            power: 12,
            manaCost: 10,
        });
    });

    it('keeps branch pairs on the default serial calculation path', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'branch-stats'
        );
        const pairId = 'branch-stats-pair';
        const start = attachNodeToCircle({
            ...createTestMagicNode('branch-start', 'branch'),
            data: {
                ...createTestMagicNode('branch-start', 'branch').data,
                settings: { caption: '대상이 움직일 때' },
                controlPair: {
                    id: pairId,
                    role: MAGIC_CONTROL_PAIR_ROLES.START,
                },
            },
        }, circle, 0);
        const content = attachNodeToCircle(
            createTestMagicNode('branch-content', 'ignition'),
            circle,
            1
        );
        const end = attachNodeToCircle({
            ...createTestMagicNode('branch-end', 'branch'),
            data: {
                ...createTestMagicNode('branch-end', 'branch').data,
                controlPair: {
                    id: pairId,
                    role: MAGIC_CONTROL_PAIR_ROLES.END,
                },
                excludeFromStatScaling: true,
            },
        }, circle, 2);
        const result = calculateMagic(
            [circle, start, content, end],
            [],
            magicTypesData as MagicTypeConfig[]
        );

        expect(result.circles[0].nodes.map(node => node.id))
            .toEqual([start.id, content.id]);
        expect(result.circles[0].stats.manaCost).toBe(5);
    });

    it('preserves serial stats without requiring system boundary nodes', () => {
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
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'regression'
        );
        const explicit = calculateMagic(
            [
                circle,
                attachNodeToCircle(first, circle, 0),
                attachNodeToCircle(second, circle, 1),
            ],
            [],
            magicTypes
        );

        expect(explicit.circles[0].stats).toEqual(generic.circles[0].stats);
        expect(explicit.totalStats).toEqual(generic.totalStats);
    });
});
