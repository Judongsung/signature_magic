import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { APP_PHASES } from '../../constants/gameConfigs';
import { DEV_PHASE_NAVIGATION_TEXT } from '../../constants/uiText';
import { appStore } from '../../stores/appStore.svelte';
import DevPhaseNavigation from './DevPhaseNavigation.svelte';

describe('DevPhaseNavigation', () => {
    it('renders every development phase and marks the current phase', () => {
        appStore.setPhase(APP_PHASES.CYOA);

        const { html } = render(DevPhaseNavigation);

        expect(html).toContain(DEV_PHASE_NAVIGATION_TEXT.ARIA_LABEL);
        expect(html).toContain(DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[APP_PHASES.INTRO_DIALOGUE]);
        expect(html).toContain(DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[APP_PHASES.CYOA]);
        expect(html).toContain(DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[APP_PHASES.NODE_COMPOSITION]);
        expect(html).toContain('disabled');
    });
});
