import { describe, expect, it } from 'vitest';
import cyoaRowsData from '../../data/cyoaRows.json';
import type {
    CyoaChoiceRowConfig,
    CyoaChoiceRowData,
} from '../../types/cyoa';
import { mapCyoaRows } from './cyoaActions';
import {
    calculateCyoaMaximumMana,
    mapCyoaMaximumManaModifiersByChoiceId,
} from './cyoaMaximumMana';

const rows: CyoaChoiceRowData[] = [{
    id: 'mana',
    title: '마나',
    visible: true,
    selectable: true,
    requiredCount: 0,
    selectionMode: 'multi',
    layoutColumns: 1,
    choices: [
        {
            id: 'talent',
            imageAlt: '',
            title: '재능',
            maximumManaModifier: 25,
            subChoiceGroup: {
                id: 'talent-detail',
                title: '세부',
                requiredCount: 0,
                selectionMode: 'single',
                choices: [{
                    id: 'penalty',
                    imageAlt: '',
                    title: '대가',
                    maximumManaModifier: -10,
                }],
            },
        },
    ],
}];

describe('cyoaMaximumMana', () => {
    it('indexes top-level and nested choice modifiers', () => {
        expect([...mapCyoaMaximumManaModifiersByChoiceId(rows)])
            .toEqual([
                ['talent', 25],
                ['penalty', -10],
            ]);
    });

    it('adds each selected choice modifier once', () => {
        const modifiers = mapCyoaMaximumManaModifiersByChoiceId(rows);

        expect(calculateCyoaMaximumMana({}, modifiers)).toBe(100);
        expect(calculateCyoaMaximumMana({
            mana: ['talent', 'talent'],
            'talent-detail': ['penalty'],
        }, modifiers)).toBe(115);
    });

    it('raises maximum mana to 140 when the gem catalyst is selected', () => {
        const modifiers = mapCyoaMaximumManaModifiersByChoiceId(
            mapCyoaRows(
                cyoaRowsData as CyoaChoiceRowConfig[],
                () => undefined
            )
        );

        expect(calculateCyoaMaximumMana({
            catalyst: ['catalyst-gem'],
        }, modifiers)).toBe(140);
    });
});
