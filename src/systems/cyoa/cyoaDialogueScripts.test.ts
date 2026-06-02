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
                options: [
                    {
                        id: 'question',
                        playerLine: '질문합니다.',
                        npcLine: '답변합니다.',
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
    });
});
