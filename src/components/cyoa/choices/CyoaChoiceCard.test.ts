import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CyoaChoiceCard from './CyoaChoiceCard.svelte';
import type { CyoaChoice } from '../../../types/cyoa';

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
        expect(html).toContain('image-placement-top');
        expect(html).toContain('선택지 제목');
        expect(html).toContain('선택지 상세 설명');
    });

    it('applies configured image size and placement classes', () => {
        const { html } = render(CyoaChoiceCard, {
            props: {
                choice: {
                    ...choice,
                    imageSize: 'large',
                    imagePlacement: 'top',
                },
            },
        });

        expect(html).toContain('image-size-large');
        expect(html).toContain('image-placement-top');
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

    it('renders optional tooltip without requiring visible description text', () => {
        const { html } = render(CyoaChoiceCard, {
            props: {
                choice: {
                    ...choice,
                    description: undefined,
                    tooltip: '툴팁 상세 설명',
                },
            },
        });

        expect(html).toContain('aria-describedby="choice-id-tooltip"');
        expect(html).toContain('툴팁 상세 설명');
        expect(html).toContain('without-description');
    });

    it('renders configured stat effects below the description', () => {
        const { html } = render(CyoaChoiceCard, {
            props: {
                choice,
                effectLabels: [
                    '노드 불안정성 ×0.9',
                    '행동 노드 마나 소모 −1',
                ],
            },
        });

        expect(html).toContain('aria-label="선택 효과"');
        expect(html).toContain('노드 불안정성 ×0.9');
        expect(html).toContain('행동 노드 마나 소모 −1');
    });

    it('marks sub-choice cards with their visual and accessible context', () => {
        const { html } = render(CyoaChoiceCard, {
            props: {
                choice,
                subChoice: true,
                ariaLabel: '학술기관 세부: 마탑',
            },
        });

        expect(html).toContain('sub-choice');
        expect(html).toContain('aria-label="학술기관 세부: 마탑"');
    });
});
