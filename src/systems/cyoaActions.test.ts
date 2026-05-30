import { describe, expect, it } from 'vitest';
import { CYOA_ACTIONS } from '../constants/gameConfigs';
import type { CyoaChoiceRowData } from '../types/cyoa';
import {
    applyCyoaChoiceActions,
    canContinueCyoa,
    createInitialRowVisibility,
    mapCyoaChoiceConfig,
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
            (imagePath) => imagePath ?? '/fallback.webp'
        ).imageSrc).toBe('/fallback.webp');
    });

    it('creates initial row visibility from row config data', () => {
        expect(createInitialRowVisibility(rows)).toEqual({
            toc: true,
            region: false,
            catalyst: false,
        });
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
