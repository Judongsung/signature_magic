import { describe, expect, it } from 'vitest';
import { APP_PHASES } from '../../constants/gameConfigs';
import type { CirclePath } from '../../types/magic';
import { createNodeCompositionTransitionPlan } from './appPhaseTransition';

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
    nodes: [
        {
            id: 'node-1',
            position: { x: 10, y: 20 },
            data: {
                magicType: 'ignition',
            },
        },
    ],
};

describe('appPhaseTransition', () => {
    it('creates a node composition transition plan with a circle snapshot', () => {
        const plan = createNodeCompositionTransitionPlan(
            {
                currentPhase: APP_PHASES.NODE_COMPOSITION,
                nextPhase: APP_PHASES.NODE_RESULT_DIALOGUE,
            },
            [BASE_CIRCLE]
        );

        expect(plan?.targetPhase).toBe(APP_PHASES.NODE_RESULT_DIALOGUE);
        expect(plan?.circles).toEqual([BASE_CIRCLE]);
        expect(plan?.circles[0]).not.toBe(BASE_CIRCLE);
        expect(plan?.circles[0].nodes[0]).not.toBe(BASE_CIRCLE.nodes[0]);
    });

    it('does not create a plan for empty or unrelated phase transitions', () => {
        expect(createNodeCompositionTransitionPlan(
            {
                currentPhase: APP_PHASES.NODE_COMPOSITION,
                nextPhase: APP_PHASES.NODE_RESULT_DIALOGUE,
            },
            []
        )).toBeUndefined();
        expect(createNodeCompositionTransitionPlan(
            {
                currentPhase: APP_PHASES.CYOA,
                nextPhase: APP_PHASES.NODE_INTRO_DIALOGUE,
            },
            [BASE_CIRCLE]
        )).toBeUndefined();
    });
});
