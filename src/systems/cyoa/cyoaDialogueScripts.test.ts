import { describe, expect, it } from 'vitest';
import { mapCyoaDialogueScriptConfig } from './cyoaDialogueScripts';

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
});
