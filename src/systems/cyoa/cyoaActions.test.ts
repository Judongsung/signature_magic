import { describe, expect, it } from 'vitest';
import type { CyoaChoiceRowData } from '../../types/cyoa';
import {
    canSubmitCyoaRegistration,
    clearInactiveCyoaSubChoiceSelections,
    createInitialCyoaSelections,
    createInitialInputValues,
    createInitialRowVisibility,
    mapCyoaChoiceConfig,
    mapCyoaRows,
    resolveCyoaRowVisibility,
    toggleCyoaChoiceSelection,
} from './cyoaActions';

const rows: CyoaChoiceRowData[] = [
    {
        id: 'focus',
        title: 'Focus',
        visible: true,
        selectable: true,
        requiredCount: 0,
        selectionMode: 'multi',
        layoutColumns: 1,
        choices: [
            { id: 'focus-region', imageAlt: '', title: 'Region', layoutSpan: 1 },
            { id: 'focus-catalyst', imageAlt: '', title: 'Catalyst', layoutSpan: 1 },
        ],
    },
    {
        id: 'region',
        title: 'Region',
        visible: false,
        visibleWhen: { choiceSelected: 'focus-region' },
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

function createLockedRegionRows(): CyoaChoiceRowData[] {
    return mapCyoaRows([
        {
            id: 'region',
            title: 'Region',
            selectionMode: 'multi',
            requiredCount: 1,
            maxSelectedCount: 2,
            lockedChoiceIds: ['region-empire-center'],
            choices: [
                { id: 'region-empire-center', imageAlt: '', title: 'Empire Center' },
                { id: 'region-university-city', imageAlt: '', title: 'University City' },
                { id: 'region-eastern-desert', imageAlt: '', title: 'Eastern Desert' },
            ],
        },
    ], () => undefined);
}

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
            imageSize: 'default',
            imagePlacement: 'top',
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
                npcDescription: 'NPC explains the layout.',
                choices: [
                    { id: 'a', imageAlt: '', title: '', description: '', width: '1/2' },
                    {
                        id: 'b',
                        imageAlt: '',
                        imageSize: 'large',
                        imagePlacement: 'top',
                        title: '',
                        description: '',
                        width: '1/4',
                    },
                    { id: 'c', imageAlt: '', title: '', description: '', width: '1/4' },
                ],
            },
        ], (imagePath) => imagePath ?? '/fallback.webp');

        expect(mapped[0].layoutColumns).toBe(4);
        expect(mapped[0].description).toBe('Choose a layout.');
        expect(mapped[0].npcDescription).toBe('NPC explains the layout.');
        expect(mapped[0].choices.map(choice => choice.layoutSpan)).toEqual([2, 1, 1]);
        expect(mapped[0].choices[1]).toMatchObject({
            imageSize: 'large',
            imagePlacement: 'top',
        });
    });

    it('maps sub-choices with shared row columns and group defaults', () => {
        const [mapped] = mapCyoaRows([
            {
                id: 'affiliation',
                title: 'Affiliation',
                choices: [
                    {
                        id: 'academy',
                        imageAlt: '',
                        title: 'Academy',
                        width: '1/2',
                        subChoiceGroup: {
                            id: 'academy-detail',
                            title: 'Academy detail',
                            choices: [
                                { id: 'tower', imageAlt: '', title: 'Tower', width: '1/4' },
                            ],
                        },
                    },
                ],
            },
        ], () => undefined);

        expect(mapped.layoutColumns).toBe(4);
        expect(mapped.choices[0].layoutSpan).toBe(2);
        expect(mapped.choices[0].subChoiceGroup).toMatchObject({
            id: 'academy-detail',
            requiredCount: 1,
            selectionMode: 'single',
            choices: [{ id: 'tower', layoutSpan: 1 }],
        });
    });

    it('maps row selection policy for locked and maximum selections', () => {
        const [mapped] = createLockedRegionRows();

        expect(mapped).toMatchObject({
            requiredCount: 1,
            maxSelectedCount: 2,
            lockedChoiceIds: ['region-empire-center'],
            selectionMode: 'multi',
        });
    });

    it('creates initial row visibility from row config data and visibility conditions', () => {
        expect(createInitialRowVisibility(rows)).toEqual({
            focus: true,
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

    it('creates initial selections from locked choices', () => {
        expect(createInitialCyoaSelections(createLockedRegionRows())).toEqual({
            region: ['region-empire-center'],
        });
    });

    it('opens rows through row visibility conditions', () => {
        expect(resolveCyoaRowVisibility(rows, { focus: ['focus-region'] })).toEqual({
            focus: true,
            region: true,
            catalyst: false,
        });
    });

    it('matches visibility conditions against selected choices from any selection group', () => {
        const conditionalRows = [
            {
                ...rows[2],
                visibleWhen: { choiceSelected: 'region-frontier' },
            },
        ];

        expect(resolveCyoaRowVisibility(conditionalRows, { region: ['region-frontier'] })).toEqual({
            catalyst: true,
        });
    });

    it('closes rows when row visibility conditions are no longer met', () => {
        expect(resolveCyoaRowVisibility(rows, { focus: [] })).toEqual({
            focus: true,
            region: false,
            catalyst: false,
        });
    });

    it('supports any-choice visibility conditions', () => {
        const conditionalRows = [
            {
                ...rows[1],
                visibleWhen: { anyChoiceSelected: ['focus-region', 'focus-catalyst'] },
            },
        ];

        expect(resolveCyoaRowVisibility(conditionalRows, { focus: ['focus-catalyst'] })).toEqual({
            region: true,
        });
    });

    it('supports all-choice visibility conditions', () => {
        const conditionalRows = [
            {
                ...rows[1],
                visibleWhen: { allChoicesSelected: ['focus-region', 'focus-catalyst'] },
            },
        ];

        expect(resolveCyoaRowVisibility(conditionalRows, { focus: ['focus-region'] })).toEqual({
            region: false,
        });
        expect(resolveCyoaRowVisibility(conditionalRows, { focus: ['focus-region', 'focus-catalyst'] })).toEqual({
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

    it('supports multi-select rows', () => {
        const focusRow = rows[0];

        expect(toggleCyoaChoiceSelection(
            focusRow,
            { focus: ['focus-region'] },
            'focus-catalyst'
        )).toEqual({ focus: ['focus-region', 'focus-catalyst'] });
        expect(toggleCyoaChoiceSelection(
            focusRow,
            { focus: ['focus-region', 'focus-catalyst'] },
            'focus-region'
        )).toEqual({ focus: ['focus-catalyst'] });
    });

    it('keeps locked choices selected while allowing one replaceable optional choice', () => {
        const [regionRow] = createLockedRegionRows();
        const initialSelections = createInitialCyoaSelections([regionRow]);

        expect(toggleCyoaChoiceSelection(
            regionRow,
            initialSelections,
            'region-empire-center'
        )).toEqual({ region: ['region-empire-center'] });

        expect(toggleCyoaChoiceSelection(
            regionRow,
            initialSelections,
            'region-university-city'
        )).toEqual({ region: ['region-empire-center', 'region-university-city'] });

        expect(toggleCyoaChoiceSelection(
            regionRow,
            { region: ['region-empire-center', 'region-university-city'] },
            'region-eastern-desert'
        )).toEqual({ region: ['region-empire-center', 'region-eastern-desert'] });

        expect(toggleCyoaChoiceSelection(
            regionRow,
            { region: ['region-empire-center', 'region-eastern-desert'] },
            'region-eastern-desert'
        )).toEqual({ region: ['region-empire-center'] });
    });

    it('requires every required selectable row before continuing regardless of visibility', () => {
        expect(canSubmitCyoaRegistration(
            rows,
            { region: ['region-frontier'] }
        )).toBe(false);
        expect(canSubmitCyoaRegistration(
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

        expect(canSubmitCyoaRegistration(inputRows, {}, {})).toBe(false);
        expect(canSubmitCyoaRegistration(inputRows, {}, { name: 'Aurin' })).toBe(true);
    });

    it('supports minimum selection counts on multi-select rows', () => {
        const multiRows: CyoaChoiceRowData[] = [
            {
                ...rows[0],
                requiredCount: 2,
            },
        ];

        expect(canSubmitCyoaRegistration(multiRows, { focus: ['focus-region'] })).toBe(false);
        expect(canSubmitCyoaRegistration(multiRows, { focus: ['focus-region', 'focus-catalyst'] })).toBe(true);
    });

    it('treats locked default selections as satisfying required row counts', () => {
        const lockedRegionRows = createLockedRegionRows();

        expect(canSubmitCyoaRegistration(
            lockedRegionRows,
            createInitialCyoaSelections(lockedRegionRows)
        )).toBe(true);
    });

    it('requires only active required sub-choice groups', () => {
        const nestedRows = mapCyoaRows([
            {
                id: 'affiliation',
                title: 'Affiliation',
                choices: [
                    {
                        id: 'academy',
                        imageAlt: '',
                        title: 'Academy',
                        subChoiceGroup: {
                            id: 'academy-detail',
                            title: 'Academy detail',
                            requiredCount: 1,
                            choices: [
                                { id: 'tower', imageAlt: '', title: 'Tower' },
                            ],
                        },
                    },
                    { id: 'independent', imageAlt: '', title: 'Independent' },
                ],
            },
        ], () => undefined);

        expect(canSubmitCyoaRegistration(nestedRows, { affiliation: ['academy'] })).toBe(false);
        expect(canSubmitCyoaRegistration(nestedRows, {
            affiliation: ['academy'],
            'academy-detail': ['tower'],
        })).toBe(true);
        expect(canSubmitCyoaRegistration(nestedRows, { affiliation: ['independent'] })).toBe(true);
    });

    it('allows active optional sub-choice groups without a selection', () => {
        const nestedRows = mapCyoaRows([
            {
                id: 'affiliation',
                title: 'Affiliation',
                choices: [
                    {
                        id: 'academy',
                        imageAlt: '',
                        title: 'Academy',
                        subChoiceGroup: {
                            id: 'academy-detail',
                            title: 'Academy detail',
                            requiredCount: 0,
                            choices: [
                                { id: 'tower', imageAlt: '', title: 'Tower' },
                            ],
                        },
                    },
                ],
            },
        ], () => undefined);

        expect(canSubmitCyoaRegistration(nestedRows, { affiliation: ['academy'] })).toBe(true);
    });

    it('clears sub-choice state when its parent becomes inactive', () => {
        const nestedRows = mapCyoaRows([
            {
                id: 'affiliation',
                title: 'Affiliation',
                choices: [
                    {
                        id: 'academy',
                        imageAlt: '',
                        title: 'Academy',
                        subChoiceGroup: {
                            id: 'academy-detail',
                            title: 'Academy detail',
                            choices: [
                                { id: 'tower', imageAlt: '', title: 'Tower' },
                            ],
                        },
                    },
                    { id: 'independent', imageAlt: '', title: 'Independent' },
                ],
            },
        ], () => undefined);
        const changedParentSelections = toggleCyoaChoiceSelection(
            nestedRows[0],
            { affiliation: ['academy'], 'academy-detail': ['tower'] },
            'independent'
        );

        expect(clearInactiveCyoaSubChoiceSelections(
            nestedRows,
            changedParentSelections
        )).toEqual({ affiliation: ['independent'] });

        const deselectedParentSelections = toggleCyoaChoiceSelection(
            nestedRows[0],
            { affiliation: ['academy'], 'academy-detail': ['tower'] },
            'academy'
        );
        expect(clearInactiveCyoaSubChoiceSelections(
            nestedRows,
            deselectedParentSelections
        )).toEqual({ affiliation: [] });
    });
});
