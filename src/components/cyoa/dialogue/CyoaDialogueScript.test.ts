import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { CYOA_DIALOGUE_TEXT_VARIANTS } from '../../../constants/gameConfigs';
import dialogueScriptsData from '../../../data/cyoaDialogueScripts.json';
import { mapCyoaDialogueScripts } from '../../../systems/cyoa/cyoaDialogueScripts';
import { resolveCyoaImagePath } from '../../../systems/cyoa/cyoaImageRegistry';
import type { CyoaDialogueScriptConfig, CyoaDialogueScriptData } from '../../../types/cyoa';
import CyoaDialogueScript from './CyoaDialogueScript.svelte';

const [guildReceptionScript] = mapCyoaDialogueScripts(
    dialogueScriptsData as CyoaDialogueScriptConfig[],
    resolveCyoaImagePath
);

describe('CyoaDialogueScript', () => {
    it('renders guild receptionist script and player dialogue options', () => {
        const { html } = render(CyoaDialogueScript, {
            props: { script: guildReceptionScript },
        });

        expect(html).toContain('베라 클로비스');
        expect(html).toContain('등록 안내');
        expect(html).toContain('어서 오세요.');
        expect(html).toContain('마법사 길드?');
        expect(html).toContain('접수 절차?');
        expect(html).toContain('이름이 어떻게 되시나요?');
        expect(html).not.toContain('길드가 맡는 업무를 알고 싶어요.');
        expect(html).not.toContain('aria-pressed="true"');
    });

    it('renders mumble dialogue segments with the segment style class', () => {
        const { html } = render(CyoaDialogueScript, {
            props: {
                script: {
                    id: 'script',
                    title: '시그니처 마법 시연',
                    npcName: '루아른 오라이어',
                    npcTitle: '시그니처 마법 평가원',
                    imageAlt: '평가원',
                    defaultNpcLine: [
                        { text: '크게 말합니다. ' },
                        {
                            text: '작게 중얼거립니다.',
                            variant: CYOA_DIALOGUE_TEXT_VARIANTS.MUMBLE,
                        },
                    ],
                    options: [],
                    optionRows: [],
                } satisfies CyoaDialogueScriptData,
            },
        });

        expect(html).toContain('크게 말합니다.');
        expect(html).toContain('작게 중얼거립니다.');
        expect(html).toContain('npc-line-segment--mumble');
    });
});
