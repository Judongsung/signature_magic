import type { AppPhase } from '../../constants/appPhaseConfigs';
import {
    getAppModeConfig,
    type AppMode,
} from '../../constants/appModeConfigs';

function getAppPhaseOffset(
    mode: AppMode,
    currentPhase: AppPhase,
    offset: number
): AppPhase | undefined {
    const phaseOrder = getAppModeConfig(mode).phaseOrder;
    const currentIndex = phaseOrder.indexOf(currentPhase);
    if (currentIndex < 0) return undefined;

    return phaseOrder[currentIndex + offset];
}

export function getPreviousAppPhase(
    mode: AppMode,
    currentPhase: AppPhase
): AppPhase | undefined {
    return getAppPhaseOffset(mode, currentPhase, -1);
}

export function getNextAppPhase(
    mode: AppMode,
    currentPhase: AppPhase
): AppPhase | undefined {
    return getAppPhaseOffset(mode, currentPhase, 1);
}
