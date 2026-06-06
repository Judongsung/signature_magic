import { APP_PHASES, type AppPhase } from '../constants/gameConfigs';

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
}

export const appStore = new AppStore();
