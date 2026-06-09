import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { APP_PHASES, CYOA_DIALOGUE_SCRIPT_IDS } from '../../../constants/gameConfigs';
import { DIALOGUE_SCREEN_TEXT } from '../../../constants/uiText';
import CyoaDialogueScreen from './CyoaDialogueScreen.svelte';

describe('CyoaDialogueScreen', () => {
    it('renders the NPC dialogue part with the CYOA continue action', () => {
        const { html } = render(CyoaDialogueScreen);

        expect(html).toContain('dialogue-script');
        expect(html).toContain(DIALOGUE_SCREEN_TEXT.CONTINUE_TO_CYOA);
    });

    it('renders the node composition handoff dialogue from the same screen component', () => {
        const { html } = render(CyoaDialogueScreen, {
            props: {
                scriptId: CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_INTRO,
                continueLabel: '비술 조합실로 이동',
                nextPhase: APP_PHASES.NODE_COMPOSITION,
            },
        });

        expect(html).toContain('시그니처 마법 시연');
        expect(html).toContain('시그니처 마법이란?');
        expect(html).toContain('연결은 어떤 의미인가요?');
        expect(html).toContain('이름이?');
        expect(html).toContain('luarn.webp');
        expect(html).toContain('비술 조합실로 이동');
    });
});
