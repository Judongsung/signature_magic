import { describe, expect, it } from 'vitest';
import cyoaRowsData from '../../data/cyoaRows.json';
import type { CyoaChoiceRowConfig, CyoaChoiceRowData } from '../../types/cyoa';
import {
    calculateCyoaStatEffects,
    mapCyoaStatEffectsByChoiceId,
} from './cyoaStatEffects';

const rows: CyoaChoiceRowData[] = [
    {
        id: 'class',
        title: 'Class',
        visible: true,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [
            {
                id: 'class-scholar',
                imageAlt: '',
                title: 'Scholar',
                statEffects: [
                    { phase: 'node', operation: 'multiply', stat: 'instability', value: 0.9 },
                ],
                subChoiceGroup: {
                    id: 'scholar-detail',
                    title: 'Scholar detail',
                    requiredCount: 1,
                    selectionMode: 'single',
                    choices: [{
                        id: 'scholar-researcher',
                        imageAlt: '',
                        title: 'Researcher',
                        statEffects: [
                            { phase: 'final', operation: 'add', stat: 'duration', value: 3 },
                        ],
                    }],
                },
            },
            {
                id: 'class-caster',
                imageAlt: '',
                title: 'Caster',
                statEffects: [
                    { phase: 'final', operation: 'add', stat: 'power', value: 2 },
                ],
            },
        ],
    },
    {
        id: 'catalyst',
        title: 'Catalyst',
        visible: true,
        selectable: true,
        requiredCount: 1,
        selectionMode: 'single',
        layoutColumns: 1,
        choices: [
            {
                id: 'catalyst-staff',
                imageAlt: '',
                title: 'Staff',
                statEffects: [
                    { phase: 'final', operation: 'multiply', stat: 'range', value: 1.2 },
                ],
            },
        ],
    },
];

describe('cyoaStatEffects', () => {
    it('maps stat effects by choice id once', () => {
        const effectsByChoiceId = mapCyoaStatEffectsByChoiceId(rows);

        expect(effectsByChoiceId.get('class-scholar')).toEqual([
            { phase: 'node', operation: 'multiply', stat: 'instability', value: 0.9 },
        ]);
        expect(effectsByChoiceId.get('scholar-researcher')).toEqual([
            { phase: 'final', operation: 'add', stat: 'duration', value: 3 },
        ]);
    });

    it('groups selected effects by calculation phase', () => {
        const effectsByChoiceId = mapCyoaStatEffectsByChoiceId(rows);

        expect(calculateCyoaStatEffects({
            class: ['class-scholar', 'class-caster'],
            catalyst: ['catalyst-staff'],
        }, effectsByChoiceId)).toEqual({
            nodeEffects: [
                { phase: 'node', operation: 'multiply', stat: 'instability', value: 0.9 },
            ],
            finalEffects: [
                { phase: 'final', operation: 'add', stat: 'power', value: 2 },
                { phase: 'final', operation: 'multiply', stat: 'range', value: 1.2 },
            ],
        });
    });

    it('ignores selected choices without configured effects', () => {
        expect(calculateCyoaStatEffects({
            class: ['missing-choice'],
        }, mapCyoaStatEffectsByChoiceId(rows))).toEqual({
            nodeEffects: [],
            finalEffects: [],
        });
    });

    it('includes selected sub-choice effects', () => {
        expect(calculateCyoaStatEffects({
            class: ['class-scholar'],
            'scholar-detail': ['scholar-researcher'],
        }, mapCyoaStatEffectsByChoiceId(rows))).toEqual({
            nodeEffects: [
                { phase: 'node', operation: 'multiply', stat: 'instability', value: 0.9 },
            ],
            finalEffects: [
                { phase: 'final', operation: 'add', stat: 'duration', value: 3 },
            ],
        });
    });

    it('configures every catalyst choice with its planned stat effects', () => {
        const catalystRow = (cyoaRowsData as CyoaChoiceRowConfig[])
            .find(row => row.id === 'catalyst')!;
        const effectsByCatalystId = Object.fromEntries(
            catalystRow.choices!.map(choice => [choice.id, choice.statEffects])
        );

        expect(effectsByCatalystId).toEqual({
            'catalyst-staff': [
                { phase: 'node', operation: 'multiply', stat: 'instability', value: 0.9 },
                {
                    phase: 'node',
                    operation: 'add',
                    stat: 'manaCost',
                    value: -1,
                    nodeTarget: { categories: ['action'] },
                },
            ],
            'catalyst-blade': [
                { phase: 'final', operation: 'multiply', stat: 'power', value: 1.5 },
            ],
            'catalyst-book': [
                { phase: 'node', operation: 'multiply', stat: 'instability', value: 0.8 },
            ],
            'catalyst-gem': [
                { phase: 'final', operation: 'multiply', stat: 'power', value: 1.5 },
            ],
            'catalyst-tattoo': [
                { phase: 'final', operation: 'multiply', stat: 'duration', value: 4 },
            ],
            'catalyst-sound': [
                { phase: 'final', operation: 'multiply', stat: 'range', value: 8 },
                { phase: 'final', operation: 'multiply', stat: 'power', value: 0.8 },
            ],
            'catalyst-potion': [
                { phase: 'node', operation: 'multiply', stat: 'castingTime', value: 0.8 },
                { phase: 'final', operation: 'multiply', stat: 'instability', value: 0.9 },
            ],
        });
    });

    it('configures profession choices with their planned stat effects', () => {
        const professionRow = (cyoaRowsData as CyoaChoiceRowConfig[])
            .find(row => row.id === 'personal-class')!;
        const effectsByProfessionId = Object.fromEntries(
            professionRow.choices!.map(choice => [choice.id, choice.statEffects])
        );

        expect(effectsByProfessionId['class-scholar']).toEqual([
            { phase: 'node', operation: 'multiply', stat: 'instability', value: 0.9 },
        ]);
        expect(effectsByProfessionId['class-battlemage']).toEqual([
            { phase: 'node', operation: 'multiply', stat: 'castingTime', value: 0.7 },
            { phase: 'node', operation: 'multiply', stat: 'power', value: 0.9 },
        ]);
        expect(effectsByProfessionId['class-adventurer']).toEqual([
            { phase: 'final', operation: 'multiply', stat: 'instability', value: 0.9 },
            { phase: 'node', operation: 'multiply', stat: 'power', value: 0.9 },
        ]);
        expect(effectsByProfessionId['class-priest']).toEqual([
            {
                phase: 'node',
                operation: 'multiply',
                stat: 'power',
                value: 2,
                nodeTarget: { magicTypes: ['harmony'] },
            },
        ]);
        expect(effectsByProfessionId['class-alchemist']).toEqual([
            { phase: 'node', operation: 'multiply', stat: 'castingTime', value: 0.9 },
            { phase: 'final', operation: 'multiply', stat: 'instability', value: 0.9 },
        ]);
    });
});
