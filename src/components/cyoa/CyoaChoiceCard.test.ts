import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CyoaChoiceCard from './CyoaChoiceCard.svelte';
import type { CyoaChoice } from '../../types/cyoa';

const choice: CyoaChoice = {
    id: 'choice-id',
    imageSrc: '/images/choice.webp',
    imageAlt: '선택지 이미지',
    title: '선택지 제목',
    description: '선택지 상세 설명',
};

describe('CyoaChoiceCard', () => {
    it('renders image, title, and description', () => {
        const { html } = render(CyoaChoiceCard, {
            props: { choice },
        });

        expect(html).toContain('src="/images/choice.webp"');
        expect(html).toContain('alt="선택지 이미지"');
        expect(html).toContain('선택지 제목');
        expect(html).toContain('선택지 상세 설명');
    });

    it('marks selected state for assistive technology and styling', () => {
        const { html } = render(CyoaChoiceCard, {
            props: { choice, selected: true },
        });

        expect(html).toContain('aria-pressed="true"');
        expect(html).toContain('selected');
    });

    it('renders disabled choices as disabled buttons', () => {
        const { html } = render(CyoaChoiceCard, {
            props: { choice, disabled: true },
        });

        expect(html).toContain('disabled');
    });

    it('omits image frame when no image source exists', () => {
        const { html } = render(CyoaChoiceCard, {
            props: {
                choice: {
                    ...choice,
                    imageSrc: undefined,
                },
            },
        });

        expect(html).toContain('without-image');
        expect(html).not.toContain('<img');
    });
});
