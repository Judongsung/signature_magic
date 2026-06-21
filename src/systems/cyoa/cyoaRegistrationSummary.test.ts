import { describe, expect, it } from 'vitest';
import type { CyoaChoiceRowData } from '../../types/cyoa';
import {
    buildCyoaRegistrationSummary,
    isCyoaRegistrationRequiredRow,
} from './cyoaRegistrationSummary';

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
    {
        id: 'optional',
        title: 'Optional',
        visible: true,
        selectable: true,
        requiredCount: 0,
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [
            {
                id: 'optional-choice',
                imageAlt: '',
                title: 'Optional choice',
            },
        ],
    },
];

describe('cyoaRegistrationSummary', () => {
    it('detects required registration rows', () => {
        expect(isCyoaRegistrationRequiredRow(rows[0])).toBe(true);
        expect(isCyoaRegistrationRequiredRow(rows[2])).toBe(false);
    });

    it('includes required rows before they are visible', () => {
        const summary = buildCyoaRegistrationSummary({
            rows,
            visibleRowIds: { name: false, region: false, optional: true },
            selectedChoiceIds: {},
            inputValues: {},
        });

        expect(summary.inputItems).toEqual([
            {
                id: 'name-input',
                label: 'Name',
                value: '',
                requiredMissing: true,
            },
        ]);
        expect(summary.choiceItems.map(item => item.id)).toEqual(['region', 'optional']);
        expect(summary.choiceItems[0]).toMatchObject({
            id: 'region',
            selections: [],
            requiredMissing: true,
        });
        expect(summary.choiceItems[1]).toMatchObject({
            id: 'optional',
            selections: [],
            requiredMissing: false,
        });
        expect(summary.signatureName).toBe('');
    });

    it('marks selected choices and filled inputs as complete', () => {
        const summary = buildCyoaRegistrationSummary({
            rows,
            visibleRowIds: { name: true, region: true, optional: false },
            selectedChoiceIds: { region: ['region-frontier'] },
            inputValues: { 'name-input': '  Arin  ' },
        });

        expect(summary.inputItems).toEqual([
            {
                id: 'name-input',
                label: 'Name',
                value: 'Arin',
                requiredMissing: false,
            },
        ]);
        expect(summary.choiceItems).toEqual([
            {
                id: 'region',
                title: 'Region',
                selections: [{
                    id: 'region-frontier',
                    titles: ['Frontier'],
                    requiredMissing: false,
                }],
                requiredMissing: false,
            },
        ]);
        expect(summary.signatureName).toBe(summary.inputItems[0].value);
    });

    it('builds parent and sub-choice paths and reports a missing required sub-choice', () => {
        const nestedRows: CyoaChoiceRowData[] = [{
            ...rows[1],
            choices: [{
                ...rows[1].choices[0],
                title: 'Academy',
                subChoiceGroup: {
                    id: 'academy-detail',
                    title: 'Academy detail',
                    requiredCount: 1,
                    selectionMode: 'single',
                    choices: [
                        { id: 'tower', imageAlt: '', title: 'Tower' },
                    ],
                },
            }],
        }];

        const missingSummary = buildCyoaRegistrationSummary({
            rows: nestedRows,
            visibleRowIds: { region: true },
            selectedChoiceIds: { region: ['region-frontier'] },
            inputValues: {},
        });
        expect(missingSummary.choiceItems[0]).toMatchObject({
            requiredMissing: true,
            selections: [{ titles: ['Academy'], requiredMissing: true }],
        });

        const completeSummary = buildCyoaRegistrationSummary({
            rows: nestedRows,
            visibleRowIds: { region: true },
            selectedChoiceIds: {
                region: ['region-frontier'],
                'academy-detail': ['tower'],
            },
            inputValues: {},
        });
        expect(completeSummary.choiceItems[0]).toMatchObject({
            requiredMissing: false,
            selections: [{ titles: ['Academy', 'Tower'], requiredMissing: false }],
        });
    });

    it('keeps a required marker when a multi-select sub-choice group is incomplete', () => {
        const nestedRows: CyoaChoiceRowData[] = [{
            ...rows[1],
            choices: [{
                ...rows[1].choices[0],
                title: 'Academy',
                subChoiceGroup: {
                    id: 'academy-detail',
                    title: 'Academy detail',
                    requiredCount: 2,
                    selectionMode: 'multi',
                    choices: [
                        { id: 'tower', imageAlt: '', title: 'Tower' },
                        { id: 'institute', imageAlt: '', title: 'Institute' },
                    ],
                },
            }],
        }];
        const summary = buildCyoaRegistrationSummary({
            rows: nestedRows,
            visibleRowIds: { region: true },
            selectedChoiceIds: {
                region: ['region-frontier'],
                'academy-detail': ['tower'],
            },
            inputValues: {},
        });

        expect(summary.choiceItems[0]).toMatchObject({
            requiredMissing: true,
            selections: [
                { titles: ['Academy', 'Tower'], requiredMissing: false },
                { titles: ['Academy'], requiredMissing: true },
            ],
        });
    });
});
