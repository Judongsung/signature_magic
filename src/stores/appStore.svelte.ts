import { APP_PHASES, type AppPhase } from '../constants/appPhaseConfigs';
import { getNextAppPhase, getPreviousAppPhase } from '../systems/app/appPhaseNavigation';

class AppStore {
    phase = $state<AppPhase>(APP_PHASES.INTRO_DIALOGUE);

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
