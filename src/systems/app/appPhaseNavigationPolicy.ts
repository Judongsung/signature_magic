import {
    APP_PHASE_ORDER,
    APP_PHASES,
    type AppPhase,
} from '../../constants/appPhaseConfigs';
import { UI_BUTTON_TEXT } from '../../constants/uiText';
import { getNextAppPhase, getPreviousAppPhase } from './appPhaseNavigation';

export const APP_PHASE_NAVIGATION_NEXT_ACTIONS = {
    MOVE_TO_NEXT_PHASE: 'moveToNextPhase',
    OPEN_REGISTRATION_SUBMIT_DIALOG: 'openRegistrationSubmitDialog',
} as const;

export type AppPhaseNavigationNextAction =
    (typeof APP_PHASE_NAVIGATION_NEXT_ACTIONS)[keyof typeof APP_PHASE_NAVIGATION_NEXT_ACTIONS];

export const APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS = {
    CHARACTER_SPEECH: 'characterSpeech',
    TOOLTIP: 'tooltip',
} as const;

export type AppPhaseNavigationDisabledPresentation =
    (typeof APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS)[keyof typeof APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS];

export interface AppPhaseNavigationDisabledFeedback {
    message: string;
    presentation: AppPhaseNavigationDisabledPresentation;
}

export interface AppPhaseNavigationPolicyInput {
    phase: AppPhase;
    canSubmitRegistration: boolean;
    canCompleteNodeComposition: boolean;
    hasEnteredRegistrationReviewPhase: boolean;
}

export interface AppPhaseNavigationPolicy {
    previousPhase: AppPhase | undefined;
    nextPhase: AppPhase | undefined;
    canReviewRegistration: boolean;
    isNextDisabled: boolean;
    nextDisabledFeedback: AppPhaseNavigationDisabledFeedback | undefined;
    nextAction: AppPhaseNavigationNextAction | undefined;
    shouldRenderNavigation: boolean;
}

const FIRST_REGISTRATION_REVIEW_PHASE_INDEX = APP_PHASE_ORDER.indexOf(APP_PHASES.CYOA);
type NextDisabledFeedbackResolver = (
    input: AppPhaseNavigationPolicyInput
) => AppPhaseNavigationDisabledFeedback | undefined;

const NEXT_DISABLED_FEEDBACK_RESOLVERS: Partial<Record<AppPhase, NextDisabledFeedbackResolver>> = {
    [APP_PHASES.CYOA]: ({ canSubmitRegistration }) =>
        canSubmitRegistration
            ? undefined
            : {
                message: UI_BUTTON_TEXT.COMPLETE_REQUIRED_FIELDS_TOOLTIP,
                presentation: APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS.CHARACTER_SPEECH,
            },
    [APP_PHASES.NODE_COMPOSITION]: ({ canCompleteNodeComposition }) =>
        canCompleteNodeComposition
            ? undefined
            : {
                message: UI_BUTTON_TEXT.CREATE_MAGIC_CIRCLE_TOOLTIP,
                presentation: APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS.TOOLTIP,
            },
};

export function isRegistrationReviewPhase(phase: AppPhase): boolean {
    const phaseIndex = APP_PHASE_ORDER.indexOf(phase);

    return FIRST_REGISTRATION_REVIEW_PHASE_INDEX >= 0
        && phaseIndex >= FIRST_REGISTRATION_REVIEW_PHASE_INDEX;
}

export function resolveRegistrationReviewAccess(
    phase: AppPhase,
    hasEnteredRegistrationReviewPhase: boolean
): boolean {
    return hasEnteredRegistrationReviewPhase || isRegistrationReviewPhase(phase);
}

export function resolveAppPhaseNavigationPolicy({
    phase,
    canSubmitRegistration,
    canCompleteNodeComposition,
    hasEnteredRegistrationReviewPhase,
}: AppPhaseNavigationPolicyInput): AppPhaseNavigationPolicy {
    const previousPhase = getPreviousAppPhase(phase);
    const nextPhase = getNextAppPhase(phase);
    const isRegistrationSubmitPhase = phase === APP_PHASES.CYOA;
    const input = {
        phase,
        canSubmitRegistration,
        canCompleteNodeComposition,
        hasEnteredRegistrationReviewPhase,
    };
    const nextDisabledFeedback = NEXT_DISABLED_FEEDBACK_RESOLVERS[phase]?.(input);
    const isNextDisabled = nextDisabledFeedback !== undefined;
    const canReviewRegistration = resolveRegistrationReviewAccess(
        phase,
        hasEnteredRegistrationReviewPhase
    );

    const nextAction = resolveNextAction(isRegistrationSubmitPhase, isNextDisabled, nextPhase);

    return {
        previousPhase,
        nextPhase,
        canReviewRegistration,
        isNextDisabled,
        nextDisabledFeedback,
        nextAction,
        shouldRenderNavigation: Boolean(previousPhase || nextPhase),
    };
}

function resolveNextAction(
    isRegistrationSubmitPhase: boolean,
    isNextDisabled: boolean,
    nextPhase: AppPhase | undefined
): AppPhaseNavigationNextAction | undefined {
    if (!nextPhase || isNextDisabled) return undefined;

    return isRegistrationSubmitPhase
        ? APP_PHASE_NAVIGATION_NEXT_ACTIONS.OPEN_REGISTRATION_SUBMIT_DIALOG
        : APP_PHASE_NAVIGATION_NEXT_ACTIONS.MOVE_TO_NEXT_PHASE;
}
