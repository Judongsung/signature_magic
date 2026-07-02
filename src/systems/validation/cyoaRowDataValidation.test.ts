import { describe, expect, it } from 'vitest';
import { validateCyoaRows } from './cyoaRowDataValidation';

function rowsWithModifier(maximumManaModifier: unknown): unknown {
    return [{
        id: 'mana',
        title: '마나',
        requiredCount: 0,
        choices: [{
            id: 'mana-choice',
            imageAlt: '',
            title: '마나 선택',
            maximumManaModifier,
        }],
    }];
}

describe('cyoaRowDataValidation maximum mana', () => {
    it('accepts finite positive and negative modifiers', () => {
        expect(validateCyoaRows(
            rowsWithModifier(20),
            () => true
        ).valid).toBe(true);
        expect(validateCyoaRows(
            rowsWithModifier(-20),
            () => true
        ).valid).toBe(true);
    });

    it('rejects a non-finite modifier', () => {
        expect(validateCyoaRows(
            rowsWithModifier(Number.POSITIVE_INFINITY),
            () => true
        )).toEqual({
            valid: false,
            errors: [
                'Invalid CYOA maximum mana modifier: mana-choice -> Infinity',
            ],
        });
    });
});
