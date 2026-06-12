import { describe, expect, it } from 'vitest';
import { APP_PHASES } from '../../constants/gameConfigs';
import { getNextAppPhase, getPreviousAppPhase } from './appPhaseNavigation';

describe('appPhaseNavigation', () => {
    it('resolves previous phases from the configured phase order', () => {
        expect(getPreviousAppPhase(APP_PHASES.INTRO_DIALOGUE)).toBeUndefined();
        expect(getPreviousAppPhase(APP_PHASES.CYOA)).toBe(APP_PHASES.INTRO_DIALOGUE);
        expect(getPreviousAppPhase(APP_PHASES.NODE_INTRO_DIALOGUE)).toBe(APP_PHASES.CYOA);
        expect(getPreviousAppPhase(APP_PHASES.NODE_COMPOSITION)).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
        expect(getPreviousAppPhase(APP_PHASES.NODE_RESULT_DIALOGUE)).toBe(APP_PHASES.NODE_COMPOSITION);
    });

    it('resolves next phases from the configured phase order', () => {
        expect(getNextAppPhase(APP_PHASES.INTRO_DIALOGUE)).toBe(APP_PHASES.CYOA);
        expect(getNextAppPhase(APP_PHASES.CYOA)).toBe(APP_PHASES.NODE_INTRO_DIALOGUE);
        expect(getNextAppPhase(APP_PHASES.NODE_INTRO_DIALOGUE)).toBe(APP_PHASES.NODE_COMPOSITION);
        expect(getNextAppPhase(APP_PHASES.NODE_COMPOSITION)).toBe(APP_PHASES.NODE_RESULT_DIALOGUE);
        expect(getNextAppPhase(APP_PHASES.NODE_RESULT_DIALOGUE)).toBeUndefined();
    });
});
