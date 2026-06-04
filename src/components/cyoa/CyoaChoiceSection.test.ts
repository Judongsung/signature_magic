import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CyoaChoiceSection from './CyoaChoiceSection.svelte';
import type { CyoaChoiceRowData } from '../../types/cyoa';

const row: CyoaChoiceRowData = {
    id: 'region',
    title: '지역',
    description: 'Region row description',
    visible: true,
    selectable: true,
    requiredCount: 1,
    selectionMode: 'single',
    layoutColumns: 1,
    choices: [
        {
            id: 'region-frontier',
            imageSrc: '/frontier.webp',
            imageAlt: '미개척지 이미지',
            title: '미개척지',
            description: '미개척지 설명',
        },
    ],
};

describe('CyoaChoiceSection', () => {
    it('renders a labelled section with its choices', () => {
        const { html } = render(CyoaChoiceSection, {
            props: { row },
        });

        expect(html).toContain('aria-labelledby="choice-row-region"');
        expect(html).toContain('id="choice-row-region"');
        expect(html).toContain('Region row description');
        expect(html).toContain('지역');
        expect(html).toContain('미개척지');
    });
});
