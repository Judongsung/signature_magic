import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { CYOA_DIALOGUE_TEXT_VARIANTS } from '../../../constants/gameConfigs';
import dialogueScriptsData from '../../../data/cyoaDialogueScripts.json';
import { mapCyoaDialogueScripts } from '../../../systems/cyoa/cyoaDialogueScripts';
import { resolveCyoaImagePath } from '../../../systems/cyoa/cyoaImageRegistry';
import type { CyoaDialogueScriptConfig, CyoaDialogueScriptData } from '../../../types/cyoa';
import { EMPTY_MAGIC_STATS } from '../../../types/magic';
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
        expect(html).toContain('등록 절차?');
        expect(html).toContain('이름?');
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

    it('uses the default NPC line when no result context is provided', () => {
        const { html } = render(CyoaDialogueScript, {
            props: {
                script: {
                    id: 'script',
                    title: '평가',
                    npcName: '루아른 오라이어',
                    npcTitle: '평가원',
                    imageAlt: '평가원',
                    defaultNpcLine: '기본 평가입니다.',
                    resultLines: [
                        {
                            when: { circleCount: { min: 1 } },
                            npcLine: '서클이 있습니다.',
                        },
                    ],
                    options: [],
                    optionRows: [],
                } satisfies CyoaDialogueScriptData,
            },
        });

        expect(html).toContain('기본 평가입니다.');
        expect(html).not.toContain('서클이 있습니다.');
    });

    it('uses matching result lines and result-gated option rows', () => {
        const { html } = render(CyoaDialogueScript, {
            props: {
                script: {
                    id: 'script',
                    title: '평가',
                    npcName: '루아른 오라이어',
                    npcTitle: '평가원',
                    imageAlt: '평가원',
                    defaultNpcLine: '기본 평가입니다.',
                    resultLines: [
                        {
                            when: { circleCount: { min: 1 } },
                            npcLine: '서클이 있습니다.',
                        },
                    ],
                    options: [],
                    optionRows: [
                        {
                            id: 'no-circle',
                            title: '',
                            visible: true,
                            selectable: true,
                            requiredCount: 0,
                            selectionMode: 'single',
                            layoutColumns: 3,
                            choices: [{ id: 'hidden', title: '숨김 질문', imageAlt: '', layoutSpan: 1 }],
                            resultWhen: { circleCount: { max: 0 } },
                            options: [],
                        },
                        {
                            id: 'has-circle',
                            title: '',
                            visible: true,
                            selectable: true,
                            requiredCount: 0,
                            selectionMode: 'single',
                            layoutColumns: 3,
                            choices: [{ id: 'visible', title: '평가 질문', imageAlt: '', layoutSpan: 1 }],
                            resultWhen: { circleCount: { min: 1 } },
                            options: [],
                        },
                    ],
                } satisfies CyoaDialogueScriptData,
                resultContext: {
                    circleCount: 1,
                    totalStats: EMPTY_MAGIC_STATS,
                },
            },
        });

        expect(html).toContain('서클이 있습니다.');
        expect(html).toContain('평가 질문');
        expect(html).not.toContain('숨김 질문');
    });
});
