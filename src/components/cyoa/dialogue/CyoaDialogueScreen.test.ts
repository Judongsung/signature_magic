import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { DIALOGUE_SCREEN_TEXT } from '../../../constants/uiText';
import CyoaDialogueScreen from './CyoaDialogueScreen.svelte';

describe('CyoaDialogueScreen', () => {
    it('renders the NPC dialogue part with the CYOA continue action', () => {
        const { html } = render(CyoaDialogueScreen);

        expect(html).toContain('dialogue-script');
        expect(html).toContain(DIALOGUE_SCREEN_TEXT.CONTINUE_TO_CYOA);
    });
});
