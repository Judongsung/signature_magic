import { APP_PHASE_ORDER } from '../../constants/appPhaseConfigs';
import { APP_PHASES, type AppPhase } from '../../constants/gameConfigs';
import { getNextAppPhase, getPreviousAppPhase } from './appPhaseNavigation';

export const APP_PHASE_NAVIGATION_NEXT_ACTIONS = {
    MOVE_TO_NEXT_PHASE: 'moveToNextPhase',
    OPEN_REGISTRATION_SUBMIT_DIALOG: 'openRegistrationSubmitDialog',
} as const;

export type AppPhaseNavigationNextAction =
    (typeof APP_PHASE_NAVIGATION_NEXT_ACTIONS)[keyof typeof APP_PHASE_NAVIGATION_NEXT_ACTIONS];

export interface AppPhaseNavigationPolicyInput {
    phase: AppPhase;
    canSubmitRegistration: boolean;
    hasEnteredRegistrationReviewPhase: boolean;
    nodeCompositionOnlyBuild?: boolean;
}

export interface AppPhaseNavigationPolicy {
    previousPhase: AppPhase | undefined;
    nextPhase: AppPhase | undefined;
    canReviewRegistration: boolean;
    isNextDisabled: boolean;
    nextAction: AppPhaseNavigationNextAction | undefined;
    shouldRenderNavigation: boolean;
}

const FIRST_REGISTRATION_REVIEW_PHASE_INDEX = APP_PHASE_ORDER.indexOf(APP_PHASES.CYOA);

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
    hasEnteredRegistrationReviewPhase,
    nodeCompositionOnlyBuild = false,
}: AppPhaseNavigationPolicyInput): AppPhaseNavigationPolicy {
    const previousPhase = getPreviousAppPhase(phase);
    const nextPhase = getNextAppPhase(phase);
    const isRegistrationSubmitPhase = phase === APP_PHASES.CYOA;
    const isNextDisabled = isRegistrationSubmitPhase && !canSubmitRegistration;
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
        nextAction,
        shouldRenderNavigation: !nodeCompositionOnlyBuild && Boolean(previousPhase || nextPhase),
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
