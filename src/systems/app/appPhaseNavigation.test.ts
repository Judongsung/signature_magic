import { describe, expect, it } from 'vitest';
import {
    APP_PHASES,
    getAppPhaseConfig,
} from '../../constants/appPhaseConfigs';
import { APP_MODES } from '../../constants/appModeConfigs';
import { UI_BUTTON_TEXT } from '../../constants/uiText';
import { getNextAppPhase, getPreviousAppPhase } from './appPhaseNavigation';
import {
    APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS,
    APP_PHASE_NAVIGATION_NEXT_ACTIONS,
    resolveAppPhaseNavigationPolicy,
} from './appPhaseNavigationPolicy';
import {
    MAGIC_GRAPH_COMPLETION_ISSUES,
} from '../graph/calculation/magicCalculationTypes';

describe('appPhaseNavigation', () => {
    it('resolves previous phases from the configured phase order', () => {
        expect(getPreviousAppPhase(APP_MODES.CYOA, APP_PHASES.INTRO_DIALOGUE)).toBeUndefined();
        expect(getPreviousAppPhase(APP_MODES.CYOA, APP_PHASES.CYOA)).toBe(APP_PHASES.INTRO_DIALOGUE);
        expect(getPreviousAppPhase(APP_MODES.CYOA, APP_PHASES.NODE_INTRO_DIALOGUE)).toBe(APP_PHASES.CYOA);
        expect(getPreviousAppPhase(APP_MODES.CYOA, APP_PHASES.NODE_COMPOSITION)).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
        expect(getPreviousAppPhase(APP_MODES.CYOA, APP_PHASES.NODE_RESULT_DIALOGUE)).toBe(APP_PHASES.NODE_COMPOSITION);
        expect(getPreviousAppPhase(APP_MODES.META, APP_PHASES.NODE_COMPOSITION)).toBeUndefined();
        expect(getPreviousAppPhase(APP_MODES.META, APP_PHASES.MAGIC_RESULT)).toBe(APP_PHASES.NODE_COMPOSITION);
    });

    it('resolves next phases from the configured phase order', () => {
        expect(getNextAppPhase(APP_MODES.CYOA, APP_PHASES.INTRO_DIALOGUE)).toBe(APP_PHASES.CYOA);
        expect(getNextAppPhase(APP_MODES.CYOA, APP_PHASES.CYOA)).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
        expect(getNextAppPhase(APP_MODES.CYOA, APP_PHASES.NODE_INTRO_DIALOGUE)).toBe(APP_PHASES.NODE_COMPOSITION);
        expect(getNextAppPhase(APP_MODES.CYOA, APP_PHASES.NODE_COMPOSITION)).toBe(APP_PHASES.NODE_RESULT_DIALOGUE);
        expect(getNextAppPhase(APP_MODES.CYOA, APP_PHASES.NODE_RESULT_DIALOGUE)).toBeUndefined();
        expect(getNextAppPhase(APP_MODES.META, APP_PHASES.NODE_COMPOSITION)).toBe(APP_PHASES.MAGIC_RESULT);
        expect(getNextAppPhase(APP_MODES.META, APP_PHASES.MAGIC_RESULT)).toBeUndefined();
    });

    it('shows maximum mana from the CYOA phase onward', () => {
        expect(getAppPhaseConfig(APP_PHASES.INTRO_DIALOGUE).showsMaximumMana)
            .toBe(false);
        expect(getAppPhaseConfig(APP_PHASES.CYOA).showsMaximumMana)
            .toBe(true);
        expect(getAppPhaseConfig(APP_PHASES.NODE_COMPOSITION).showsMaximumMana)
            .toBe(true);
        expect(getAppPhaseConfig(APP_PHASES.NODE_RESULT_DIALOGUE).showsMaximumMana)
            .toBe(true);
    });
});

describe('appPhaseNavigationPolicy', () => {
    it('exposes registration review only on the final phase', () => {
        const cyoaPolicy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.CYOA,
            phase: APP_PHASES.CYOA,
            canSubmitRegistration: true,
            canCompleteNodeComposition: false,
            isWithinMaximumMana: true,
        });
        const nodeCompositionPolicy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.CYOA,
            phase: APP_PHASES.NODE_COMPOSITION,
            canSubmitRegistration: true,
            canCompleteNodeComposition: true,
            isWithinMaximumMana: true,
        });
        const finalPolicy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.CYOA,
            phase: APP_PHASES.NODE_RESULT_DIALOGUE,
            canSubmitRegistration: true,
            canCompleteNodeComposition: true,
            isWithinMaximumMana: true,
        });

        expect(cyoaPolicy.canReviewRegistration).toBe(false);
        expect(nodeCompositionPolicy.canReviewRegistration).toBe(false);
        expect(finalPolicy.canReviewRegistration).toBe(true);
    });

    it('disables the registration submit next action until registration can be submitted', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.CYOA,
            phase: APP_PHASES.CYOA,
            canSubmitRegistration: false,
            canCompleteNodeComposition: false,
            isWithinMaximumMana: true,
        });

        expect(policy.previousPhase).toBe(APP_PHASES.INTRO_DIALOGUE);
        expect(policy.nextPhase).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
        expect(policy.canReviewRegistration).toBe(false);
        expect(policy.isNextDisabled).toBe(true);
        expect(policy.nextDisabledFeedback).toEqual({
            message: UI_BUTTON_TEXT.COMPLETE_REQUIRED_FIELDS_TOOLTIP,
            presentation: APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS.CHARACTER_SPEECH,
        });
        expect(policy.nextAction).toBeUndefined();
        expect(policy.shouldRenderNavigation).toBe(true);
    });

    it('uses the registration submit dialog action on a submittable registration phase', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.CYOA,
            phase: APP_PHASES.CYOA,
            canSubmitRegistration: true,
            canCompleteNodeComposition: false,
            isWithinMaximumMana: true,
        });

        expect(policy.isNextDisabled).toBe(false);
        expect(policy.nextDisabledFeedback).toBeUndefined();
        expect(policy.nextAction).toBe(
            APP_PHASE_NAVIGATION_NEXT_ACTIONS.OPEN_REGISTRATION_SUBMIT_DIALOG
        );
    });

    it('disables node composition navigation until a circle exists', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.CYOA,
            phase: APP_PHASES.NODE_COMPOSITION,
            canSubmitRegistration: false,
            canCompleteNodeComposition: false,
            isWithinMaximumMana: true,
        });

        expect(policy.nextPhase).toBe(APP_PHASES.NODE_RESULT_DIALOGUE);
        expect(policy.isNextDisabled).toBe(true);
        expect(policy.nextDisabledFeedback).toEqual({
            message: UI_BUTTON_TEXT.CREATE_MAGIC_CIRCLE_TOOLTIP,
            presentation: APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS.TOOLTIP,
        });
        expect(policy.nextAction).toBeUndefined();
    });

    it('uses direct phase movement when node composition has a circle', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.CYOA,
            phase: APP_PHASES.NODE_COMPOSITION,
            canSubmitRegistration: false,
            canCompleteNodeComposition: true,
            isWithinMaximumMana: true,
        });

        expect(policy.nextPhase).toBe(APP_PHASES.NODE_RESULT_DIALOGUE);
        expect(policy.isNextDisabled).toBe(false);
        expect(policy.nextDisabledFeedback).toBeUndefined();
        expect(policy.nextAction).toBe(APP_PHASE_NAVIGATION_NEXT_ACTIONS.MOVE_TO_NEXT_PHASE);
    });

    it('explains an incomplete converging circle flow', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.CYOA,
            phase: APP_PHASES.NODE_COMPOSITION,
            canSubmitRegistration: false,
            canCompleteNodeComposition: false,
            nodeCompositionCompletionIssue:
                MAGIC_GRAPH_COMPLETION_ISSUES.INCOMPLETE_FLOW,
            isWithinMaximumMana: true,
        });

        expect(policy.nextDisabledFeedback?.message)
            .toBe(UI_BUTTON_TEXT.INCOMPLETE_MAGIC_FLOW_TOOLTIP);
    });

    it.each([
        [
            MAGIC_GRAPH_COMPLETION_ISSUES.NO_CALCULABLE_CIRCLE,
            UI_BUTTON_TEXT.CREATE_MAGIC_CIRCLE_TOOLTIP,
        ],
        [
            MAGIC_GRAPH_COMPLETION_ISSUES.INVALID_CIRCLE,
            UI_BUTTON_TEXT.INVALID_MAGIC_CIRCLE_TOOLTIP,
        ],
        [
            MAGIC_GRAPH_COMPLETION_ISSUES.INVALID_TOPOLOGY,
            UI_BUTTON_TEXT.INVALID_MAGIC_FLOW_TOOLTIP,
        ],
        [
            MAGIC_GRAPH_COMPLETION_ISSUES.INCOMPLETE_FLOW,
            UI_BUTTON_TEXT.INCOMPLETE_MAGIC_FLOW_TOOLTIP,
        ],
    ])('maps graph completion issue %s to exhaustive feedback', (
        nodeCompositionCompletionIssue,
        expectedMessage
    ) => {
        const policy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.CYOA,
            phase: APP_PHASES.NODE_COMPOSITION,
            canSubmitRegistration: false,
            canCompleteNodeComposition: false,
            nodeCompositionCompletionIssue,
            isWithinMaximumMana: true,
        });

        expect(policy.nextDisabledFeedback?.message).toBe(expectedMessage);
    });

    it('blocks node composition completion when mana exceeds the maximum', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.CYOA,
            phase: APP_PHASES.NODE_COMPOSITION,
            canSubmitRegistration: false,
            canCompleteNodeComposition: true,
            isWithinMaximumMana: false,
        });

        expect(policy.isNextDisabled).toBe(true);
        expect(policy.nextDisabledFeedback).toEqual({
            message: UI_BUTTON_TEXT.MAXIMUM_MANA_EXCEEDED_TOOLTIP,
            presentation: APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS.TOOLTIP,
        });
        expect(policy.nextAction).toBeUndefined();
    });

    it('does not expose a next action on the final phase', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.CYOA,
            phase: APP_PHASES.NODE_RESULT_DIALOGUE,
            canSubmitRegistration: true,
            canCompleteNodeComposition: false,
            isWithinMaximumMana: true,
        });

        expect(policy.nextPhase).toBeUndefined();
        expect(policy.canReviewRegistration).toBe(true);
        expect(policy.nextAction).toBeUndefined();
        expect(policy.shouldRenderNavigation).toBe(true);
    });

    it('uses the meta result phase without applying the maximum mana gate', () => {
        const policy = resolveAppPhaseNavigationPolicy({
            mode: APP_MODES.META,
            phase: APP_PHASES.NODE_COMPOSITION,
            canSubmitRegistration: false,
            canCompleteNodeComposition: true,
            isWithinMaximumMana: false,
        });

        expect(policy.previousPhase).toBeUndefined();
        expect(policy.returnsToTitle).toBe(true);
        expect(policy.nextPhase).toBe(APP_PHASES.MAGIC_RESULT);
        expect(policy.isNextDisabled).toBe(false);
        expect(policy.nextAction).toBe(
            APP_PHASE_NAVIGATION_NEXT_ACTIONS.MOVE_TO_NEXT_PHASE
        );
    });
});
