import { describe, expect, it } from 'vitest';
import {
    MAGIC_CIRCLE_NODE_CONFIG,
    MAGIC_CIRCLE_STATUSES,
} from '../../../constants/graphConfigs';
import { createTestMagicNode } from '../../../test-utils/graphFixtures';
import {
    type MagicCircleState,
} from '../calculation/magicCalculationTypes';
import {
    attachNodeToCircle,
    createMagicCircleNode,
} from '../model/magicCircleGraph';
import { resolveMagicCircleViewModel } from './magicCirclePresentation';

function state(
    overrides: Partial<MagicCircleState> = {}
): MagicCircleState {
    return {
        circleId: 'circle-view',
        nodeIds: ['child'],
        isInternallyValid: true,
        displayOrder: 1,
        ...overrides,
    };
}

describe('magicCirclePresentation', () => {
    it('shows one empty input and output port for a new circle', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'view');
        const viewModel = resolveMagicCircleViewModel(
            circle,
            [],
            undefined
        );

        expect(viewModel.status).toBe(MAGIC_CIRCLE_STATUSES.EMPTY);
        expect(viewModel.inputHandleIds).toEqual(['circle-input']);
        expect(viewModel.outputHandleIds).toEqual(['circle-output']);
        expect(viewModel.minimumWidth).toBe(MAGIC_CIRCLE_NODE_CONFIG.MIN_SIZE.width);
        expect(viewModel.minimumHeight).toBe(MAGIC_CIRCLE_NODE_CONFIG.MIN_SIZE.height);
    });

    it('keeps dynamic inputs and a single output', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'view');
        const child = attachNodeToCircle(createTestMagicNode('child'), circle, 0);
        const circleWithPorts = {
            ...circle,
            data: {
                ...circle.data,
                inputHandleCount: 3,
                outputHandleCount: 2,
            },
        };
        const viewModel = resolveMagicCircleViewModel(
            circleWithPorts,
            [child],
            state()
        );

        expect(viewModel.inputHandleIds).toEqual([
            'circle-input',
            'circle-input-1',
            'circle-input-2',
        ]);
        expect(viewModel.outputHandleIds).toEqual(['circle-output']);
    });

    it('resolves a non-empty circle as valid', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'view');
        const child = attachNodeToCircle(createTestMagicNode('child'), circle, 0);

        expect(resolveMagicCircleViewModel(
            circle,
            [child],
            state()
        ).status).toBe(MAGIC_CIRCLE_STATUSES.VALID);
    });

    it('resolves an input-only join circle as valid from calculation state', () => {
        const circle = createMagicCircleNode(
            { x: 0, y: 0 },
            () => 'join-view'
        );

        expect(resolveMagicCircleViewModel(
            circle,
            [],
            state({ nodeIds: [] })
        ).status).toBe(MAGIC_CIRCLE_STATUSES.VALID);
    });

    it('derives minimum height from sequence length', () => {
        const circle = createMagicCircleNode({ x: 0, y: 0 }, () => 'view');
        const children = Array.from({ length: 8 }, (_, index) =>
            attachNodeToCircle(createTestMagicNode(`child-${index}`), circle, index)
        );

        expect(resolveMagicCircleViewModel(
            circle,
            children,
            state()
        ).minimumHeight).toBe(448);
    });
});
