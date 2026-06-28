import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import dialogueScriptsData from '../../../data/cyoaDialogueScripts.json';
import { CYOA_DIALOGUE_SCRIPT_IDS } from '../../../constants/cyoaConfigs';
import { DIALOGUE_SCREEN_TEXT, NODE_INTRO_DIALOGUE_SCREEN_TEXT } from '../../../constants/uiText';
import type { CyoaDialogueResultContext, CyoaDialogueScriptConfig } from '../../../types/cyoa';
import CyoaDialogueScreen from './CyoaDialogueScreen.svelte';

const NODE_RESULT_PLACEHOLDER_LINE = '추가 예정.';

function buttonTextPattern(label: string): RegExp {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return new RegExp(`<button[^>]*>\\s*${escapedLabel}\\s*<\\/button>`);
}

function getDialogueScript(scriptId: string): CyoaDialogueScriptConfig {
    const script = (dialogueScriptsData as CyoaDialogueScriptConfig[])
        .find(script => script.id === scriptId);
    expect(script).toBeDefined();

    return script as CyoaDialogueScriptConfig;
}

describe('CyoaDialogueScreen', () => {
    it('renders the NPC dialogue part without an internal continue action', () => {
        const { html } = render(CyoaDialogueScreen);

        expect(html).toContain('dialogue-script');
        expect(html).not.toContain(DIALOGUE_SCREEN_TEXT.CONTINUE_TO_CYOA);
    });

    it('renders the node composition handoff dialogue from the same screen component', () => {
        const introScript = getDialogueScript(CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_INTRO);
        const { html } = render(CyoaDialogueScreen, {
            props: {
                scriptId: CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_INTRO,
            },
        });

        expect(html).toContain(introScript.title);
        expect(html).toContain('시그니처 마법?');
        expect(html).toContain('마법에 대해');
        expect(html).toContain('이름이?');
        expect(html).toContain('luarn.webp');
        expect(html).not.toMatch(buttonTextPattern(NODE_INTRO_DIALOGUE_SCREEN_TEXT.CONTINUE_TO_NODE_COMPOSITION));
    });

    it('renders the node composition result dialogue with graph result context', () => {
        const resultContext = {
            circleCount: 0,
            totalStats: {
                castingTime: 0,
                instability: 0,
                power: 0,
                range: 0,
                manaCost: 0,
                duration: 0,
            },
        } satisfies CyoaDialogueResultContext;
        const resultScript = getDialogueScript(CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_RESULT);
        expect(typeof resultScript.defaultNpcLine).toBe('string');

        const { html } = render(CyoaDialogueScreen, {
            props: {
                scriptId: CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_RESULT,
                resultContext,
            },
        });

        expect(html).toContain(resultScript.title);
        expect(html).toContain(resultScript.defaultNpcLine as string);
        expect(html).not.toContain(NODE_RESULT_PLACEHOLDER_LINE);
    });
});
