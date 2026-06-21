import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { UI_BUTTON_TEXT } from '../../constants/uiText';
import type { CyoaChoiceRowData } from '../../types/cyoa';
import RegistrationSummary from './RegistrationSummary.svelte';

const rows: CyoaChoiceRowData[] = [
    {
        id: 'name',
        title: 'Name',
        visible: false,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        input: {
            id: 'name-input',
            label: 'Name',
        },
        choices: [],
    },
    {
        id: 'region',
        title: 'Region',
        visible: false,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [
            {
                id: 'region-frontier',
                imageAlt: '',
                title: 'Frontier',
            },
        ],
    },
];

describe('RegistrationSummary', () => {
    it('shows required rows before selection', () => {
        const { html } = render(RegistrationSummary, {
            props: {
                rows,
                visibleRowIds: { name: false, region: false },
                selectedChoiceIds: {},
                inputValues: {},
            },
        });

        expect(html).toContain('>Region</h4>');
        expect(html).toContain('required-missing');
    });

    it('renders the signature name in the document and submit action outside it', () => {
        const { html } = render(RegistrationSummary, {
            props: {
                rows,
                visibleRowIds: { name: true, region: false },
                selectedChoiceIds: {},
                inputValues: { 'name-input': 'Arin' },
                onSubmit: () => {},
                submitLabel: 'Submit',
            },
        });

        expect(html).toContain('signature-name');
        expect(html).toContain('>Arin</span>');
        expect(html.lastIndexOf('</section>')).toBeLessThan(html.indexOf('>Submit</button>'));
    });

    it('uses a provided title id for the summary document label', () => {
        const titleId = 'custom-registration-summary-title';
        const { html } = render(RegistrationSummary, {
            props: {
                rows,
                visibleRowIds: { name: false, region: false },
                selectedChoiceIds: {},
                inputValues: {},
                titleId,
            },
        });

        expect(html).toContain(`aria-labelledby="${titleId}"`);
        expect(html).toContain(`id="${titleId}"`);
    });

    it('shows a required-fields tooltip for the disabled submit action', () => {
        const { html } = render(RegistrationSummary, {
            props: {
                rows,
                visibleRowIds: { name: false, region: false },
                selectedChoiceIds: {},
                inputValues: {},
                onSubmit: () => {},
                submitLabel: 'Submit',
                submitDisabled: true,
            },
        });

        expect(html).toContain('tooltip-host');
        expect(html).toContain('registration-submit-disabled-tooltip');
        expect(html).toContain(UI_BUTTON_TEXT.COMPLETE_REQUIRED_FIELDS_TOOLTIP);
    });

});
