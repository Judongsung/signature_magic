import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CyoaChoiceRow from './CyoaChoiceRow.svelte';
import type { CyoaChoice } from '../types/cyoa';

const choices: CyoaChoice[] = [
    {
        id: 'first',
        imageSrc: '/first.webp',
        imageAlt: '첫 번째 이미지',
        title: '첫 번째',
        description: '첫 번째 설명',
    },
    {
        id: 'second',
        imageSrc: '/second.webp',
        imageAlt: '두 번째 이미지',
        title: '두 번째',
        description: '두 번째 설명',
        disabled: true,
    },
];

describe('CyoaChoiceRow', () => {
    it('renders all choices in the row', () => {
        const { html } = render(CyoaChoiceRow, {
            props: { choices },
        });

        expect(html).toContain('첫 번째');
        expect(html).toContain('두 번째');
    });

    it('passes selected state to matching choice cards', () => {
        const { html } = render(CyoaChoiceRow, {
            props: { choices, selectedChoiceIds: ['first'] },
        });

        expect(html).toContain('aria-pressed="true"');
        expect(html).toContain('aria-pressed="false"');
    });

    it('keeps choice-level disabled state', () => {
        const { html } = render(CyoaChoiceRow, {
            props: { choices },
        });

        expect(html).toContain('disabled');
    });
});
