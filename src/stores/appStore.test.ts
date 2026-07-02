import { afterEach, describe, expect, it } from 'vitest';
import { APP_PHASES } from '../constants/appPhaseConfigs';
import { APP_MODES } from '../constants/appModeConfigs';
import { appStore } from './appStore.svelte';

describe('appStore', () => {
    afterEach(() => {
        appStore.returnToTitle();
    });

    it('moves to the previous app phase when one exists', () => {
        appStore.startMode(APP_MODES.CYOA);
        appStore.setPhase(APP_PHASES.NODE_INTRO_DIALOGUE);

        appStore.moveToPreviousPhase();

        expect(appStore.phase).toBe(APP_PHASES.CYOA);
    });

    it('returns to the title from the first app phase', () => {
        appStore.startMode(APP_MODES.CYOA);

        appStore.moveToPreviousPhase();

        expect(appStore.mode).toBeUndefined();
        expect(appStore.phase).toBeUndefined();
    });

    it('moves to the next app phase when one exists', () => {
        appStore.startMode(APP_MODES.CYOA);
        appStore.setPhase(APP_PHASES.CYOA);

        appStore.moveToNextPhase();

        expect(appStore.phase).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
    });

    it('keeps the last app phase when moving forward without a target', () => {
        appStore.startMode(APP_MODES.CYOA);
        appStore.setPhase(APP_PHASES.NODE_RESULT_DIALOGUE);

        appStore.moveToNextPhase();

        expect(appStore.phase).toBe(APP_PHASES.NODE_RESULT_DIALOGUE);
    });

    it('uses the meta phase order and rejects phases outside the mode', () => {
        appStore.startMode(APP_MODES.META);

        expect(appStore.phase).toBe(APP_PHASES.NODE_COMPOSITION);

        appStore.setPhase(APP_PHASES.CYOA);
        expect(appStore.phase).toBe(APP_PHASES.NODE_COMPOSITION);

        appStore.moveToNextPhase();
        expect(appStore.phase).toBe(APP_PHASES.MAGIC_RESULT);
    });
});
