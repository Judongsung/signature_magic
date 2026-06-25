import { describe, expect, it } from 'vitest';
import { APP_PHASES } from '../../constants/gameConfigs';
import { getNextAppPhase, getPreviousAppPhase } from './appPhaseNavigation';
import {
    APP_PHASE_NAVIGATION_NEXT_ACTIONS,
    resolveAppPhaseNavigationPolicy,
    resolveRegistrationReviewAccess,
} from './appPhaseNavigationPolicy';

describe('appPhaseNavigation', () => {
    it('resolves previous phases from the configured phase order', () => {
        expect(getPreviousAppPhase(APP_PHASES.INTRO_DIALOGUE)).toBeUndefined();
        expect(getPreviousAppPhase(APP_PHASES.CYOA)).toBe(APP_PHASES.INTRO_DIALOGUE);
        expect(getPreviousAppPhase(APP_PHASES.NODE_INTRO_DIALOGUE)).toBe(APP_PHASES.CYOA);
        expect(getPreviousAppPhase(APP_PHASES.NODE_COMPOSITION)).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
        expect(getPreviousAppPhase(APP_PHASES.NODE_RESULT_DIALOGUE)).toBe(APP_PHASES.NODE_COMPOSITION);
    });

    it('resolves next phases from the configured phase order', () => {
        expect(getNextAppPhase(APP_PHASES.INTRO_DIALOGUE)).toBe(APP_PHASES.CYOA);
        expect(getNextAppPhase(APP_PHASES.CYOA)).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
        expect(getNextAppPhase(APP_PHASES.NODE_INTRO_DIALOGUE)).toBe(APP_PHASES.NODE_COMPOSITION);
        expect(getNextAppPhase(APP_PHASES.NODE_COMPOSITION)).toBe(APP_PHASES.NODE_RESULT_DIALOGUE);
        expect(getNextAppPhase(APP_PHASES.NODE_RESULT_DIALOGUE)).toBeUndefined();
    });
});

describe('appPhaseNavigationPolicy', () => {
    it('opens registration review after entering the registration review phase', () => {
        expect(resolveRegistrationReviewAccess(APP_PHASES.INTRO_DIALOGUE, false)).toBe(false);
        expect(resolveRegistrationReviewAccess(APP_PHASES.CYOA, false)).toBe(true);
        expect(resolveRegistrationReviewAccess(APP_PHASES.NODE_COMPOSITION, false)).toBe(true);
        expect(resolveRegistrationReviewAccess(APP_PHASES.INTRO_DIALOGUE, true)).toBe(true);
    });

    it('disables the registration submit next action until registration can be submitted', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            phase: APP_PHASES.CYOA,
            canSubmitRegistration: false,
            hasEnteredRegistrationReviewPhase: true,
        });

        expect(policy.previousPhase).toBe(APP_PHASES.INTRO_DIALOGUE);
        expect(policy.nextPhase).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
        expect(policy.canReviewRegistration).toBe(true);
        expect(policy.isNextDisabled).toBe(true);
        expect(policy.nextAction).toBeUndefined();
        expect(policy.shouldRenderNavigation).toBe(true);
    });

    it('uses the registration submit dialog action on a submittable registration phase', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            phase: APP_PHASES.CYOA,
            canSubmitRegistration: true,
            hasEnteredRegistrationReviewPhase: true,
        });

        expect(policy.isNextDisabled).toBe(false);
        expect(policy.nextAction).toBe(
            APP_PHASE_NAVIGATION_NEXT_ACTIONS.OPEN_REGISTRATION_SUBMIT_DIALOG
        );
    });

    it('uses direct phase movement outside the registration submit phase', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            phase: APP_PHASES.NODE_COMPOSITION,
            canSubmitRegistration: false,
            hasEnteredRegistrationReviewPhase: true,
        });

        expect(policy.nextPhase).toBe(APP_PHASES.NODE_RESULT_DIALOGUE);
        expect(policy.isNextDisabled).toBe(false);
        expect(policy.nextAction).toBe(APP_PHASE_NAVIGATION_NEXT_ACTIONS.MOVE_TO_NEXT_PHASE);
    });

    it('does not expose a next action on the final phase', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            phase: APP_PHASES.NODE_RESULT_DIALOGUE,
            canSubmitRegistration: true,
            hasEnteredRegistrationReviewPhase: true,
        });

        expect(policy.nextPhase).toBeUndefined();
        expect(policy.nextAction).toBeUndefined();
        expect(policy.shouldRenderNavigation).toBe(true);
    });
});
