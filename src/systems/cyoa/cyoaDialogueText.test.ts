import { describe, expect, it } from 'vitest';
import { CYOA_DIALOGUE_TEXT_VARIANTS } from '../../constants/gameConfigs';
import {
    getCyoaDialogueLineText,
    normalizeCyoaDialogueLine,
} from './cyoaDialogueText';

describe('cyoaDialogueText', () => {
    it('normalizes a plain string into a single text segment', () => {
        expect(normalizeCyoaDialogueLine('기본 대사입니다.')).toEqual([
            { text: '기본 대사입니다.' },
        ]);
    });

    it('keeps segment order and variants when normalizing segment arrays', () => {
        const segments = [
            { text: '크게 말한다. ' },
            { text: '작게 중얼거린다.', variant: CYOA_DIALOGUE_TEXT_VARIANTS.MUMBLE },
        ];

        expect(normalizeCyoaDialogueLine(segments)).toBe(segments);
    });

    it('extracts plain text from all segments', () => {
        expect(getCyoaDialogueLineText([
            { text: '앞 문장. ' },
            { text: '속삭임.', variant: CYOA_DIALOGUE_TEXT_VARIANTS.MUMBLE },
            { text: ' 뒷 문장.' },
        ])).toBe('앞 문장. 속삭임. 뒷 문장.');
    });
});
