import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CyoaDialogueScript from './CyoaDialogueScript.svelte';

describe('CyoaDialogueScript', () => {
    it('renders guild receptionist script and player dialogue options', () => {
        const { html } = render(CyoaDialogueScript);

        expect(html).toContain('길드 접수원');
        expect(html).toContain('등록 안내');
        expect(html).toContain('마법사 등록은 왜 필요한가요?');
        expect(html).toContain('접수 절차를 알려주세요.');
        expect(html).toContain('이 도시의 길드는 어떤 곳인가요?');
    });
});
