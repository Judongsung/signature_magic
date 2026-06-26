import { afterEach, describe, expect, it } from 'vitest';
import { APP_PHASES } from '../constants/appPhaseConfigs';
import { appStore } from './appStore.svelte';

describe('appStore', () => {
    afterEach(() => {
        appStore.setPhase(APP_PHASES.INTRO_DIALOGUE);
    });

    it('moves to the previous app phase when one exists', () => {
        appStore.setPhase(APP_PHASES.NODE_INTRO_DIALOGUE);

        appStore.moveToPreviousPhase();

        expect(appStore.phase).toBe(APP_PHASES.CYOA);
    });

    it('keeps the first app phase when moving backward without a target', () => {
        appStore.setPhase(APP_PHASES.INTRO_DIALOGUE);

        appStore.moveToPreviousPhase();

        expect(appStore.phase).toBe(APP_PHASES.INTRO_DIALOGUE);
    });

    it('moves to the next app phase when one exists', () => {
        appStore.setPhase(APP_PHASES.CYOA);

        appStore.moveToNextPhase();

        expect(appStore.phase).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
    });

    it('keeps the last app phase when moving forward without a target', () => {
        appStore.setPhase(APP_PHASES.NODE_RESULT_DIALOGUE);

        appStore.moveToNextPhase();

        expect(appStore.phase).toBe(APP_PHASES.NODE_RESULT_DIALOGUE);
    });
});
