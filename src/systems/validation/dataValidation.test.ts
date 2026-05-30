import { describe, expect, it } from 'vitest';
import { CYOA_ACTIONS, MAGIC_NODE_CATEGORIES } from '../../constants/gameConfigs';
import cyoaRowsData from '../../data/cyoaRows.json';
import magicTypesData from '../../data/magicTypes.json';
import type { CyoaChoiceRowConfig } from '../../types/cyoa';
import type { MagicTypeConfig } from '../../types/magic';
import { isKnownCyoaImagePath } from '../cyoa/cyoaImageRegistry';
import { validateCyoaRows, validateMagicTypes } from './dataValidation';

describe('dataValidation', () => {
    it('validates configured magic types against category config', () => {
        expect(validateMagicTypes(
            magicTypesData as MagicTypeConfig[],
            MAGIC_NODE_CATEGORIES
        )).toEqual({ valid: true, errors: [] });
    });

    it('reports invalid magic type categories, duplicate type ids, and connection limits', () => {
        expect(validateMagicTypes(
            [
                { type: 'fire', label: 'Fire', icon: '', color: '#fff', category: 'basic', description: 'desc' },
                {
                    type: 'fire',
                    label: 'Fire Copy',
                    icon: '',
                    color: '#fff',
                    category: 'unknown',
                    description: '',
                    connectionLimits: { maxInputs: 0, maxOutputs: -1 },
                },
            ] as MagicTypeConfig[],
            MAGIC_NODE_CATEGORIES
        )).toEqual({
            valid: false,
            errors: [
                'Duplicate magic type id: fire',
                'Unknown magic type category: fire -> unknown',
                'Missing magic type description: fire',
                'Invalid magic type maxInputs: fire -> 0',
                'Invalid magic type maxOutputs: fire -> -1',
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
                    title: 'TOC',
                    choices: [
                        {
                            id: 'open-missing',
                            imagePath: '../assets/images/missing.webp',
                            imageAlt: '',
                            title: '',
                            description: '',
                            width: '3/2',
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
                'Invalid CYOA choice width: open-missing -> 3/2',
                'Unknown CYOA action: open-missing -> UNKNOWN',
                'Unknown CYOA action target: open-missing -> missing-row',
            ],
        });
    });
});
