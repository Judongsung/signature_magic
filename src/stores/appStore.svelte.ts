import { APP_PHASES, type AppPhase } from '../constants/gameConfigs';
import { getNextAppPhase, getPreviousAppPhase } from '../systems/app/appPhaseNavigation';

function getInitialAppPhase(): AppPhase {
    let initialPhase: AppPhase = APP_PHASES.INTRO_DIALOGUE;

    if (__NODE_COMPOSITION_ONLY_BUILD__) {
        initialPhase = APP_PHASES.NODE_COMPOSITION;
    }

    return initialPhase;
}

class AppStore {
    phase = $state<AppPhase>(getInitialAppPhase());

    setPhase(phase: AppPhase): void {
        this.phase = phase;
    }

    moveToPreviousPhase(): void {
        const previousPhase = getPreviousAppPhase(this.phase);
        if (!previousPhase) return;

        this.phase = previousPhase;
    }

    moveToNextPhase(): void {
        const nextPhase = getNextAppPhase(this.phase);
        if (!nextPhase) return;

        this.phase = nextPhase;
    }
}

export const appStore = new AppStore();
