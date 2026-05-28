import { APP_PHASES, type AppPhase } from '../constants/gameConfigs';

class AppStore {
    phase = $state<AppPhase>(APP_PHASES.CYOA);

    setPhase(phase: AppPhase): void {
        this.phase = phase;
    }
}

export const appStore = new AppStore();
