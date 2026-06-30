import { describe, expect, it } from 'vitest';
import { CYOA_DIALOGUE_TEXT_VARIANTS } from '../../constants/cyoaConfigs';
import {
    MAGIC_CONNECTION_RULE_KEYS,
    MAGIC_NODE_CATEGORIES,
    MAGIC_NODE_EDITOR_BEHAVIORS,
    MAGIC_NODE_EDITOR_CONTROLS,
    MAGIC_NODE_EDITOR_PRESENTATIONS,
} from '../../constants/nodeEditorConfigs';
import {
    MAGIC_STAT_AGGREGATION_OPERATIONS,
    MAGIC_STAT_SCALING_OPERATIONS,
} from '../../constants/magicStatConfigs';
import {
    CIRCLE_SYSTEM_MAGIC_NODE_TYPES,
    SYSTEM_MAGIC_TYPE_CONFIGS,
} from '../../constants/systemMagicNodeConfigs';
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
const magicTypeIds = new Set(magicTypesData.map(magicType => magicType.type));
const isKnownMagicType = (magicType: string): boolean => magicTypeIds.has(magicType);
const manifestationSlot = (
    slotIndex: number,
    settings?: Record<string, string>
) => [{
    magicType: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
    slotIndex,
    ...(settings ? { settings } : {}),
}];

describe('dataValidation', () => {
    it('validates configured magic types against category config', () => {
        expect(validateMagicTypes(
            magicTypesData,
            MAGIC_NODE_CATEGORIES
        )).toEqual({ valid: true, errors: [] });
    });

    it('reports invalid magic node stat bound overrides', () => {
        expect(validateMagicTypes([{
            type: 'bounded',
            label: 'Bounded',
            icon: '',
            color: '#fff',
            category: 'basic',
            description: 'Bounded magic.',
            stats,
            statBounds: {
                unknown: { minimum: 0 },
                power: {
                    minimum: 'low',
                    maximum: Number.POSITIVE_INFINITY,
                    extra: true,
                },
                instability: { minimum: 2, maximum: 1 },
                duration: [],
            },
        }] as unknown as MagicTypeConfig[], MAGIC_NODE_CATEGORIES)).toEqual({
            valid: false,
            errors: [
                'Unknown magic node stat bounds key: bounded -> unknown',
                'Unknown magic node stat bound key: bounded -> power -> extra',
                'Invalid magic node stat minimum: bounded -> power -> low',
                'Invalid magic node stat maximum: bounded -> power -> Infinity',
                'Invalid magic node stat bounds order: bounded -> instability -> 2 -> 1',
                'Invalid magic node stat bounds: bounded -> duration',
            ],
        });
    });

    it('disables default node minimums for negative contribution nodes', () => {
        const magicTypesById = new Map(
            (magicTypesData as MagicTypeConfig[]).map(magicType => [magicType.type, magicType])
        );

        expect(magicTypesById.get('stabilize')?.statBounds).toEqual({
            instability: { minimum: null },
        });
        expect(magicTypesById.get('disperse')?.statBounds).toEqual({
            power: { minimum: null },
        });
    });

    it('validates system magic types with zero connection limits', () => {
        expect(validateSystemMagicTypes(
            SYSTEM_MAGIC_TYPE_CONFIGS,
            MAGIC_NODE_CATEGORIES
        )).toEqual({ valid: true, errors: [] });
    });

    it('validates configured magic stat rule operations', () => {
        expect(validateMagicStatRuleConfigs(
            magicStatRulesData
        )).toEqual({ valid: true, errors: [] });
    });

    it('validates configured magic graph presets against magic type data', () => {
        expect(validateMagicGraphPresets(
            magicGraphPresetsData,
            magicTypesData
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

    it('validates magic stat minimum and maximum bounds', () => {
        expect(validateMagicStatRuleConfigs({
            ...magicStatRulesData,
            power: {
                ...magicStatRulesData.power,
                bounds: { minimum: 2, maximum: 1 },
            },
            range: {
                ...magicStatRulesData.range,
                bounds: { minimum: Number.NaN, maximum: Number.POSITIVE_INFINITY },
            },
        })).toEqual({
            valid: false,
            errors: [
                'Invalid magic stat bounds order: power -> 2 -> 1',
                'Invalid magic stat minimum: range -> NaN',
                'Invalid magic stat maximum: range -> Infinity',
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
                                behavior: MAGIC_NODE_EDITOR_BEHAVIORS.REPEAT_COUNT,
                            },
                            {
                                key: '',
                                label: 'Empty key',
                                control: MAGIC_NODE_EDITOR_CONTROLS.TEXT,
                                presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL,
                            },
                            {
                                key: 'stepper',
                                label: 'Count',
                                control: MAGIC_NODE_EDITOR_CONTROLS.STEPPER,
                                min: 1.5,
                                max: 1,
                                step: 0,
                                defaultValue: 3,
                                helpText: 1,
                                presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL_SUFFIX,
                                behavior: 'unknown',
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
                'Invalid repeat count control: ignition -> 1',
                'Invalid repeat count presentation: ignition -> 1',
                'Invalid magic node editor field key: ignition -> 2',
                'Invalid magic node editor stepper min: ignition -> 3 -> 1.5',
                'Invalid magic node editor stepper max: ignition -> 3 -> 1',
                'Invalid magic node editor stepper step: ignition -> 3 -> 0',
                'Invalid magic node editor stepper defaultValue: ignition -> 3 -> 3',
                'Invalid magic node editor helpText: ignition -> 3',
                'Unknown magic node editor behavior: ignition -> 3 -> unknown',
                'Invalid magic type stat: ignition -> power',
                'Invalid magic stat branch aggregation: ignition -> castingTime -> fastest',
            ],
        });
    });

    it('requires node weight behavior to use a stepper label suffix', () => {
        const validation = validateMagicTypes([{
            type: 'weighted',
            label: 'Weighted',
            icon: '',
            color: '#fff',
            category: 'basic',
            description: 'desc',
            stats,
            instanceEditor: {
                fields: [{
                    key: 'weight',
                    label: 'Weight',
                    control: MAGIC_NODE_EDITOR_CONTROLS.TEXT,
                    presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL,
                    behavior: MAGIC_NODE_EDITOR_BEHAVIORS.NODE_WEIGHT,
                }],
            },
        }], MAGIC_NODE_CATEGORIES);

        expect(validation.errors).toEqual([
            'Invalid node weight control: weighted -> 0',
            'Invalid node weight presentation: weighted -> 0',
        ]);
    });

    it('reports invalid magic graph preset data', () => {
        const validation = validateMagicGraphPresets(
            [
                {
                    id: 'bad-preset',
                    label: '',
                    circles: [
                        {
                            id: 'circle-a',
                            position: { x: 0, y: 0 },
                            width: 480,
                            height: 640,
                            systemNodeSlots: manifestationSlot(0),
                        },
                    ],
                    systemNodePositions: [
                        { id: 'system-mana-source', position: { x: 0, y: 0 } },
                        { id: 'system-mana-source', position: { x: 1, y: 1 } },
                        { id: 'missing-system-node', position: { x: Number.NaN, y: Number.NaN } },
                    ],
                    nodes: [
                        { id: 'node-a', magicType: 'missing', circleId: 'circle-a', sequenceIndex: 0 },
                        { id: 'node-a', magicType: '', circleId: 'circle-a', sequenceIndex: -1 },
                        { id: 'system-mana-source', magicType: 'ignition', circleId: 'circle-a', sequenceIndex: 2 },
                    ],
                    edges: [
                        {
                            id: 'edge-a',
                            source: 'missing-source',
                            target: 'node-a',
                            sourceHandle: 'input-0',
                            targetHandle: 'output-0',
                        },
                        {
                            id: 'edge-a',
                            source: 'node-a',
                            target: 'missing-target',
                            sourceHandle: 'output-0',
                            targetHandle: 'input-0',
                        },
                    ],
                },
            ] as unknown as MagicGraphPresetConfig[],
            magicTypesData
        );

        expect(validation.valid).toBe(false);
        expect(validation.errors).toEqual(expect.arrayContaining([
                'Missing magic graph preset label: bad-preset',
                'Duplicate magic graph preset system node id: bad-preset: system-mana-source',
                'Unknown magic graph preset system node id: bad-preset -> missing-system-node',
                'Invalid magic graph preset system node x: bad-preset -> missing-system-node',
                'Invalid magic graph preset system node y: bad-preset -> missing-system-node',
                'Duplicate magic graph preset node id: bad-preset: node-a',
                'Invalid magic graph preset node type: bad-preset -> node-a',
                'Invalid magic graph preset node sequence: bad-preset -> node-a',
                'Duplicate magic graph preset edge id: bad-preset: edge-a',
                'Invalid magic graph preset external edge: bad-preset -> edge-a',
                'Unknown magic graph preset node type: bad-preset -> node-a -> missing',
                'Unknown magic graph preset edge source: bad-preset -> edge-a -> missing-source',
                'Unknown magic graph preset edge target: bad-preset -> edge-a -> missing-target',
        ]));
    });

    it('reports undeclared and oversized preset node settings', () => {
        expect(validateMagicGraphPresets(
            [
                {
                    id: 'bad-settings-preset',
                    label: 'Bad settings',
                    circles: [
                        {
                            id: 'circle-a',
                            position: { x: 0, y: 0 },
                            width: 480,
                            height: 640,
                            systemNodeSlots: manifestationSlot(2),
                        },
                    ],
                    nodes: [
                        {
                            id: 'custom-node',
                            magicType: 'custom',
                            circleId: 'circle-a',
                            settings: {
                                displayName: 'x'.repeat(21),
                                unknown: 'value',
                            },
                            sequenceIndex: 0,
                        },
                        {
                            id: 'detect-node',
                            magicType: 'detect',
                            circleId: 'circle-a',
                            settings: {
                                caption: 'x'.repeat(81),
                            },
                            sequenceIndex: 1,
                        },
                    ],
                    edges: [],
                },
            ],
            magicTypesData
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
                    circles: [
                        {
                            id: 'circle-a',
                            position: { x: 0, y: 0 },
                            width: 480,
                            height: 640,
                            systemNodeSlots: manifestationSlot(1),
                        },
                    ],
                    nodes: [
                        {
                            id: 'ignition-node',
                            magicType: 'ignition',
                            circleId: 'circle-a',
                            settings: { caption: '불꽃을 일으킨다' },
                            sequenceIndex: 0,
                        },
                    ],
                    edges: [],
                },
            ],
            magicTypesData
        )).toEqual({ valid: true, errors: [] });
    });

    it('accepts a caption setting for the manifestation slot', () => {
        expect(validateMagicGraphPresets(
            [{
                id: 'manifestation-caption-preset',
                label: 'Manifestation caption',
                circles: [{
                    id: 'circle-a',
                    position: { x: 0, y: 0 },
                    width: 480,
                    height: 640,
                    systemNodeSlots: manifestationSlot(0, {
                        caption: '최종 발현',
                    }),
                }],
                nodes: [],
                edges: [],
            }],
            magicTypesData
        )).toEqual({ valid: true, errors: [] });
    });

    it('accepts a valid v6 repeat pair with start-only settings', () => {
        expect(validateMagicGraphPresets(
            [{
                id: 'paired-preset',
                label: 'Paired preset',
                circles: [{
                    id: 'circle-a',
                    position: { x: 0, y: 0 },
                    width: 480,
                    height: 640,
                    systemNodeSlots: manifestationSlot(2),
                }],
                nodes: [
                    {
                        id: 'repeat-start',
                        magicType: 'repeat',
                        circleId: 'circle-a',
                        sequenceIndex: 0,
                        settings: { repeatCount: '3' },
                        controlPair: {
                            id: 'repeat-pair',
                            role: 'start',
                        },
                    },
                    {
                        id: 'repeat-end',
                        magicType: 'repeat',
                        circleId: 'circle-a',
                        sequenceIndex: 1,
                        controlPair: {
                            id: 'repeat-pair',
                            role: 'end',
                        },
                    },
                ],
                edges: [],
            }],
            magicTypesData
        )).toEqual({ valid: true, errors: [] });
    });

    it('accepts indexed dynamic circle input and output handles', () => {
        expect(validateMagicGraphPresets(
            [{
                id: 'dynamic-circle-ports',
                label: 'Dynamic circle ports',
                circles: [{
                    id: 'circle-a',
                    position: { x: 0, y: 0 },
                    width: 480,
                    height: 640,
                    systemNodeSlots: manifestationSlot(0),
                }, {
                    id: 'circle-b',
                    position: { x: 520, y: 0 },
                    width: 480,
                    height: 640,
                    systemNodeSlots: manifestationSlot(0),
                }],
                nodes: [],
                edges: [
                    {
                        id: 'source-circle',
                        source: 'circle-a',
                        target: 'circle-b',
                        sourceHandle: 'circle-output-3',
                        targetHandle: 'circle-input-2',
                    },
                ],
            }],
            magicTypesData
        )).toEqual({ valid: true, errors: [] });
    });

    it('validates configured CYOA rows against visibility conditions and image registries', () => {
        expect(validateCyoaRows(
            cyoaRowsData,
            isKnownCyoaImagePath,
            isKnownMagicType
        )).toEqual({ valid: true, errors: [] });
    });

    it('validates CYOA stat effect node targets', () => {
        expect(validateCyoaRows([{
            id: 'targeted-effects',
            title: 'Targeted effects',
            choices: [{
                id: 'targeted',
                imageAlt: '',
                title: 'Targeted',
                statEffects: [{
                    phase: 'node',
                    operation: 'add',
                    stat: 'power',
                    value: 1,
                    nodeTarget: {
                        categories: ['action'],
                        magicTypes: ['emit'],
                        statValueSign: 'positive',
                    },
                }],
            }],
        }], isKnownCyoaImagePath, isKnownMagicType)).toEqual({
            valid: true,
            errors: [],
        });
    });

    it('reports invalid CYOA stat effect node targets', () => {
        expect(validateCyoaRows([{
            id: 'targeted-effects',
            title: 'Targeted effects',
            choices: [{
                id: 'targeted',
                imageAlt: '',
                title: 'Targeted',
                statEffects: [
                    {
                        phase: 'final',
                        operation: 'add',
                        stat: 'power',
                        value: 1,
                        nodeTarget: { categories: ['action'] },
                    },
                    {
                        phase: 'node',
                        operation: 'add',
                        stat: 'power',
                        value: 1,
                        nodeTarget: {},
                    },
                    {
                        phase: 'node',
                        operation: 'add',
                        stat: 'power',
                        value: 1,
                        nodeTarget: { categories: [] },
                    },
                    {
                        phase: 'node',
                        operation: 'add',
                        stat: 'power',
                        value: 1,
                        nodeTarget: { categories: ['missing', 'action', 'action'] },
                    },
                    {
                        phase: 'node',
                        operation: 'add',
                        stat: 'power',
                        value: 1,
                        nodeTarget: { magicTypes: ['missing', 'emit', 'emit'] },
                    },
                    {
                        phase: 'node',
                        operation: 'add',
                        stat: 'power',
                        value: 1,
                        nodeTarget: { statValueSign: 'zero' },
                    },
                ],
            }],
        }] as CyoaChoiceRowConfig[], isKnownCyoaImagePath, isKnownMagicType)).toEqual({
            valid: false,
            errors: [
                'Invalid CYOA final stat effect node target: targeted -> 0',
                'Empty CYOA stat effect node target: targeted -> 1',
                'Invalid CYOA stat effect node categories: targeted -> 2',
                'Unknown CYOA stat effect node category: targeted -> 3 -> missing',
                'Duplicate CYOA stat effect node category: targeted -> 3 -> action',
                'Unknown CYOA stat effect node magic type: targeted -> 4 -> missing',
                'Duplicate CYOA stat effect node magic type: targeted -> 4 -> emit',
                'Invalid CYOA stat effect node value sign: targeted -> 5 -> zero',
            ],
        });
    });

    it('validates CYOA locked choice selection policies', () => {
        expect(validateCyoaRows([
            {
                id: 'region',
                title: 'Region',
                selectionMode: 'multi',
                requiredCount: 1,
                maxSelectedCount: 2,
                lockedChoiceIds: ['region-empire-center'],
                choices: [
                    { id: 'region-empire-center', imageAlt: '', title: 'Empire Center' },
                    { id: 'region-university-city', imageAlt: '', title: 'University City' },
                ],
            },
        ], isKnownCyoaImagePath)).toEqual({ valid: true, errors: [] });
    });

    it('reports invalid CYOA locked choice selection policies', () => {
        const validation = validateCyoaRows([
            {
                id: 'unknown-locked',
                title: 'Unknown locked',
                lockedChoiceIds: ['missing'],
                choices: [{ id: 'known', imageAlt: '', title: 'Known' }],
            },
            {
                id: 'duplicate-locked',
                title: 'Duplicate locked',
                selectionMode: 'multi',
                maxSelectedCount: 3,
                lockedChoiceIds: ['known', 'known'],
                choices: [{ id: 'known', imageAlt: '', title: 'Known' }],
            },
            {
                id: 'disabled-locked',
                title: 'Disabled locked',
                lockedChoiceIds: ['disabled'],
                choices: [{ id: 'disabled', imageAlt: '', title: 'Disabled', disabled: true }],
            },
            {
                id: 'bad-max',
                title: 'Bad max',
                maxSelectedCount: -1,
                choices: [{ id: 'known', imageAlt: '', title: 'Known' }],
            },
            {
                id: 'required-over-max',
                title: 'Required over max',
                selectionMode: 'multi',
                requiredCount: 2,
                maxSelectedCount: 1,
                choices: [
                    { id: 'a', imageAlt: '', title: 'A' },
                    { id: 'b', imageAlt: '', title: 'B' },
                ],
            },
            {
                id: 'locked-over-max',
                title: 'Locked over max',
                selectionMode: 'multi',
                maxSelectedCount: 1,
                lockedChoiceIds: ['a', 'b'],
                choices: [
                    { id: 'a', imageAlt: '', title: 'A' },
                    { id: 'b', imageAlt: '', title: 'B' },
                ],
            },
            {
                id: 'single-over-max',
                title: 'Single over max',
                selectionMode: 'single',
                maxSelectedCount: 2,
                choices: [
                    { id: 'a', imageAlt: '', title: 'A' },
                    { id: 'b', imageAlt: '', title: 'B' },
                ],
            },
            {
                id: 'bad-locked-shape',
                title: 'Bad locked shape',
                requiredCount: 0,
                lockedChoiceIds: {},
                choices: [],
            },
            {
                id: 'bad-locked-id',
                title: 'Bad locked id',
                requiredCount: 0,
                lockedChoiceIds: [123],
                choices: [],
            },
        ] as unknown as CyoaChoiceRowConfig[], isKnownCyoaImagePath);

        expect(validation.errors).toEqual(expect.arrayContaining([
            'Unknown CYOA locked choice: unknown-locked -> missing',
            'Duplicate CYOA locked choice id: duplicate-locked -> known',
            'Invalid disabled CYOA locked choice: disabled-locked -> disabled',
            'Invalid CYOA max selected count: bad-max -> -1',
            'Invalid CYOA required count exceeds max selected count: required-over-max -> 2',
            'Invalid CYOA locked choice count exceeds max selected count: locked-over-max -> 2',
            'Invalid CYOA single-select max selected count: single-over-max -> 2',
            'Invalid CYOA locked choice ids: bad-locked-shape',
            'Invalid CYOA locked choice id: bad-locked-id -> 0',
        ]));
    });

    it('reports invalid nested CYOA choice groups', () => {
        const validation = validateCyoaRows([
            {
                id: 'row',
                title: 'Row',
                choices: [
                    {
                        id: 'parent-a',
                        imageAlt: '',
                        title: 'Parent A',
                        subChoiceGroup: {
                            id: 'row',
                            title: '',
                            requiredCount: 2,
                            selectionMode: 'single',
                            choices: [
                                { id: 'duplicate-child', imageAlt: '', title: 'Child' },
                            ],
                        },
                    },
                    {
                        id: 'parent-b',
                        imageAlt: '',
                        title: 'Parent B',
                        subChoiceGroup: {
                            id: 'row',
                            title: 'Invalid group',
                            requiredCount: -1,
                            selectionMode: 'double',
                            choices: [
                                {
                                    id: 'duplicate-child',
                                    imagePath: '../assets/images/missing.webp',
                                    imageAlt: '',
                                    title: 'Nested child',
                                    width: '3/2',
                                    statEffects: [
                                        { phase: 'before', operation: 'add', stat: 'power', value: 1 },
                                    ],
                                    subChoiceGroup: {
                                        id: 'too-deep',
                                        title: 'Too deep',
                                        choices: [],
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        ] as unknown as CyoaChoiceRowConfig[], isKnownCyoaImagePath);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toEqual(expect.arrayContaining([
            'Duplicate CYOA sub-choice group id: row',
            'Duplicate CYOA selection group id: row',
            'Duplicate CYOA choice id: duplicate-child',
            'Invalid CYOA sub-choice group title: row',
            'CYOA sub-choice required count exceeds choices: row -> 2',
            'Invalid CYOA single-select sub-choice required count: row -> 2',
            'Invalid CYOA sub-choice required count: row -> -1',
            'Invalid CYOA sub-choice selection mode: row -> double',
            'Unknown CYOA image path: duplicate-child -> ../assets/images/missing.webp',
            'Invalid CYOA choice width: duplicate-child -> 3/2',
            'Invalid CYOA stat effect phase: duplicate-child -> 0 -> before',
            'Invalid nested CYOA sub-choice group: duplicate-child',
        ]));
    });

    it('validates configured CYOA dialogue scripts against image registries', () => {
        expect(validateCyoaDialogueScripts(
            cyoaDialogueScriptsData,
            isKnownCyoaImagePath
        )).toEqual({ valid: true, errors: [] });
    });

    it('validates configured magic glyphs against magic type data', () => {
        expect(validateMagicGlyphs(
            magicGlyphsData,
            magicTypesData
        )).toEqual({ valid: true, errors: [] });
    });

    it('validates configured magic glyph shapes', () => {
        expect(validateMagicGlyphShapes(
            magicGlyphShapesData
        )).toEqual({ valid: true, errors: [] });
    });

    it('reports invalid magic glyph data', () => {
        expect(validateMagicGlyphs(
            [
                { magicType: 'ignition', baseCount: 12 },
                { magicType: 'ignition', runeKinds: ['missing-rune'], baseCount: 0 },
                { magicType: 'missing', baseCount: 1 },
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

    it('reports invalid CYOA row NPC description', () => {
        expect(validateCyoaRows(
            [{
                id: 'region',
                title: 'Region',
                npcDescription: 123,
                choices: [],
            }] as unknown as CyoaChoiceRowConfig[],
            isKnownCyoaImagePath
        )).toEqual({
            valid: false,
            errors: ['Invalid CYOA row NPC description: region'],
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

    it('reports unknown and duplicate CYOA input roles', () => {
        const validation = validateCyoaRows([
            {
                id: 'signature-a',
                title: 'Signature A',
                input: { id: 'signature-a-input', label: 'A', role: 'signatureName' },
            },
            {
                id: 'signature-b',
                title: 'Signature B',
                input: { id: 'signature-b-input', label: 'B', role: 'signatureName' },
            },
            {
                id: 'unknown-role',
                title: 'Unknown',
                input: { id: 'unknown-input', label: 'Unknown', role: 'displayName' },
            },
        ], isKnownCyoaImagePath);

        expect(validation.errors).toEqual(expect.arrayContaining([
            'Duplicate CYOA input role: signatureName',
            'Unknown CYOA input role: unknown-role -> displayName',
        ]));
    });

    it('returns invalid results instead of throwing for malformed data structures', () => {
        const validations = [
            validateMagicTypes(null, MAGIC_NODE_CATEGORIES),
            validateSystemMagicTypes([null], MAGIC_NODE_CATEGORIES),
            validateMagicStatRuleConfigs(null),
            validateMagicGraphPresets([{ id: 'bad', nodes: {}, edges: [] }], []),
            validateMagicGraphPresets(
                [{ id: 'bad', label: 'Bad', nodes: [], edges: [] }],
                [{ type: 'bad', instanceEditor: { fields: {} } }]
            ),
            validateMagicGlyphs([{ magicType: 'bad', runeKinds: {} }], []),
            validateMagicGlyphShapes({ bad: { paths: {} } }),
            validateMagicGlyphShapes({ bad: { paths: [{ d: 1 }] } }),
            validateCyoaRows([{ id: 'bad', choices: {} }], isKnownCyoaImagePath),
            validateCyoaDialogueScripts([
                { id: 'bad', optionRows: [{ id: 'row', options: {} }] },
            ], isKnownCyoaImagePath),
        ];

        validations.forEach(validation => {
            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
        });
    });
});
