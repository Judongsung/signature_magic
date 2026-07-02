import { type AppPhase } from '../constants/appPhaseConfigs';
import {
    getInitialAppPhase,
    isAppPhaseInMode,
    type AppMode,
} from '../constants/appModeConfigs';
import { getNextAppPhase, getPreviousAppPhase } from '../systems/app/appPhaseNavigation';

class AppStore {
    mode = $state<AppMode | undefined>();
    phase = $state<AppPhase | undefined>();

    startMode(mode: AppMode): void {
        this.mode = mode;
        this.phase = getInitialAppPhase(mode);
    }

    returnToTitle(): void {
        this.mode = undefined;
        this.phase = undefined;
    }

    setPhase(phase: AppPhase): void {
        if (!this.mode || !isAppPhaseInMode(this.mode, phase)) return;
        this.phase = phase;
    }

    moveToPreviousPhase(): void {
        if (!this.mode || !this.phase) return;

        const previousPhase = getPreviousAppPhase(
            this.mode,
            this.phase
        );
        if (!previousPhase) {
            this.returnToTitle();
            return;
        }

        this.phase = previousPhase;
    }

    moveToNextPhase(): void {
        if (!this.mode || !this.phase) return;

        const nextPhase = getNextAppPhase(this.mode, this.phase);
        if (!nextPhase) return;

        this.phase = nextPhase;
    }
}

export const appStore = new AppStore();
