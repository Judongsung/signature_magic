import { describe, expect, it } from 'vitest';
import { CYOA_ACTIONS, MAGIC_NODE_CATEGORIES } from '../constants/gameConfigs';
import cyoaRowsData from '../data/cyoaRows.json';
import magicTypesData from '../data/magicTypes.json';
import type { CyoaChoiceRowConfig } from '../types/cyoa';
import type { MagicTypeConfig } from '../types/magic';
import { isKnownCyoaImagePath } from './cyoaImageRegistry';
import { validateCyoaRows, validateMagicTypes } from './dataValidation';

describe('dataValidation', () => {
    it('validates configured magic types against category config', () => {
        expect(validateMagicTypes(
            magicTypesData as MagicTypeConfig[],
            MAGIC_NODE_CATEGORIES
        )).toEqual({ valid: true, errors: [] });
    });

    it('reports invalid magic type categories and duplicate type ids', () => {
        expect(validateMagicTypes(
            [
                { type: 'fire', label: '불', icon: '', color: '#fff', category: 'basic', description: '설명' },
                { type: 'fire', label: '불 복제', icon: '', color: '#fff', category: 'unknown', description: '' },
            ] as MagicTypeConfig[],
            MAGIC_NODE_CATEGORIES
        )).toEqual({
            valid: false,
            errors: [
                'Duplicate magic type id: fire',
                'Unknown magic type category: fire -> unknown',
                'Missing magic type description: fire',
            ],
        });
    });

    it('validates configured CYOA rows against action and image registries', () => {
        expect(validateCyoaRows(
            cyoaRowsData as CyoaChoiceRowConfig[],
            CYOA_ACTIONS,
            isKnownCyoaImagePath
        )).toEqual({ valid: true, errors: [] });
    });

    it('reports invalid CYOA row references', () => {
        expect(validateCyoaRows(
            [
                {
                    id: 'toc',
                    title: '목차',
                    choices: [
                        {
                            id: 'open-missing',
                            imagePath: '../assets/images/missing.webp',
                            imageAlt: '',
                            title: '',
                            description: '',
                            actions: [{ func: 'UNKNOWN', target_id: 'missing-row' }],
                        },
                    ],
                },
            ] as unknown as CyoaChoiceRowConfig[],
            CYOA_ACTIONS,
            isKnownCyoaImagePath
        )).toEqual({
            valid: false,
            errors: [
                'Unknown CYOA image path: open-missing -> ../assets/images/missing.webp',
                'Unknown CYOA action: open-missing -> UNKNOWN',
                'Unknown CYOA action target: open-missing -> missing-row',
            ],
        });
    });
});
