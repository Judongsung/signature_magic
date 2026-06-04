import { describe, expect, it } from 'vitest';
import type { CyoaChoiceRowData } from '../../types/cyoa';
import {
    buildCyoaRegistrationSummary,
    isCyoaRegistrationRequiredRow,
} from './cyoaRegistrationSummary';

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
        id: 'name',
        title: '이름',
        visible: false,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        input: {
            id: 'name-input',
            label: '이름',
        },
        choices: [],
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
    {
        id: 'optional',
        title: '선택 항목',
        visible: true,
        selectable: true,
        requiredCount: 0,
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [
            {
                id: 'optional-choice',
                imageAlt: '',
                title: '선택지',
            },
        ],
    },
];

describe('cyoaRegistrationSummary', () => {
    it('detects required registration rows', () => {
        expect(isCyoaRegistrationRequiredRow(rows[0])).toBe(false);
        expect(isCyoaRegistrationRequiredRow(rows[1])).toBe(true);
    });

    it('excludes table of contents and includes required rows before they are visible', () => {
        const summary = buildCyoaRegistrationSummary({
            rows,
            visibleRowIds: { toc: true, name: false, region: false, optional: true },
            selectedChoiceIds: {},
            inputValues: {},
        });

        expect(summary.inputItems).toEqual([
            {
                id: 'name-input',
                label: '이름',
                value: '',
                requiredMissing: true,
            },
        ]);
        expect(summary.choiceItems.map(item => item.id)).toEqual(['region', 'optional']);
        expect(summary.choiceItems[0]).toMatchObject({
            id: 'region',
            choices: [],
            requiredMissing: true,
        });
        expect(summary.choiceItems[1]).toMatchObject({
            id: 'optional',
            choices: [],
            requiredMissing: false,
        });
        expect(summary.signatureName).toBe('');
    });

    it('marks selected choices and filled inputs as complete', () => {
        const summary = buildCyoaRegistrationSummary({
            rows,
            visibleRowIds: { toc: true, name: true, region: true, optional: false },
            selectedChoiceIds: { region: ['region-frontier'] },
            inputValues: { 'name-input': '  아린  ' },
        });

        expect(summary.inputItems).toEqual([
            {
                id: 'name-input',
                label: '이름',
                value: '아린',
                requiredMissing: false,
            },
        ]);
        expect(summary.choiceItems).toEqual([
            {
                id: 'region',
                title: '지역',
                choices: [rows[2].choices[0]],
                requiredMissing: false,
            },
        ]);
        expect(summary.signatureName).toBe(summary.inputItems[0].value);
    });
});
