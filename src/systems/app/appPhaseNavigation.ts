import type { AppPhase } from '../../constants/appPhaseConfigs';
import { APP_PHASE_ORDER } from '../../constants/appPhaseConfigs';

function getAppPhaseOffset(currentPhase: AppPhase, offset: number): AppPhase | undefined {
    const currentIndex = APP_PHASE_ORDER.indexOf(currentPhase);
    if (currentIndex < 0) return undefined;

    return APP_PHASE_ORDER[currentIndex + offset];
}

export function getPreviousAppPhase(currentPhase: AppPhase): AppPhase | undefined {
    return getAppPhaseOffset(currentPhase, -1);
}

export function getNextAppPhase(currentPhase: AppPhase): AppPhase | undefined {
    return getAppPhaseOffset(currentPhase, 1);
}
