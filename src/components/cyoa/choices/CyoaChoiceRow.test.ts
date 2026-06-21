import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CyoaChoiceRow from './CyoaChoiceRow.svelte';
import type { CyoaChoice } from '../../../types/cyoa';

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

    it('applies row column and choice span layout values', () => {
        const { html } = render(CyoaChoiceRow, {
            props: {
                layoutColumns: 3,
                choices: [
                    { ...choices[0], layoutSpan: 1 },
                    { ...choices[1], layoutSpan: 2 },
                ],
            },
        });

        expect(html).toContain('--layout-columns: 3');
        expect(html).toContain('--layout-span: 2');
    });

    it('inserts styled sub-choices immediately after the selected parent', () => {
        const nestedChoices: CyoaChoice[] = [
            {
                ...choices[0],
                subChoiceGroup: {
                    id: 'first-detail',
                    title: '첫 번째 세부',
                    requiredCount: 1,
                    selectionMode: 'single',
                    choices: [
                        { id: 'first-child', imageAlt: '', title: '첫 번째 하위' },
                    ],
                },
            },
            choices[1],
        ];
        const { html } = render(CyoaChoiceRow, {
            props: {
                choices: nestedChoices,
                selectedChoiceIds: ['first'],
                subChoiceSelections: { 'first-detail': ['first-child'] },
            },
        });

        expect(html.indexOf('첫 번째 하위')).toBeGreaterThan(html.indexOf('첫 번째 설명'));
        expect(html.indexOf('두 번째 설명')).toBeGreaterThan(html.indexOf('첫 번째 하위'));
        expect(html).toContain('sub-choice-row-item');
        expect(html).toContain('selected sub-choice');
        expect(html).toContain('aria-label="첫 번째 세부: 첫 번째 하위"');
    });
});
