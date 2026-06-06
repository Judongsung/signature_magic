import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { CYOA_SCREEN_TEXT } from '../../constants/uiText';
import CyoaRegistrationScreen from './CyoaRegistrationScreen.svelte';

describe('CyoaRegistrationScreen', () => {
    it('renders the CYOA registration part without the NPC dialogue part', () => {
        const { html } = render(CyoaRegistrationScreen);

        expect(html).toContain(CYOA_SCREEN_TEXT.EYEBROW);
        expect(html).toContain('character-speech-bubble');
        expect(html).toContain('vera_chibi');
        expect(html).not.toContain('dialogue-script-title');
    });
});
