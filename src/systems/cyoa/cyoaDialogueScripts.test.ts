import { describe, expect, it } from 'vitest';
import {
    clearCyoaDialogueSelectionsAfterRow,
    mapCyoaDialogueScriptConfig,
    resolveSelectedCyoaDialogueOption,
} from './cyoaDialogueScripts';

describe('cyoaDialogueScripts', () => {
    it('maps dialogue script config into runtime data and reusable choices', () => {
        const script = mapCyoaDialogueScriptConfig(
            {
                id: 'script',
                title: '등록 안내',
                npcName: '길드 접수원',
                npcTitle: '동부 지부',
                imagePath: '../assets/images/temp.webp',
                imageAlt: '접수원',
                defaultNpcLine: '기본 안내입니다.',
                optionRows: [
                    {
                        id: 'main',
                        options: [
                            {
                                id: 'question',
                                playerLine: '질문합니다.',
                                npcLine: '',
                            },
                        ],
                    },
                    {
                        id: 'follow-up-row',
                        visibleWhen: { choiceSelected: 'question' },
                        options: [
                            {
                                id: 'follow-up',
                                playerLine: '이어 묻습니다.',
                                npcLine: '이어 답변합니다.',
                                npcImagePath: '../assets/images/follow-up.webp',
                                npcImageAlt: '이어 답변하는 접수원',
                            },
                        ],
                    },
                ],
            },
            (imagePath) => imagePath ? '/resolved.webp' : undefined
        );

        expect(script.imageSrc).toBe('/resolved.webp');
        expect(script.options[0].choice).toMatchObject({
            id: 'question',
            title: '질문합니다.',
            layoutSpan: 1,
        });
        expect(script.optionRows[1].visibleWhen).toEqual({ choiceSelected: 'question' });
        expect(script.optionRows[1].options[0].choice).toMatchObject({
            id: 'follow-up',
            title: '이어 묻습니다.',
            layoutSpan: 1,
        });
        expect(script.optionRows[1].options[0].npcImageSrc).toBe('/resolved.webp');
    });

    it('resolves the latest visible selected option with an NPC line', () => {
        const script = mapCyoaDialogueScriptConfig(
            {
                id: 'script',
                title: '등록 안내',
                npcName: '길드 접수원',
                npcTitle: '동부 지부',
                imageAlt: '접수원',
                defaultNpcLine: '기본 안내입니다.',
                optionRows: [
                    {
                        id: 'main',
                        options: [
                            {
                                id: 'question',
                                playerLine: '질문합니다.',
                                npcLine: '첫 답변입니다.',
                            },
                        ],
                    },
                    {
                        id: 'follow-up-row',
                        visibleWhen: { choiceSelected: 'question' },
                        options: [
                            {
                                id: 'empty-follow-up',
                                playerLine: '이어 묻습니다.',
                                npcLine: '',
                            },
                            {
                                id: 'answered-follow-up',
                                playerLine: '다시 묻습니다.',
                                npcLine: '이어 답변합니다.',
                            },
                        ],
                    },
                ],
            },
            () => undefined
        );

        expect(resolveSelectedCyoaDialogueOption(
            script,
            {
                main: ['question'],
                'follow-up-row': ['answered-follow-up'],
            },
            {
                main: true,
                'follow-up-row': true,
            }
        )?.id).toBe('answered-follow-up');

        expect(resolveSelectedCyoaDialogueOption(
            script,
            {
                main: ['question'],
                'follow-up-row': ['empty-follow-up'],
            },
            {
                main: true,
                'follow-up-row': true,
            }
        )?.id).toBe('question');
    });

    it('clears selected dialogue options after the changed row', () => {
        const script = mapCyoaDialogueScriptConfig(
            {
                id: 'script',
                title: '등록 안내',
                npcName: '길드 접수원',
                npcTitle: '동부 지부',
                imageAlt: '접수원',
                defaultNpcLine: '기본 안내입니다.',
                optionRows: [
                    { id: 'main', options: [] },
                    { id: 'middle', options: [] },
                    { id: 'later', options: [] },
                ],
            },
            () => undefined
        );

        expect(clearCyoaDialogueSelectionsAfterRow(
            script.optionRows,
            {
                main: ['a'],
                middle: ['b'],
                later: ['c'],
            },
            'middle'
        )).toEqual({
            main: ['a'],
            middle: ['b'],
        });
    });
});
