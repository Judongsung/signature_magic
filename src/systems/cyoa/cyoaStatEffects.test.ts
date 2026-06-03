import { describe, expect, it } from 'vitest';
import type { CyoaChoiceRowData } from '../../types/cyoa';
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
});
