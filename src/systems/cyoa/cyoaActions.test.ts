import { describe, expect, it } from 'vitest';
import { CYOA_ACTIONS } from '../../constants/gameConfigs';
import type { CyoaChoiceRowData } from '../../types/cyoa';
import {
    applyCyoaChoiceActions,
    canContinueCyoa,
    createInitialInputValues,
    createInitialRowVisibility,
    mapCyoaChoiceConfig,
    mapCyoaRows,
    toggleCyoaChoiceSelection,
} from './cyoaActions';

const rows: CyoaChoiceRowData[] = [
    {
        id: 'toc',
        title: '목차',
        visible: true,
        selectable: true,
        required: false,
        requiredMode: 'never',
        selectionMode: 'multi',
        layoutColumns: 1,
        choices: [],
    },
    {
        id: 'region',
        title: '지역',
        visible: false,
        selectable: true,
        required: true,
        requiredMode: 'always',
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [],
    },
    {
        id: 'catalyst',
        title: '촉매',
        visible: false,
        selectable: true,
        required: true,
        requiredMode: 'always',
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [],
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
            },
            (imagePath) => imagePath ? '/resolved.webp' : undefined
        )).toMatchObject({
            imageSrc: undefined,
            width: '1/3',
            layoutSpan: 1,
        });
    });

    it('maps choice widths into row grid spans', () => {
        const mapped = mapCyoaRows([
            {
                id: 'layout',
                title: '레이아웃',
                choices: [
                    { id: 'a', imageAlt: '', title: '', description: '', width: '1/2' },
                    { id: 'b', imageAlt: '', title: '', description: '', width: '1/4' },
                    { id: 'c', imageAlt: '', title: '', description: '', width: '1/4' },
                ],
            },
        ], (imagePath) => imagePath ?? '/fallback.webp');

        expect(mapped[0].layoutColumns).toBe(4);
        expect(mapped[0].choices.map(choice => choice.layoutSpan)).toEqual([2, 1, 1]);
    });

    it('creates initial row visibility from row config data', () => {
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
                    label: '이름',
                    defaultValue: '아린',
                },
            },
        ];

        expect(createInitialInputValues(inputRows)).toEqual({ name: '아린' });
    });

    it('opens rows through OPEN_ROW choice actions', () => {
        expect(applyCyoaChoiceActions(
            {
                id: 'open-region',
                imageSrc: '/image.png',
                imageAlt: '',
                title: '지역',
                description: '',
                actions: [{ func: CYOA_ACTIONS.OPEN_ROW, target_id: 'region' }],
            },
            { toc: true, region: false },
            true
        )).toEqual({ toc: true, region: true });
    });

    it('closes rows through deselected OPEN_ROW choice actions', () => {
        expect(applyCyoaChoiceActions(
            {
                id: 'open-region',
                imageSrc: '/image.png',
                imageAlt: '',
                title: '지역',
                description: '',
                actions: [{ func: CYOA_ACTIONS.OPEN_ROW, target_id: 'region' }],
            },
            { toc: true, region: true },
            false
        )).toEqual({ toc: true, region: false });
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

    it('requires every required selectable row to be selected before continuing', () => {
        expect(canContinueCyoa(
            rows,
            { toc: true, region: true, catalyst: false },
            { region: ['region-frontier'] }
        )).toBe(false);
        expect(canContinueCyoa(
            rows,
            { toc: true, region: true, catalyst: true },
            { region: ['region-frontier'], catalyst: ['catalyst-staff'] }
        )).toBe(true);
    });

    it('requires input row values before continuing', () => {
        const inputRows: CyoaChoiceRowData[] = [
            {
                ...rows[1],
                input: {
                    id: 'name',
                    label: '이름',
                },
            },
        ];

        expect(canContinueCyoa(inputRows, { region: true }, {}, {})).toBe(false);
        expect(canContinueCyoa(inputRows, { region: true }, {}, { name: '아린' })).toBe(true);
    });

    it('requires visible-only rows only while they are open', () => {
        const optionalVisibleRows = [
            { ...rows[0], requiredMode: 'never' as const },
            { ...rows[1], requiredMode: 'visible' as const },
        ];

        expect(canContinueCyoa(
            optionalVisibleRows,
            { toc: true, region: false },
            {}
        )).toBe(true);
        expect(canContinueCyoa(
            optionalVisibleRows,
            { toc: true, region: true },
            {}
        )).toBe(false);
    });
});
