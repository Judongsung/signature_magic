import { describe, expect, it } from 'vitest';
import {
    MAGIC_CONNECTION_RULE_KEYS,
    MAGIC_NODE_CATEGORIES,
} from '../../constants/gameConfigs';
import {
    MAGIC_STAT_AGGREGATION_OPERATION_IDS,
    MAGIC_STAT_SCALING_OPERATION_IDS,
} from '../../constants/magicStatConfigs';
import cyoaDialogueScriptsData from '../../data/cyoaDialogueScripts.json';
import cyoaRowsData from '../../data/cyoaRows.json';
import magicGlyphsData from '../../data/magicGlyphs.json';
import magicGlyphShapesData from '../../data/magicGlyphShapes.json';
import magicStatRulesData from '../../data/magicStatRules.json';
import magicTypesData from '../../data/magicTypes.json';
import type { CyoaChoiceRowConfig } from '../../types/cyoa';
import type { CyoaDialogueScriptConfig } from '../../types/cyoa';
import type { MagicStatRulesConfig, MagicTypeConfig } from '../../types/magic';
import type { MagicGlyphConfig } from '../graph/magicGlyphRegistry';
import type { GlyphShape } from '../graph/magicGlyphShapes';
import { isKnownCyoaImagePath } from '../cyoa/cyoaImageRegistry';
import {
    validateCyoaDialogueScripts,
    validateCyoaRows,
    validateMagicGlyphShapes,
    validateMagicGlyphs,
    validateMagicStatRuleConfigs,
    validateMagicTypes,
} from './dataValidation';

const stats = { castingTime: 1, instability: 1, power: 1, range: 1, manaCost: 1, duration: 1 };

describe('dataValidation', () => {
    it('validates configured magic types against category config', () => {
        expect(validateMagicTypes(
            magicTypesData as MagicTypeConfig[],
            MAGIC_NODE_CATEGORIES
        )).toEqual({ valid: true, errors: [] });
    });

    it('validates configured magic stat rule operations', () => {
        expect(validateMagicStatRuleConfigs(
            magicStatRulesData as MagicStatRulesConfig
        )).toEqual({ valid: true, errors: [] });
    });

    it('reports invalid magic stat rule operations', () => {
        expect(validateMagicStatRuleConfigs({
            castingTime: {
                nodeAggregation: 'average',
                serialAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.SUM,
                branchAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.SUM,
                scaling: { operation: MAGIC_STAT_SCALING_OPERATION_IDS.NONE },
            },
            instability: {
                nodeAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.SUM,
                serialAggregation: 'fastest',
                branchAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.SUM,
                scaling: { operation: MAGIC_STAT_SCALING_OPERATION_IDS.EXPONENTIAL_BY_NODE_COUNT },
            },
            power: {
                nodeAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.SUM,
                serialAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.SUM,
                branchAggregation: 'nearest',
                scaling: { operation: MAGIC_STAT_SCALING_OPERATION_IDS.NONE },
            },
            range: {
                nodeAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.MULTIPLY,
                serialAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.MULTIPLY,
                branchAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.MAX,
                scaling: { operation: 'curve' },
            },
            unknown: {
                nodeAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.SUM,
                serialAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.SUM,
                branchAggregation: MAGIC_STAT_AGGREGATION_OPERATION_IDS.SUM,
                scaling: { operation: MAGIC_STAT_SCALING_OPERATION_IDS.NONE },
            },
        } as unknown as MagicStatRulesConfig)).toEqual({
            valid: false,
            errors: [
                'Unknown magic stat rule config key: unknown',
                'Invalid magic stat node aggregation: castingTime -> average',
                'Invalid magic stat serial aggregation: instability -> fastest',
                'Invalid magic stat scaling factor: instability -> undefined',
                'Invalid magic stat branch aggregation config: power -> nearest',
                'Invalid magic stat scaling operation: range -> curve',
                'Missing magic stat rule config: manaCost',
                'Missing magic stat rule config: duration',
            ],
        });
    });

    it('reports invalid magic type categories, duplicate type ids, and connection limits', () => {
        expect(validateMagicTypes(
            [
                { type: 'ignition', label: 'Ignition', icon: '', color: '#fff', category: 'basic', description: 'desc', stats },
                {
                    type: 'ignition',
                    label: 'Fire Copy',
                    icon: '',
                    color: '#fff',
                    category: 'unknown',
                    description: '',
                    stats: { ...stats, power: Number.NaN },
                    statRules: { castingTime: { branchAggregation: 'fastest' } },
                    connectionLimits: { maxInputs: 0, maxOutputs: -1 },
                    connectionRules: { [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]: 'yes', unknownRule: true },
                },
            ] as MagicTypeConfig[],
            MAGIC_NODE_CATEGORIES
        )).toEqual({
            valid: false,
            errors: [
                'Duplicate magic type id: ignition',
                'Unknown magic type category: ignition -> unknown',
                'Missing magic type description: ignition',
                'Invalid magic type maxInputs: ignition -> 0',
                'Invalid magic type maxOutputs: ignition -> -1',
                `Invalid magic connection rule ${MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT}: ignition -> yes`,
                'Unknown magic connection rule key: ignition -> unknownRule',
                'Invalid magic type stat: ignition -> power',
                'Invalid magic stat branch aggregation: ignition -> castingTime -> fastest',
            ],
        });
    });

    it('validates configured CYOA rows against visibility conditions and image registries', () => {
        expect(validateCyoaRows(
            cyoaRowsData as CyoaChoiceRowConfig[],
            isKnownCyoaImagePath
        )).toEqual({ valid: true, errors: [] });
    });

    it('validates configured CYOA dialogue scripts against image registries', () => {
        expect(validateCyoaDialogueScripts(
            cyoaDialogueScriptsData as CyoaDialogueScriptConfig[],
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
                { magicType: 'ignition', kind: 'flame', baseCount: 12 },
                { magicType: 'ignition', kind: 'unknown', runeKinds: ['missing-rune'], baseCount: 0 },
                { magicType: 'missing', kind: 'seal', baseCount: 1 },
            ] as MagicGlyphConfig[],
            [
                { type: 'ignition', label: 'Ignition', icon: '', color: '#fff', category: 'basic', description: 'desc' },
                { type: 'stream', label: 'Stream', icon: '', color: '#fff', category: 'basic', description: 'desc' },
            ] as MagicTypeConfig[]
        )).toEqual({
            valid: false,
            errors: [
                'Duplicate magic glyph config: ignition',
                'Missing magic glyph config: stream',
                'Unknown magic glyph kind: ignition -> unknown',
                'Unknown magic rune kind: ignition -> 0 -> missing-rune',
                'Invalid magic glyph baseCount: ignition -> 0',
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
                    description: 123,
                    requiredCount: -1,
                    visibleWhen: {
                        choiceSelected: 'missing-choice',
                        anyChoiceSelected: ['missing-any'],
                        allChoicesSelected: ['missing-all'],
                    },
                    choices: [
                        {
                            id: 'open-missing',
                            imagePath: '../assets/images/missing.webp',
                            imageAlt: '',
                            title: '',
                            description: 123,
                            tooltip: 456,
                            width: '3/2',
                            statEffects: [
                                { phase: 'before', operation: 'add', stat: 'power', value: 1 },
                                { phase: 'node', operation: 'divide', stat: 'power', value: 1 },
                                { phase: 'node', operation: 'add', stat: 'unknown', value: 1 },
                                { phase: 'final', operation: 'add', stat: 'power', value: Number.NaN },
                            ],
                        },
                    ],
                },
            ] as unknown as CyoaChoiceRowConfig[],
            isKnownCyoaImagePath
        )).toEqual({
            valid: false,
            errors: [
                'Invalid CYOA row description: toc',
                'Invalid CYOA required count: toc -> -1',
                'Unknown CYOA visibleWhen choice: toc -> missing-choice',
                'Unknown CYOA visibleWhen any choice: toc -> missing-any',
                'Unknown CYOA visibleWhen all choice: toc -> missing-all',
                'Unknown CYOA image path: open-missing -> ../assets/images/missing.webp',
                'Invalid CYOA choice description: open-missing',
                'Invalid CYOA choice tooltip: open-missing',
                'Invalid CYOA choice width: open-missing -> 3/2',
                'Invalid CYOA stat effect phase: open-missing -> 0 -> before',
                'Invalid CYOA stat effect operation: open-missing -> 1 -> divide',
                'Unknown CYOA stat effect key: open-missing -> 2 -> unknown',
                'Invalid CYOA stat effect value: open-missing -> 3 -> power',
            ],
        });
    });

    it('reports invalid CYOA dialogue script references', () => {
        expect(validateCyoaDialogueScripts(
            [
                {
                    id: 'script',
                    title: 'Script',
                    npcName: 'NPC',
                    npcTitle: 'Desk',
                    imagePath: '../assets/images/missing.webp',
                    imageAlt: '',
                    defaultNpcLine: '',
                    options: [
                        { id: 'option', playerLine: '', npcLine: '' },
                        { id: 'option', playerLine: 'line', npcLine: 'line' },
                    ],
                },
            ],
            isKnownCyoaImagePath
        )).toEqual({
            valid: false,
            errors: [
                'Unknown CYOA dialogue image path: script -> ../assets/images/missing.webp',
                'Duplicate CYOA dialogue option id: script -> option',
                'Missing CYOA dialogue default NPC line: script',
                'Missing CYOA dialogue player line: script -> option',
                'Missing CYOA dialogue NPC line: script -> option',
            ],
        });
    });
});
