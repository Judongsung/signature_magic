import { APP_PHASES, type AppPhase } from '../constants/gameConfigs';

class AppStore {
    phase = $state<AppPhase>(
        __NODE_COMPOSITION_ONLY_BUILD__ ? APP_PHASES.NODE_COMPOSITION : APP_PHASES.CYOA
    );

    setPhase(phase: AppPhase): void {
        this.phase = phase;
    }
}

export const appStore = new AppStore();
