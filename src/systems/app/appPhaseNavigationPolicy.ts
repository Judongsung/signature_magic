import {
    APP_PHASES,
    type AppPhase,
} from '../../constants/appPhaseConfigs';
import {
    APP_MODES,
    getAppModeConfig,
    type AppMode,
} from '../../constants/appModeConfigs';
import { UI_BUTTON_TEXT } from '../../constants/uiText';
import { getNextAppPhase, getPreviousAppPhase } from './appPhaseNavigation';
import {
    MAGIC_GRAPH_COMPLETION_ISSUES,
    type MagicGraphCompletionIssue,
} from '../graph/calculation/magicCalculationTypes';

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
    mode: AppMode;
    phase: AppPhase;
    canSubmitRegistration: boolean;
    canCompleteNodeComposition: boolean;
    nodeCompositionCompletionIssue?: MagicGraphCompletionIssue;
    isWithinMaximumMana: boolean;
}

export interface AppPhaseNavigationPolicy {
    previousPhase: AppPhase | undefined;
    nextPhase: AppPhase | undefined;
    returnsToTitle: boolean;
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
        nodeCompositionCompletionIssue,
        isWithinMaximumMana,
    }) => {
        if (!canCompleteNodeComposition) {
            return {
                message: resolveMagicGraphCompletionMessage(
                    nodeCompositionCompletionIssue
                ),
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

const MAGIC_GRAPH_COMPLETION_MESSAGES = {
    [MAGIC_GRAPH_COMPLETION_ISSUES.NO_CALCULABLE_CIRCLE]:
        UI_BUTTON_TEXT.CREATE_MAGIC_CIRCLE_TOOLTIP,
    [MAGIC_GRAPH_COMPLETION_ISSUES.INVALID_CIRCLE]:
        UI_BUTTON_TEXT.INVALID_MAGIC_CIRCLE_TOOLTIP,
    [MAGIC_GRAPH_COMPLETION_ISSUES.INVALID_TOPOLOGY]:
        UI_BUTTON_TEXT.INVALID_MAGIC_FLOW_TOOLTIP,
    [MAGIC_GRAPH_COMPLETION_ISSUES.INCOMPLETE_FLOW]:
        UI_BUTTON_TEXT.INCOMPLETE_MAGIC_FLOW_TOOLTIP,
} as const satisfies Record<MagicGraphCompletionIssue, string>;

function resolveMagicGraphCompletionMessage(
    issue: MagicGraphCompletionIssue | undefined
): string {
    return MAGIC_GRAPH_COMPLETION_MESSAGES[
        issue ?? MAGIC_GRAPH_COMPLETION_ISSUES.NO_CALCULABLE_CIRCLE
    ];
}

export function resolveAppPhaseNavigationPolicy({
    mode,
    phase,
    canSubmitRegistration,
    canCompleteNodeComposition,
    nodeCompositionCompletionIssue,
    isWithinMaximumMana,
}: AppPhaseNavigationPolicyInput): AppPhaseNavigationPolicy {
    const modeConfig = getAppModeConfig(mode);
    const previousPhase = getPreviousAppPhase(mode, phase);
    const nextPhase = getNextAppPhase(mode, phase);
    const isRegistrationSubmitPhase = mode === APP_MODES.CYOA
        && phase === APP_PHASES.CYOA;
    const input = {
        mode,
        phase,
        canSubmitRegistration,
        canCompleteNodeComposition,
        nodeCompositionCompletionIssue,
        isWithinMaximumMana: !modeConfig.enforcesMaximumMana
            || isWithinMaximumMana,
    };
    const nextDisabledFeedback = NEXT_DISABLED_FEEDBACK_RESOLVERS[phase]?.(input);
    const isNextDisabled = nextDisabledFeedback !== undefined;
    const canReviewRegistration = mode === APP_MODES.CYOA
        && phase === APP_PHASES.NODE_RESULT_DIALOGUE;

    const nextAction = resolveNextAction(isRegistrationSubmitPhase, isNextDisabled, nextPhase);

    return {
        previousPhase,
        nextPhase,
        returnsToTitle: previousPhase === undefined,
        canReviewRegistration,
        isNextDisabled,
        nextDisabledFeedback,
        nextAction,
        shouldRenderNavigation: true,
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
