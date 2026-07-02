import { render } from 'svelte/server';
import { afterEach, describe, expect, it } from 'vitest';
import { APP_PHASES } from '../../constants/appPhaseConfigs';
import { APP_MODES } from '../../constants/appModeConfigs';
import { DEV_PHASE_NAVIGATION_TEXT } from '../../constants/uiText';
import { appStore } from '../../stores/appStore.svelte';
import DevPhaseNavigation from './DevPhaseNavigation.svelte';

describe('DevPhaseNavigation', () => {
    afterEach(() => {
        appStore.returnToTitle();
    });

    it('renders every development phase and marks the current phase', () => {
        appStore.startMode(APP_MODES.CYOA);
        appStore.setPhase(APP_PHASES.CYOA);

        const { html } = render(DevPhaseNavigation);

        expect(html).toContain(DEV_PHASE_NAVIGATION_TEXT.ARIA_LABEL);
        expect(html).toContain(DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[APP_PHASES.INTRO_DIALOGUE]);
        expect(html).toContain(DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[APP_PHASES.CYOA]);
        expect(html).toContain(DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[APP_PHASES.NODE_INTRO_DIALOGUE]);
        expect(html).toContain(DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[APP_PHASES.NODE_COMPOSITION]);
        expect(html).toContain(DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[APP_PHASES.NODE_RESULT_DIALOGUE]);
        expect(html).toContain('disabled');
    });

    it('renders only the phases in meta mode', () => {
        appStore.startMode(APP_MODES.META);

        const { html } = render(DevPhaseNavigation);

        expect(html).toContain(
            DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[APP_PHASES.NODE_COMPOSITION]
        );
        expect(html).toContain(
            DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[APP_PHASES.MAGIC_RESULT]
        );
        expect(html).not.toContain(
            DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[APP_PHASES.CYOA]
        );
    });
});
