import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { CYOA_DIALOGUE_SCRIPT_IDS } from '../../../constants/gameConfigs';
import { DIALOGUE_SCREEN_TEXT, NODE_INTRO_DIALOGUE_SCREEN_TEXT } from '../../../constants/uiText';
import CyoaDialogueScreen from './CyoaDialogueScreen.svelte';

describe('CyoaDialogueScreen', () => {
    it('renders the NPC dialogue part without an internal continue action', () => {
        const { html } = render(CyoaDialogueScreen);

        expect(html).toContain('dialogue-script');
        expect(html).not.toContain(DIALOGUE_SCREEN_TEXT.CONTINUE_TO_CYOA);
    });

    it('renders the node composition handoff dialogue from the same screen component', () => {
        const { html } = render(CyoaDialogueScreen, {
            props: {
                scriptId: CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_INTRO,
            },
        });

        expect(html).toContain('시그니처 마법 시연');
        expect(html).toContain('시그니처 마법이란?');
        expect(html).toContain('연결은 어떤 의미인가요?');
        expect(html).toContain('이름이?');
        expect(html).toContain('luarn.webp');
        expect(html).not.toContain(NODE_INTRO_DIALOGUE_SCREEN_TEXT.CONTINUE_TO_NODE_COMPOSITION);
    });
});
