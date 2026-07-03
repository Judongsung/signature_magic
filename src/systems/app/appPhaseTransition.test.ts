import { describe, expect, it } from 'vitest';
import { APP_PHASES } from '../../constants/appPhaseConfigs';
import {
    type CirclePath,
} from '../graph/calculation/magicCalculationTypes';
import {
    NODE_COMPOSITION_COMPLETION_PRESENTATIONS,
    createNodeCompositionCompletionPlan,
} from './appPhaseTransition';

const BASE_CIRCLE: CirclePath = {
    id: 'circle-1',
    stats: {
        castingTime: 1,
        instability: 2,
        power: 3,
        range: 4,
        manaCost: 5,
        duration: 6,
    },
    statAdjustments: {
        castingTime: 0,
        instability: -0.2,
        power: 1,
        range: 0,
        manaCost: 0,
        duration: 0,
    },
    nodes: [
        {
            id: 'node-1',
            position: { x: 10, y: 20 },
            data: {
                magicType: 'ignition',
                nodeKind: 'user',
            },
        },
    ],
};

describe('appPhaseTransition', () => {
    it('creates a node composition transition plan with a circle snapshot', () => {
        const plan = createNodeCompositionCompletionPlan(
            {
                currentPhase: APP_PHASES.NODE_COMPOSITION,
                nextPhase: APP_PHASES.NODE_RESULT_DIALOGUE,
            },
            [BASE_CIRCLE],
            BASE_CIRCLE.id
        );

        expect(plan?.targetPhase).toBe(APP_PHASES.NODE_RESULT_DIALOGUE);
        expect(plan?.presentation).toBe(
            NODE_COMPOSITION_COMPLETION_PRESENTATIONS.TRANSITION
        );
        if (plan?.presentation !== NODE_COMPOSITION_COMPLETION_PRESENTATIONS.TRANSITION) {
            throw new Error('Expected transition completion plan');
        }
        expect(plan.circles).toEqual([BASE_CIRCLE]);
        expect(plan.terminalCircleId).toBe(BASE_CIRCLE.id);
        expect(plan.circles[0]).not.toBe(BASE_CIRCLE);
        expect(plan.circles[0].nodes[0]).not.toBe(BASE_CIRCLE.nodes[0]);
        expect(plan.circles[0].statAdjustments).not.toBe(BASE_CIRCLE.statAdjustments);
    });

    it('uses immediate completion for the meta magic result', () => {
        const plan = createNodeCompositionCompletionPlan(
            {
                currentPhase: APP_PHASES.NODE_COMPOSITION,
                nextPhase: APP_PHASES.MAGIC_RESULT,
            },
            [BASE_CIRCLE]
        );

        expect(plan?.targetPhase).toBe(APP_PHASES.MAGIC_RESULT);
        expect(plan?.presentation).toBe(
            NODE_COMPOSITION_COMPLETION_PRESENTATIONS.IMMEDIATE
        );
        expect(plan).not.toHaveProperty('circles');
    });

    it('snapshots the requested terminal circle for transition rendering', () => {
        const terminal = {
            ...BASE_CIRCLE,
            id: 'circle-terminal',
        };
        const plan = createNodeCompositionCompletionPlan(
            {
                currentPhase: APP_PHASES.NODE_COMPOSITION,
                nextPhase: APP_PHASES.NODE_RESULT_DIALOGUE,
            },
            [BASE_CIRCLE, terminal],
            terminal.id
        );

        expect(plan?.presentation).toBe(
            NODE_COMPOSITION_COMPLETION_PRESENTATIONS.TRANSITION
        );
        if (
            plan?.presentation !==
            NODE_COMPOSITION_COMPLETION_PRESENTATIONS.TRANSITION
        ) {
            throw new Error('Expected transition completion plan');
        }
        expect(plan.terminalCircleId).toBe(terminal.id);
    });

    it('does not create a plan for empty or unrelated phase transitions', () => {
        expect(createNodeCompositionCompletionPlan(
            {
                currentPhase: APP_PHASES.NODE_COMPOSITION,
                nextPhase: APP_PHASES.NODE_RESULT_DIALOGUE,
            },
            []
        )).toBeUndefined();
        expect(createNodeCompositionCompletionPlan(
            {
                currentPhase: APP_PHASES.CYOA,
                nextPhase: APP_PHASES.NODE_INTRO_DIALOGUE,
            },
            [BASE_CIRCLE]
        )).toBeUndefined();
    });
});
