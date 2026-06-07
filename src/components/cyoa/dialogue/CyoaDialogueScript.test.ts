import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CyoaDialogueScript from './CyoaDialogueScript.svelte';

describe('CyoaDialogueScript', () => {
    it('renders guild receptionist script and player dialogue options', () => {
        const { html } = render(CyoaDialogueScript);

        expect(html).toContain('베라 클로비스');
        expect(html).toContain('등록 안내');
        expect(html).toContain('어서 오세요.');
        expect(html).toContain('마법사 길드는 뭐하는 곳인가요?');
        expect(html).toContain('접수 절차를 알려주세요.');
        expect(html).toContain('이름이 어떻게 되시나요?');
        expect(html).not.toContain('길드가 맡는 업무를 알고 싶어요.');
        expect(html).not.toContain('aria-pressed="true"');
    });
});
