import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import type { CyoaChoiceRowData } from '../../../types/cyoa';
import CyoaRegistrationSummary from './CyoaRegistrationSummary.svelte';

const rows: CyoaChoiceRowData[] = [
    {
        id: 'toc',
        title: '목차',
        visible: true,
        selectable: true,
        requiredCount: 0,
        selectionMode: 'multi',
        layoutColumns: 1,
        choices: [
            {
                id: 'toc-region',
                imageAlt: '',
                title: '지역',
            },
        ],
    },
    {
        id: 'region',
        title: '지역',
        visible: false,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [
            {
                id: 'region-frontier',
                imageAlt: '',
                title: '변경 지대',
            },
        ],
    },
];

describe('CyoaRegistrationSummary', () => {
    it('hides the table of contents and shows required rows before selection', () => {
        const { html } = render(CyoaRegistrationSummary, {
            props: {
                rows,
                visibleRowIds: { toc: true, region: false },
                selectedChoiceIds: {},
                inputValues: {},
            },
        });

        expect(html).not.toContain('>목차</h4>');
        expect(html).toContain('>지역</h4>');
        expect(html).toContain('필수 사항');
        expect(html).toContain('required-missing');
    });
});
