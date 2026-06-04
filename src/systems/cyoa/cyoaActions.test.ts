import { describe, expect, it } from 'vitest';
import type { CyoaChoiceRowData } from '../../types/cyoa';
import {
    canContinueCyoa,
    createInitialInputValues,
    createInitialRowVisibility,
    mapCyoaChoiceConfig,
    mapCyoaRows,
    resolveCyoaRowVisibility,
    toggleCyoaChoiceSelection,
} from './cyoaActions';

const rows: CyoaChoiceRowData[] = [
    {
        id: 'toc',
        title: 'Table of Contents',
        visible: true,
        selectable: true,
        requiredCount: 0,
        selectionMode: 'multi',
        layoutColumns: 1,
        choices: [
            { id: 'toc-region', imageAlt: '', title: 'Region', layoutSpan: 1 },
            { id: 'toc-catalyst', imageAlt: '', title: 'Catalyst', layoutSpan: 1 },
        ],
    },
    {
        id: 'region',
        title: 'Region',
        visible: false,
        visibleWhen: { choiceSelected: 'toc-region' },
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [
            { id: 'region-frontier', imageAlt: '', title: 'Frontier', layoutSpan: 1 },
        ],
    },
    {
        id: 'catalyst',
        title: 'Catalyst',
        visible: false,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [
            { id: 'catalyst-staff', imageAlt: '', title: 'Staff', layoutSpan: 1 },
        ],
    },
];

describe('cyoaActions', () => {
    it('maps choices through the configured image resolver', () => {
        expect(mapCyoaChoiceConfig(
            {
                id: 'choice',
                imageAlt: '',
                title: '',
                description: '',
                tooltip: 'More detail',
            },
            (imagePath) => imagePath ? '/resolved.webp' : undefined
        )).toMatchObject({
            imageSrc: undefined,
            tooltip: 'More detail',
            width: '1/3',
            layoutSpan: 1,
            statEffects: undefined,
        });
    });

    it('keeps configured stat effects on mapped choices', () => {
        expect(mapCyoaChoiceConfig(
            {
                id: 'choice',
                imageAlt: '',
                title: '',
                statEffects: [
                    { phase: 'node', operation: 'multiply', stat: 'instability', value: 0.9 },
                    { phase: 'final', operation: 'add', stat: 'power', value: 2 },
                ],
            },
            () => undefined
        )).toMatchObject({
            statEffects: [
                { phase: 'node', operation: 'multiply', stat: 'instability', value: 0.9 },
                { phase: 'final', operation: 'add', stat: 'power', value: 2 },
            ],
        });
    });

    it('maps choice widths into row grid spans', () => {
        const mapped = mapCyoaRows([
            {
                id: 'layout',
                title: 'Layout',
                description: 'Choose a layout.',
                choices: [
                    { id: 'a', imageAlt: '', title: '', description: '', width: '1/2' },
                    { id: 'b', imageAlt: '', title: '', description: '', width: '1/4' },
                    { id: 'c', imageAlt: '', title: '', description: '', width: '1/4' },
                ],
            },
        ], (imagePath) => imagePath ?? '/fallback.webp');

        expect(mapped[0].layoutColumns).toBe(4);
        expect(mapped[0].description).toBe('Choose a layout.');
        expect(mapped[0].choices.map(choice => choice.layoutSpan)).toEqual([2, 1, 1]);
    });

    it('creates initial row visibility from row config data and visibility conditions', () => {
        expect(createInitialRowVisibility(rows)).toEqual({
            toc: true,
            region: false,
            catalyst: false,
        });
    });

    it('creates initial values for input defaults', () => {
        const inputRows: CyoaChoiceRowData[] = [
            {
                ...rows[1],
                input: {
                    id: 'name',
                    label: 'Name',
                    defaultValue: 'Aurin',
                },
            },
        ];

        expect(createInitialInputValues(inputRows)).toEqual({ name: 'Aurin' });
    });

    it('opens rows through row visibility conditions', () => {
        expect(resolveCyoaRowVisibility(rows, { toc: ['toc-region'] })).toEqual({
            toc: true,
            region: true,
            catalyst: false,
        });
    });

    it('closes rows when row visibility conditions are no longer met', () => {
        expect(resolveCyoaRowVisibility(rows, { toc: [] })).toEqual({
            toc: true,
            region: false,
            catalyst: false,
        });
    });

    it('supports any-choice visibility conditions', () => {
        const conditionalRows = [
            {
                ...rows[1],
                visibleWhen: { anyChoiceSelected: ['toc-region', 'toc-catalyst'] },
            },
        ];

        expect(resolveCyoaRowVisibility(conditionalRows, { toc: ['toc-catalyst'] })).toEqual({
            region: true,
        });
    });

    it('supports all-choice visibility conditions', () => {
        const conditionalRows = [
            {
                ...rows[1],
                visibleWhen: { allChoicesSelected: ['toc-region', 'toc-catalyst'] },
            },
        ];

        expect(resolveCyoaRowVisibility(conditionalRows, { toc: ['toc-region'] })).toEqual({
            region: false,
        });
        expect(resolveCyoaRowVisibility(conditionalRows, { toc: ['toc-region', 'toc-catalyst'] })).toEqual({
            region: true,
        });
    });

    it('toggles selectable row choices', () => {
        const regionRow = rows[1];

        expect(toggleCyoaChoiceSelection(regionRow, {}, 'region-frontier')).toEqual({
            region: ['region-frontier'],
        });
        expect(toggleCyoaChoiceSelection(
            regionRow,
            { region: ['region-frontier'] },
            'region-frontier'
        )).toEqual({ region: [] });
    });

    it('supports multi-select rows for the table of contents', () => {
        const tocRow = rows[0];

        expect(toggleCyoaChoiceSelection(
            tocRow,
            { toc: ['toc-region'] },
            'toc-catalyst'
        )).toEqual({ toc: ['toc-region', 'toc-catalyst'] });
        expect(toggleCyoaChoiceSelection(
            tocRow,
            { toc: ['toc-region', 'toc-catalyst'] },
            'toc-region'
        )).toEqual({ toc: ['toc-catalyst'] });
    });

    it('requires every required selectable row before continuing regardless of visibility', () => {
        expect(canContinueCyoa(
            rows,
            { region: ['region-frontier'] }
        )).toBe(false);
        expect(canContinueCyoa(
            rows,
            { region: ['region-frontier'], catalyst: ['catalyst-staff'] }
        )).toBe(true);
    });

    it('requires input row values before continuing', () => {
        const inputRows: CyoaChoiceRowData[] = [
            {
                ...rows[1],
                input: {
                    id: 'name',
                    label: 'Name',
                },
            },
        ];

        expect(canContinueCyoa(inputRows, {}, {})).toBe(false);
        expect(canContinueCyoa(inputRows, {}, { name: 'Aurin' })).toBe(true);
    });

    it('supports minimum selection counts on multi-select rows', () => {
        const multiRows: CyoaChoiceRowData[] = [
            {
                ...rows[0],
                requiredCount: 2,
            },
        ];

        expect(canContinueCyoa(multiRows, { toc: ['toc-region'] })).toBe(false);
        expect(canContinueCyoa(multiRows, { toc: ['toc-region', 'toc-catalyst'] })).toBe(true);
    });
});
