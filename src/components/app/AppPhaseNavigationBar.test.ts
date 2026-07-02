import { render } from 'svelte/server';
import { afterEach, describe, expect, it } from 'vitest';
import { APP_PHASES } from '../../constants/appPhaseConfigs';
import { APP_MODES } from '../../constants/appModeConfigs';
import {
    APP_PHASE_NAVIGATION_TEXT,
    getAppPhaseNextLabel,
    UI_BUTTON_TEXT,
} from '../../constants/uiText';
import { appStore } from '../../stores/appStore.svelte';
import AppPhaseNavigationBar from './AppPhaseNavigationBar.svelte';

describe('AppPhaseNavigationBar', () => {
    afterEach(() => {
        appStore.returnToTitle();
    });

    it('renders title and next tabs on the first phase', () => {
        appStore.startMode(APP_MODES.CYOA);

        const { html } = render(AppPhaseNavigationBar);

        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.ARIA_LABEL);
        expect(html).toContain(getAppPhaseNextLabel(APP_MODES.CYOA, APP_PHASES.INTRO_DIALOGUE));
        expect(html).not.toContain(UI_BUTTON_TEXT.REVIEW_REGISTRATION);
        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.TITLE_LABEL);
    });

    it('renders previous and disabled next tabs on the incomplete CYOA phase', () => {
        appStore.startMode(APP_MODES.CYOA);
        appStore.setPhase(APP_PHASES.CYOA);

        const { html } = render(AppPhaseNavigationBar, {
            props: {
                canSubmitRegistration: false,
            },
        });

        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL);
        expect(html).not.toContain(UI_BUTTON_TEXT.REVIEW_REGISTRATION);
        expect(html).toContain(getAppPhaseNextLabel(APP_MODES.CYOA, APP_PHASES.CYOA));
        expect(html).toContain('disabled');
        expect(html).toContain('app-phase-next-disabled-tooltip');
        expect(html).toContain(UI_BUTTON_TEXT.COMPLETE_REQUIRED_FIELDS_TOOLTIP);
        expect(html).toContain('character-speech-bubble');
        expect(html).toContain('vera_chibi');
        expect(html).not.toContain('description-tooltip');
    });

    it('renders an enabled next tab on the complete CYOA phase', () => {
        appStore.startMode(APP_MODES.CYOA);
        appStore.setPhase(APP_PHASES.CYOA);

        const { html } = render(AppPhaseNavigationBar, {
            props: {
                canSubmitRegistration: true,
            },
        });

        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL);
        expect(html).not.toContain(UI_BUTTON_TEXT.REVIEW_REGISTRATION);
        expect(html).toContain(getAppPhaseNextLabel(APP_MODES.CYOA, APP_PHASES.CYOA));
        expect(html).not.toContain('disabled');
        expect(html).not.toContain('app-phase-next-disabled-tooltip');
    });

    it('renders a disabled next tab when node composition has no circles', () => {
        appStore.startMode(APP_MODES.CYOA);
        appStore.setPhase(APP_PHASES.NODE_COMPOSITION);

        const { html } = render(AppPhaseNavigationBar);

        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL);
        expect(html).not.toContain(UI_BUTTON_TEXT.REVIEW_REGISTRATION);
        expect(html).toContain(getAppPhaseNextLabel(APP_MODES.CYOA, APP_PHASES.NODE_COMPOSITION));
        expect(html).toContain('disabled');
        expect(html).toContain(UI_BUTTON_TEXT.CREATE_MAGIC_CIRCLE_TOOLTIP);
        expect(html).toContain('description-tooltip');
        expect(html).not.toContain('character-speech-bubble');
    });

    it('renders an enabled next tab when node composition has a circle', () => {
        appStore.startMode(APP_MODES.CYOA);
        appStore.setPhase(APP_PHASES.NODE_COMPOSITION);

        const { html } = render(AppPhaseNavigationBar, {
            props: {
                canCompleteNodeComposition: true,
            },
        });

        expect(html).toContain(getAppPhaseNextLabel(APP_MODES.CYOA, APP_PHASES.NODE_COMPOSITION));
        expect(html).not.toContain('disabled');
        expect(html).not.toContain(UI_BUTTON_TEXT.CREATE_MAGIC_CIRCLE_TOOLTIP);
    });

    it('renders the centered mana status and blocks completion when exceeded', () => {
        appStore.startMode(APP_MODES.CYOA);
        appStore.setPhase(APP_PHASES.NODE_COMPOSITION);

        const { html } = render(AppPhaseNavigationBar, {
            props: {
                canCompleteNodeComposition: true,
                showMaximumMana: true,
                manaCost: 105.5,
                maximumMana: 100,
                isWithinMaximumMana: false,
            },
        });

        expect(html).toContain('마나 소모 105.5');
        expect(html).toContain('최대 100');
        expect(html).toContain('mana-status');
        expect(html).toContain('exceeded');
        expect(html).toContain('disabled');
        expect(html).toContain(UI_BUTTON_TEXT.MAXIMUM_MANA_EXCEEDED_TOOLTIP);
    });

    it('renders the registration review and previous tabs on the final phase', () => {
        appStore.startMode(APP_MODES.CYOA);
        appStore.setPhase(APP_PHASES.NODE_RESULT_DIALOGUE);

        const { html } = render(AppPhaseNavigationBar);

        expect(html).toContain(APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL);
        expect(html).toContain(UI_BUTTON_TEXT.REVIEW_REGISTRATION);
        expect(html).not.toContain(APP_PHASE_NAVIGATION_TEXT.NEXT_ARIA_LABEL);
    });
});
