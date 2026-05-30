import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CyoaTextInputRow from './CyoaTextInputRow.svelte';

describe('CyoaTextInputRow', () => {
    it('renders a labelled text input', () => {
        const { html } = render(CyoaTextInputRow, {
            props: {
                input: {
                    id: 'personal-name-input',
                    label: '이름',
                    placeholder: '이름 입력',
                },
                value: '아린',
            },
        });

        expect(html).toContain('for="personal-name-input"');
        expect(html).toContain('이름');
        expect(html).toContain('placeholder="이름 입력"');
        expect(html).toContain('value="아린"');
    });
});
