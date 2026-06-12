import { describe, expect, it } from 'vitest';
import {
    collectDuplicateErrors,
    formatLabeledValidationError,
    formatValidationError,
    formatValidationPath,
    isFiniteNumber,
    isKnownStringValue,
    isNonEmptyString,
    isPlainObject,
} from './commonValidation';

describe('commonValidation', () => {
    it('formats validation paths and messages consistently', () => {
        expect(formatValidationPath('script', 'row', 1)).toBe('script -> row -> 1');
        expect(formatValidationError('Invalid', 'CYOA choice width', 'choice-id', '3/2'))
            .toBe('Invalid CYOA choice width: choice-id -> 3/2');
        expect(formatLabeledValidationError('Release test id', 'CYOA choice', 'choice-test'))
            .toBe('Release test id: CYOA choice -> choice-test');
        expect(formatValidationError('Missing', 'magic glyph shapes')).toBe('Missing magic glyph shapes');
    });

    it('collects duplicate errors in first repeated value order', () => {
        expect(collectDuplicateErrors(
            ['alpha', 'beta', 'alpha', 'gamma', 'beta'],
            'magic type id'
        )).toEqual([
            'Duplicate magic type id: alpha',
            'Duplicate magic type id: beta',
        ]);
    });

    it('checks primitive validation guards', () => {
        expect(isPlainObject({ value: 1 })).toBe(true);
        expect(isPlainObject([1])).toBe(false);
        expect(isNonEmptyString(' value ')).toBe(true);
        expect(isNonEmptyString('')).toBe(false);
        expect(isFiniteNumber(1)).toBe(true);
        expect(isFiniteNumber(Number.NaN)).toBe(false);
        expect(isKnownStringValue('a', new Set(['a', 'b']))).toBe(true);
        expect(isKnownStringValue('c', new Set(['a', 'b']))).toBe(false);
    });
});
