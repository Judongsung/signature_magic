import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { APP_MODES } from '../../constants/appModeConfigs';
import { APP_TITLE_TEXT } from '../../constants/uiText';
import { MAGIC_CANVAS_BACKGROUND } from '../../constants/magicCanvasAssets';
import AppTitleScreen from './AppTitleScreen.svelte';

describe('AppTitleScreen', () => {
    it('renders a two-line title, decorative circle, and vertical mode menu', () => {
        const { html } = render(AppTitleScreen, {
            props: {
                onSelectMode: vi.fn(),
            },
        });

        expect(html).toContain(APP_TITLE_TEXT.TITLE);
        expect(html).toContain(APP_TITLE_TEXT.MODES[APP_MODES.CYOA].TITLE);
        expect(html).toContain(APP_TITLE_TEXT.MODES[APP_MODES.META].TITLE);
        expect(html.match(/<button/g)).toHaveLength(2);
        expect(html).toContain('class="mode-menu ');
        expect(html).toContain('class="title-circle ');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain('data-animation-mode="loop"');
        expect(html).toContain(MAGIC_CANVAS_BACKGROUND.IMAGE_URL);
        expect(html).not.toContain('tabindex="-1"');
    });

    it('moves mode descriptions into accessible tooltips', () => {
        const { html } = render(AppTitleScreen, {
            props: {
                onSelectMode: vi.fn(),
            },
        });

        expect(html.match(/role="tooltip"/g)).toHaveLength(2);
        expect(html.match(/aria-describedby=/g)).toHaveLength(2);
        expect(html.match(/data-effective-placement="bottom"/g)).toHaveLength(2);
        expect(html).toContain(APP_TITLE_TEXT.MODES[APP_MODES.CYOA].DESCRIPTION);
        expect(html).toContain(APP_TITLE_TEXT.MODES[APP_MODES.META].DESCRIPTION);
        expect(html).not.toContain('mode-description');
    });
});
