import { render } from 'svelte/server';
import { afterEach, describe, expect, it } from 'vitest';
import { APP_PHASES } from '../../constants/gameConfigs';
import {
    APP_PHASE_NAVIGATION_TEXT,
    UI_BUTTON_TEXT,
} from '../../constants/uiText';
import { appStore } from '../../stores/appStore.svelte';
import AppPhaseNavigationTabs from './AppPhaseNavigationTabs.svelte';

describe('AppPhaseNavigationTabs', () => {
    afterEach(() => {
        appStore.setPhase(APP_PHASES.INTRO_DIALOGUE);
    });

    it('renders only the next tab on the first phase', () => {
        appStore.setPhase(APP_PHASES.INTRO_DIALOGUE);

        const { html } = render(AppPhaseNavigationTabs);

        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.ARIA_LABEL);
        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.NEXT_LABELS[APP_PHASES.INTRO_DIALOGUE]);
        expect(html).not.toContain(UI_BUTTON_TEXT.REVIEW_REGISTRATION);
        expect(html).not.toContain(`>${APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL}</button>`);
    });

    it('renders previous and disabled next tabs on the incomplete CYOA phase', () => {
        appStore.setPhase(APP_PHASES.CYOA);

        const { html } = render(AppPhaseNavigationTabs, {
            props: {
                canSubmitRegistration: false,
            },
        });

        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL);
        expect(html).toContain(UI_BUTTON_TEXT.REVIEW_REGISTRATION);
        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.NEXT_LABELS[APP_PHASES.CYOA]);
        expect(html).toContain('disabled');
        expect(html).toContain('app-phase-next-disabled-tooltip');
        expect(html).toContain(UI_BUTTON_TEXT.COMPLETE_REQUIRED_FIELDS_TOOLTIP);
    });

    it('renders an enabled next tab on the complete CYOA phase', () => {
        appStore.setPhase(APP_PHASES.CYOA);

        const { html } = render(AppPhaseNavigationTabs, {
            props: {
                canSubmitRegistration: true,
            },
        });

        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL);
        expect(html).toContain(UI_BUTTON_TEXT.REVIEW_REGISTRATION);
        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.NEXT_LABELS[APP_PHASES.CYOA]);
        expect(html).not.toContain('disabled');
        expect(html).not.toContain('app-phase-next-disabled-tooltip');
    });

    it('renders the result dialogue next tab on the node composition phase', () => {
        appStore.setPhase(APP_PHASES.NODE_COMPOSITION);

        const { html } = render(AppPhaseNavigationTabs);

        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL);
        expect(html).toContain(UI_BUTTON_TEXT.REVIEW_REGISTRATION);
        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.NEXT_LABELS[APP_PHASES.NODE_COMPOSITION]);
    });

    it('renders only the previous tab on the final phase', () => {
        appStore.setPhase(APP_PHASES.NODE_RESULT_DIALOGUE);

        const { html } = render(AppPhaseNavigationTabs);

        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL);
        expect(html).toContain(UI_BUTTON_TEXT.REVIEW_REGISTRATION);
        expect(html).not.toContain(APP_PHASE_NAVIGATION_TEXT.NEXT_ARIA_LABEL);
    });
});
