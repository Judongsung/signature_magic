import { describe, expect, it } from 'vitest';
import {
    CYOA_DIALOGUE_TEXT_VARIANTS,
    MAGIC_CONNECTION_RULE_KEYS,
    MAGIC_NODE_CATEGORIES,
    MAGIC_NODE_EDITOR_CONTROLS,
    MAGIC_NODE_EDITOR_PRESENTATIONS,
} from '../../constants/gameConfigs';
import {
    MAGIC_STAT_AGGREGATION_OPERATIONS,
    MAGIC_STAT_SCALING_OPERATIONS,
} from '../../constants/magicStatConfigs';
import { SYSTEM_MAGIC_TYPE_CONFIGS } from '../../constants/systemMagicNodeConfigs';
import cyoaDialogueScriptsData from '../../data/cyoaDialogueScripts.json';
import cyoaRowsData from '../../data/cyoaRows.json';
import magicGlyphsData from '../../data/magicGlyphs.json';
import magicGlyphShapesData from '../../data/magicGlyphShapes.json';
import magicGraphPresetsData from '../../data/magicGraphPresets.json';
import magicStatRulesData from '../../data/magicStatRules.json';
import magicTypesData from '../../data/magicTypes.json';
import type { CyoaChoiceRowConfig } from '../../types/cyoa';
import type { CyoaDialogueScriptConfig } from '../../types/cyoa';
import type { MagicGraphPresetConfig, MagicStatRulesConfig, MagicTypeConfig } from '../../types/magic';
import type { MagicGlyphConfig } from '../graph/presentation/magicGlyphRegistry';
import type { GlyphShape } from '../graph/presentation/magicGlyphShapes';
import { isKnownCyoaImagePath } from '../cyoa/cyoaImageRegistry';
import {
    validateCyoaDialogueScripts,
    validateCyoaRows,
    validateMagicGlyphShapes,
    validateMagicGlyphs,
    validateMagicGraphPresets,
    validateMagicStatRuleConfigs,
    validateSystemMagicTypes,
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

    it('validates system magic types with zero connection limits', () => {
        expect(validateSystemMagicTypes(
            SYSTEM_MAGIC_TYPE_CONFIGS,
            MAGIC_NODE_CATEGORIES
        )).toEqual({ valid: true, errors: [] });
    });

    it('validates configured magic stat rule operations', () => {
        expect(validateMagicStatRuleConfigs(
            magicStatRulesData as MagicStatRulesConfig
        )).toEqual({ valid: true, errors: [] });
    });

    it('validates configured magic graph presets against magic type data', () => {
        expect(validateMagicGraphPresets(
            magicGraphPresetsData as MagicGraphPresetConfig[],
            magicTypesData as MagicTypeConfig[]
        )).toEqual({ valid: true, errors: [] });
    });

    it('reports invalid magic stat rule operations', () => {
        expect(validateMagicStatRuleConfigs({
            castingTime: {
                nodeAggregation: 'average',
                serialAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.SUM,
                branchAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.SUM,
                scaling: { operation: MAGIC_STAT_SCALING_OPERATIONS.NONE },
            },
            instability: {
                nodeAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.SUM,
                serialAggregation: 'fastest',
                branchAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.SUM,
                scaling: { operation: MAGIC_STAT_SCALING_OPERATIONS.EXPONENTIAL_BY_NODE_COUNT },
            },
            power: {
                nodeAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.SUM,
                serialAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.SUM,
                branchAggregation: 'nearest',
                scaling: { operation: MAGIC_STAT_SCALING_OPERATIONS.NONE },
            },
            range: {
                nodeAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.MULTIPLY,
                serialAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.MULTIPLY,
                branchAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.MAX,
                scaling: { operation: 'curve' },
            },
            unknown: {
                nodeAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.SUM,
                serialAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.SUM,
                branchAggregation: MAGIC_STAT_AGGREGATION_OPERATIONS.SUM,
                scaling: { operation: MAGIC_STAT_SCALING_OPERATIONS.NONE },
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
                    instanceEditor: {
                        fields: [
                            {
                                key: 'duplicate',
                                label: '',
                                control: 'number',
                                maxLength: 0,
                                placeholder: 1,
                                presentation: 'tooltip',
                            },
                            {
                                key: 'duplicate',
                                label: 'Name',
                                control: MAGIC_NODE_EDITOR_CONTROLS.TEXT,
                                presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL,
                            },
                            {
                                key: '',
                                label: 'Empty key',
                                control: MAGIC_NODE_EDITOR_CONTROLS.TEXT,
                                presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL,
                            },
                        ],
                    },
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
                'Duplicate magic node editor field key: ignition: duplicate',
                'Duplicate magic node editor presentation: ignition: nodeLabel',
                'Invalid magic node editor field label: ignition -> 0',
                'Unknown magic node editor control: ignition -> 0 -> number',
                'Invalid magic node editor maxLength: ignition -> 0 -> 0',
                'Invalid magic node editor placeholder: ignition -> 0',
                'Unknown magic node editor presentation: ignition -> 0 -> tooltip',
                'Invalid magic node editor field key: ignition -> 2',
                'Invalid magic type stat: ignition -> power',
                'Invalid magic stat branch aggregation: ignition -> castingTime -> fastest',
            ],
        });
    });

    it('reports invalid magic graph preset data', () => {
        expect(validateMagicGraphPresets(
            [
                {
                    id: 'bad-preset',
                    label: '',
                    systemNodePositions: [
                        { id: 'system-mana-source', position: { x: 0, y: 0 } },
                        { id: 'system-mana-source', position: { x: 1, y: 1 } },
                        { id: 'missing-system-node', position: { x: Number.NaN, y: Number.NaN } },
                    ],
                    nodes: [
                        { id: 'node-a', magicType: 'missing', position: { x: 0, y: 0 } },
                        { id: 'node-a', magicType: '', position: { x: Number.NaN, y: 0 } },
                        { id: 'system-mana-source', magicType: 'ignition', position: { x: 0, y: Number.NaN } },
                    ],
                    edges: [
                        {
                            id: 'edge-a',
                            source: 'missing-source',
                            target: 'node-a',
                            sourceHandle: 'input-0',
                            targetHandle: 'output-0',
                        },
                        { id: 'edge-a', source: 'node-a', target: 'missing-target' },
                    ],
                },
            ] as MagicGraphPresetConfig[],
            magicTypesData as MagicTypeConfig[]
        )).toEqual({
            valid: false,
            errors: [
                'Missing magic graph preset label: bad-preset',
                'Duplicate magic graph preset system node id: bad-preset: system-mana-source',
                'Unknown magic graph preset system node id: bad-preset -> missing-system-node',
                'Invalid magic graph preset system node x: bad-preset -> missing-system-node',
                'Invalid magic graph preset system node y: bad-preset -> missing-system-node',
                'Duplicate magic graph preset node id: bad-preset: node-a',
                'Invalid magic graph preset node type: bad-preset -> node-a',
                'Invalid magic graph preset node x: bad-preset -> node-a',
                'Reserved magic graph preset node id: bad-preset -> system-mana-source',
                'Invalid magic graph preset node y: bad-preset -> system-mana-source',
                'Duplicate magic graph preset edge id: bad-preset: edge-a',
                'Invalid magic graph preset source handle: bad-preset -> edge-a -> input-0',
                'Invalid magic graph preset target handle: bad-preset -> edge-a -> output-0',
                'Unknown magic graph preset node type: bad-preset -> node-a -> missing',
                'Unknown magic graph preset edge source: bad-preset -> edge-a -> missing-source',
                'Unknown magic graph preset edge target: bad-preset -> edge-a -> missing-target',
            ],
        });
    });

    it('reports undeclared and oversized preset node settings', () => {
        expect(validateMagicGraphPresets(
            [
                {
                    id: 'bad-settings-preset',
                    label: 'Bad settings',
                    nodes: [
                        {
                            id: 'custom-node',
                            magicType: 'custom',
                            settings: {
                                displayName: 'x'.repeat(21),
                                unknown: 'value',
                            },
                            position: { x: 0, y: 0 },
                        },
                        {
                            id: 'detect-node',
                            magicType: 'detect',
                            settings: {
                                caption: 'x'.repeat(81),
                            },
                            position: { x: 40, y: 0 },
                        },
                    ],
                    edges: [],
                },
            ],
            magicTypesData as MagicTypeConfig[]
        )).toEqual({
            valid: false,
            errors: [
                'Magic graph preset node setting is too long: bad-settings-preset -> custom-node -> displayName',
                'Unknown magic graph preset node setting: bad-settings-preset -> custom-node -> unknown',
                'Magic graph preset node setting is too long: bad-settings-preset -> detect-node -> caption',
            ],
        });
    });

    it('accepts the default caption setting for regular user nodes', () => {
        expect(validateMagicGraphPresets(
            [
                {
                    id: 'caption-preset',
                    label: 'Caption preset',
                    nodes: [
                        {
                            id: 'ignition-node',
                            magicType: 'ignition',
                            settings: { caption: '불꽃을 일으킨다' },
                            position: { x: 0, y: 0 },
                        },
                    ],
                    edges: [],
                },
            ],
            magicTypesData as MagicTypeConfig[]
        )).toEqual({ valid: true, errors: [] });
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
                    selectionMode: 'double',
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
                            imageSize: 'giant',
                            imagePlacement: 'center',
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
                'Invalid CYOA selection mode: toc -> double',
                'Unknown CYOA visibleWhen choice: toc -> missing-choice',
                'Unknown CYOA visibleWhen any choice: toc -> missing-any',
                'Unknown CYOA visibleWhen all choice: toc -> missing-all',
                'Unknown CYOA image path: open-missing -> ../assets/images/missing.webp',
                'Invalid CYOA choice image size: open-missing -> giant',
                'Invalid CYOA choice image placement: open-missing -> center',
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
                    optionRows: [
                        {
                            id: 'row',
                            options: [
                                { id: 'option', playerLine: '', npcLine: '' },
                            ],
                        },
                        {
                            id: 'row',
                            selectionMode: 'double',
                            visibleWhen: { choiceSelected: 'missing-option' },
                            options: [
                                { id: 'option', playerLine: 'line', npcLine: 'line' },
                                {
                                    id: 'option-child',
                                    playerLine: 'line',
                                    npcLine: '',
                                    npcImagePath: '../assets/images/missing-option.webp',
                                    npcImageAlt: 123,
                                },
                            ],
                        },
                    ],
                },
            ] as unknown as CyoaDialogueScriptConfig[],
            isKnownCyoaImagePath
        )).toEqual({
            valid: false,
            errors: [
                'Unknown CYOA dialogue image path: script -> ../assets/images/missing.webp',
                'Duplicate CYOA dialogue option row id: script -> row',
                'Duplicate CYOA dialogue option id: script -> option',
                'Missing CYOA dialogue default NPC line: script',
                'Invalid CYOA dialogue selection mode: script -> row -> double',
                'Unknown CYOA dialogue visibleWhen choice: script -> row -> missing-option',
                'Missing CYOA dialogue player line: script -> option',
                'Missing CYOA dialogue NPC line: script -> option',
                'Missing CYOA dialogue NPC line: script -> option-child',
                'Unknown CYOA dialogue option image path: script -> option-child -> ../assets/images/missing-option.webp',
                'Invalid CYOA dialogue option image alt: script -> option-child',
            ],
        });
    });

    it('reports invalid CYOA dialogue line segments', () => {
        expect(validateCyoaDialogueScripts(
            [
                {
                    id: 'script',
                    title: 'Script',
                    npcName: 'NPC',
                    npcTitle: 'Desk',
                    imageAlt: '',
                    defaultNpcLine: [
                        {
                            text: 'line',
                            variant: 'unknown',
                        },
                    ],
                    optionRows: [
                        {
                            id: 'row',
                            options: [
                                {
                                    id: 'empty-array',
                                    playerLine: 'line',
                                    npcLine: [],
                                },
                                {
                                    id: 'empty-text',
                                    playerLine: 'line',
                                    npcLine: [
                                        {
                                            text: '',
                                            variant: CYOA_DIALOGUE_TEXT_VARIANTS.MUMBLE,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ] as unknown as CyoaDialogueScriptConfig[],
            isKnownCyoaImagePath
        )).toEqual({
            valid: false,
            errors: [
                'Invalid CYOA dialogue line segment variant: default NPC line: script -> 0 -> unknown',
                'Invalid CYOA dialogue line segments: NPC line: script -> empty-array',
                'Invalid CYOA dialogue line segment text: NPC line: script -> empty-text -> 0',
            ],
        });
    });

    it('reports invalid CYOA dialogue result conditions', () => {
        expect(validateCyoaDialogueScripts(
            [
                {
                    id: 'script',
                    title: 'Script',
                    npcName: 'NPC',
                    npcTitle: 'Desk',
                    imageAlt: '',
                    defaultNpcLine: 'line',
                    resultLines: [
                        {
                            when: {},
                            npcLine: '',
                        },
                        {
                            when: {
                                circleCount: { min: 2, max: 1 },
                                totalStats: {
                                    unknown: { min: 1 },
                                    power: {},
                                },
                            },
                            npcLine: 'line',
                        },
                    ],
                    optionRows: [
                        {
                            id: 'row',
                            resultWhen: {
                                totalStats: {
                                    instability: { min: 'high' },
                                },
                            },
                            options: [
                                { id: 'option', playerLine: 'line', npcLine: 'line' },
                            ],
                        },
                    ],
                },
            ] as unknown as CyoaDialogueScriptConfig[],
            isKnownCyoaImagePath
        )).toEqual({
            valid: false,
            errors: [
                'Empty CYOA dialogue result condition: script -> resultLines[0]',
                'Missing CYOA dialogue result NPC line: script -> 0',
                'Invalid CYOA dialogue result condition range order: script -> resultLines[1] -> circleCount',
                'Unknown CYOA dialogue result condition stat: script -> resultLines[1] -> unknown',
                'Empty CYOA dialogue result condition range: script -> resultLines[1] -> totalStats.power',
                'Invalid CYOA dialogue result condition min: script -> row -> totalStats.instability -> high',
            ],
        });
    });
});
