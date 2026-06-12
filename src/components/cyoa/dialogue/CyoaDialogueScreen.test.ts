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
        expect(html).toContain('시그니처 마법?');
        expect(html).toContain('마법에 대해');
        expect(html).toContain('이름이?');
        expect(html).toContain('luarn.webp');
        expect(html).not.toContain(NODE_INTRO_DIALOGUE_SCREEN_TEXT.CONTINUE_TO_NODE_COMPOSITION);
    });

    it('renders the node composition result dialogue with graph result context', () => {
        const { html } = render(CyoaDialogueScreen, {
            props: {
                scriptId: CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_RESULT,
                resultContext: {
                    circleCount: 0,
                    totalStats: {
                        castingTime: 0,
                        instability: 0,
                        power: 0,
                        range: 0,
                        manaCost: 0,
                        duration: 0,
                    },
                },
            },
        });

        expect(html).toContain('시그니처 마법 평가');
        expect(html).toContain('아직 완성된 서클이 없네요.');
        expect(html).toContain('서클을 만들려면?');
    });
});
