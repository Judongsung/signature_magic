import { describe, expect, it } from 'vitest';
import { CYOA_ACTIONS, MAGIC_NODE_CATEGORIES } from '../../constants/gameConfigs';
import cyoaRowsData from '../../data/cyoaRows.json';
import magicGlyphsData from '../../data/magicGlyphs.json';
import magicGlyphShapesData from '../../data/magicGlyphShapes.json';
import magicTypesData from '../../data/magicTypes.json';
import type { CyoaChoiceRowConfig } from '../../types/cyoa';
import type { MagicTypeConfig } from '../../types/magic';
import type { MagicGlyphConfig } from '../graph/magicGlyphRegistry';
import type { GlyphShape } from '../graph/magicGlyphShapes';
import { isKnownCyoaImagePath } from '../cyoa/cyoaImageRegistry';
import { validateCyoaRows, validateMagicGlyphShapes, validateMagicGlyphs, validateMagicTypes } from './dataValidation';

const stats = { castingTime: 1, instability: 1, power: 1, range: 1, manaCost: 1, duration: 1 };

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
                { type: 'fire', label: 'Fire', icon: '', color: '#fff', category: 'basic', description: 'desc', stats },
                {
                    type: 'fire',
                    label: 'Fire Copy',
                    icon: '',
                    color: '#fff',
                    category: 'unknown',
                    description: '',
                    stats: { ...stats, power: Number.NaN },
                    statRules: { castingTime: { branchAggregation: 'fastest' } },
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
                'Invalid magic type stat: fire -> power',
                'Invalid magic stat branch aggregation: fire -> castingTime -> fastest',
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

    it('validates configured magic glyphs against magic type data', () => {
        expect(validateMagicGlyphs(
            magicGlyphsData as MagicGlyphConfig[],
            magicTypesData as MagicTypeConfig[]
        )).toEqual({ valid: true, errors: [] });
    });

    it('validates configured magic glyph shapes', () => {
        expect(validateMagicGlyphShapes(
            magicGlyphShapesData as Record<string, GlyphShape>
        )).toEqual({ valid: true, errors: [] });
    });

    it('reports invalid magic glyph data', () => {
        expect(validateMagicGlyphs(
            [
                { magicType: 'fire', kind: 'flame', baseCount: 12 },
                { magicType: 'fire', kind: 'unknown', baseCount: 0 },
                { magicType: 'missing', kind: 'seal', baseCount: 1 },
            ] as MagicGlyphConfig[],
            [
                { type: 'fire', label: 'Fire', icon: '', color: '#fff', category: 'basic', description: 'desc' },
                { type: 'water', label: 'Water', icon: '', color: '#fff', category: 'basic', description: 'desc' },
            ] as MagicTypeConfig[]
        )).toEqual({
            valid: false,
            errors: [
                'Duplicate magic glyph config: fire',
                'Missing magic glyph config: water',
                'Unknown magic glyph kind: fire -> unknown',
                'Invalid magic glyph baseCount: fire -> 0',
                'Unknown magic glyph type: missing',
            ],
        });
    });

    it('reports invalid magic glyph shape data', () => {
        expect(validateMagicGlyphShapes({
            empty: {},
            badPath: { paths: [{ d: '' }] },
            badCircle: { circles: [{ cx: 0, cy: 0, r: 0 }] },
            badRect: { rects: [{ x: 0, y: 0, width: 0, height: 1 }] },
        })).toEqual({
            valid: false,
            errors: [
                'Empty magic glyph shape: empty',
                'Invalid magic glyph path: badPath -> 0',
                'Invalid magic glyph circle radius: badCircle -> 0',
                'Invalid magic glyph rect size: badRect -> 0',
            ],
        });
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
