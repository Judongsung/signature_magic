import {
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
    isWithinMaximumMana: boolean;
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
    [APP_PHASES.NODE_COMPOSITION]: ({
        canCompleteNodeComposition,
        isWithinMaximumMana,
    }) => {
        if (!canCompleteNodeComposition) {
            return {
                message: UI_BUTTON_TEXT.CREATE_MAGIC_CIRCLE_TOOLTIP,
                presentation: APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS.TOOLTIP,
            };
        }
        return isWithinMaximumMana
            ? undefined
            : {
                message: UI_BUTTON_TEXT.MAXIMUM_MANA_EXCEEDED_TOOLTIP,
                presentation: APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS.TOOLTIP,
            };
    },
};

export function resolveAppPhaseNavigationPolicy({
    phase,
    canSubmitRegistration,
    canCompleteNodeComposition,
    isWithinMaximumMana,
}: AppPhaseNavigationPolicyInput): AppPhaseNavigationPolicy {
    const previousPhase = getPreviousAppPhase(phase);
    const nextPhase = getNextAppPhase(phase);
    const isRegistrationSubmitPhase = phase === APP_PHASES.CYOA;
    const input = {
        phase,
        canSubmitRegistration,
        canCompleteNodeComposition,
        isWithinMaximumMana,
    };
    const nextDisabledFeedback = NEXT_DISABLED_FEEDBACK_RESOLVERS[phase]?.(input);
    const isNextDisabled = nextDisabledFeedback !== undefined;
    const canReviewRegistration = phase === APP_PHASES.NODE_RESULT_DIALOGUE;

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
