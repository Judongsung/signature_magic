import type { MAGIC_NODE_EDITOR_CONTROLS, MagicNodeCategory, MagicNodeEditorBehavior, MagicNodeEditorPresentation } from '../constants/nodeEditorConfigs';
import type { Node } from '@xyflow/svelte';
import {
    MAGIC_STAT_AGGREGATION_OPERATIONS,
    MAGIC_STAT_BRANCH_AGGREGATIONS,
    MAGIC_STAT_SCALING_OPERATIONS,
} from '../constants/magicStatConfigs';

export type MagicType = string;

export const MAGIC_STAT_KEYS = [
    'castingTime',
    'instability',
    'power',
    'range',
    'manaCost',
    'duration',
] as const;

export type MagicStatKey = (typeof MAGIC_STAT_KEYS)[number];

export type MagicStats = Record<MagicStatKey, number>;

export type MagicStatsConfig = Partial<MagicStats>;

export const MAGIC_STAT_EFFECT_PHASES = ['node', 'final'] as const;

export type MagicStatEffectPhase = (typeof MAGIC_STAT_EFFECT_PHASES)[number];

export const MAGIC_STAT_EFFECT_OPERATIONS = ['add', 'multiply'] as const;

export type MagicStatEffectOperation = (typeof MAGIC_STAT_EFFECT_OPERATIONS)[number];

export const MAGIC_STAT_EFFECT_VALUE_SIGNS = {
    POSITIVE: 'positive',
    NEGATIVE: 'negative',
} as const;

export type MagicStatEffectValueSign =
    (typeof MAGIC_STAT_EFFECT_VALUE_SIGNS)[keyof typeof MAGIC_STAT_EFFECT_VALUE_SIGNS];

export interface MagicStatEffectNodeTarget {
    categories?: readonly MagicNodeCategory[];
    magicTypes?: readonly MagicType[];
    statValueSign?: MagicStatEffectValueSign;
}

export interface MagicStatEffectConfig {
    phase: MagicStatEffectPhase;
    operation: MagicStatEffectOperation;
    stat: MagicStatKey;
    value: number;
    nodeTarget?: MagicStatEffectNodeTarget;
}

export interface MagicStatEffectBundle {
    nodeEffects: MagicStatEffectConfig[];
    finalEffects: MagicStatEffectConfig[];
}

export type MagicStatBranchAggregation =
    (typeof MAGIC_STAT_BRANCH_AGGREGATIONS)[keyof typeof MAGIC_STAT_BRANCH_AGGREGATIONS];

export type MagicStatAggregationOperation =
    (typeof MAGIC_STAT_AGGREGATION_OPERATIONS)[keyof typeof MAGIC_STAT_AGGREGATION_OPERATIONS];

export type MagicStatScalingOperation =
    (typeof MAGIC_STAT_SCALING_OPERATIONS)[keyof typeof MAGIC_STAT_SCALING_OPERATIONS];

export interface MagicStatScalingConfig {
    operation: MagicStatScalingOperation;
    factor?: number;
}

export interface MagicStatBoundsConfig {
    minimum?: number;
    maximum?: number;
}

export interface MagicStatBoundsOverrideConfig {
    minimum?: number | null;
    maximum?: number | null;
}

export type MagicNodeStatBoundsConfig =
    Partial<Record<MagicStatKey, MagicStatBoundsOverrideConfig>>;

export interface MagicStatRuleConfig {
    nodeAggregation: MagicStatAggregationOperation;
    serialAggregation: MagicStatAggregationOperation;
    branchAggregation: MagicStatAggregationOperation;
    scaling: MagicStatScalingConfig;
    bounds?: MagicStatBoundsConfig;
}

export type MagicStatRulesConfig = Partial<Record<MagicStatKey, MagicStatRuleConfig>>;

export interface MagicNodeStatRuleConfig {
    branchAggregation?: MagicStatBranchAggregation;
}

export type MagicNodeStatRulesConfig = Partial<Record<MagicStatKey, MagicNodeStatRuleConfig>>;

export const EMPTY_MAGIC_STATS: MagicStats = {
    castingTime: 0,
    instability: 0,
    power: 0,
    range: 0,
    manaCost: 0,
    duration: 0,
};

export interface MagicSignatureMetadata {
    name: string;
    description: string;
}

export const EMPTY_MAGIC_SIGNATURE_METADATA: MagicSignatureMetadata = {
    name: '',
    description: '',
};

interface MagicNodeEditorFieldBaseConfig {
    key: string;
    label: string;
    helpText?: string;
    presentation?: MagicNodeEditorPresentation;
    behavior?: MagicNodeEditorBehavior;
}

export interface MagicNodeTextEditorFieldConfig extends MagicNodeEditorFieldBaseConfig {
    control: typeof MAGIC_NODE_EDITOR_CONTROLS.TEXT;
    maxLength?: number;
    placeholder?: string;
}

export interface MagicNodeStepperEditorFieldConfig extends MagicNodeEditorFieldBaseConfig {
    control: typeof MAGIC_NODE_EDITOR_CONTROLS.STEPPER;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
}

export type MagicNodeEditorFieldConfig =
    | MagicNodeTextEditorFieldConfig
    | MagicNodeStepperEditorFieldConfig;

export interface MagicNodeInstanceEditorConfig {
    fields: MagicNodeEditorFieldConfig[];
}

export type MagicNodeSettings = Record<string, string>;

export type MagicNodeKind = 'user' | 'system';
export type MagicEditorNodeKind = MagicNodeKind | 'circle';
export type MagicCircleStatus = 'empty' | 'valid';
export type MagicCirclePortDirection = 'input' | 'output';
export type MagicControlPairRole = 'start' | 'end';

export interface MagicControlPairRef {
    id: string;
    role: MagicControlPairRole;
}

export interface MagicTypeConfig {
    type: MagicType;
    label: string;
    icon: string;
    color: string;
    category: MagicNodeCategory;
    description: string;
    instanceEditor?: MagicNodeInstanceEditorConfig;
    stats?: MagicStatsConfig;
    statBounds?: MagicNodeStatBoundsConfig;
    statRules?: MagicNodeStatRulesConfig;
}

export interface MagicNodeData extends Record<string, unknown> {
    magicType: MagicType;
    settings?: MagicNodeSettings;
    nodeKind?: MagicNodeKind;
    showTooltip?: boolean;
    excludeFromStatScaling?: boolean;
    sequenceIndex?: number;
    controlPair?: MagicControlPairRef;
}

export interface MagicGraphNode {
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: MagicNodeData;
    deletable?: boolean;
}

export type MagicNode = Node<MagicNodeData> & MagicGraphNode;

export interface MagicCircleMetadata {
    name?: string;
    caption?: string;
}

export interface MagicCircleNodeData extends MagicCircleMetadata, Record<string, unknown> {
    nodeKind: Extract<MagicEditorNodeKind, 'circle'>;
    inputHandleCount: number;
    outputHandleCount: number;
}

export type MagicCircleNode = Node<MagicCircleNodeData> & {
    type: 'magicCircle';
    width: number;
    height: number;
};

export type MagicEditorNode = MagicNode | MagicCircleNode;

export interface MagicGraphPresetCircleConfig extends MagicCircleMetadata {
    id: string;
    position: { x: number; y: number };
    width: number;
    height: number;
    systemNodeSlots: MagicGraphPresetCircleSystemNodeSlotConfig[];
}

export interface MagicGraphPresetCircleSystemNodeSlotConfig {
    magicType: MagicType;
    slotIndex: number;
    settings?: MagicNodeSettings;
}

export interface MagicGraphPresetNodeConfig {
    id: string;
    magicType: MagicType;
    settings?: MagicNodeSettings;
    circleId: string;
    sequenceIndex: number;
    controlPair?: MagicControlPairRef;
}

export interface MagicGraphPresetEdgeConfig {
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
}

export interface MagicGraphPresetConfig {
    id: string;
    label: string;
    circles: MagicGraphPresetCircleConfig[];
    nodes: MagicGraphPresetNodeConfig[];
    edges: MagicGraphPresetEdgeConfig[];
}

export interface MagicCircleState {
    circleId: string;
    nodeIds: string[];
    isInternallyValid: boolean;
    displayOrder: number;
}

export interface CirclePath {
    id: string;
    nodes: MagicGraphNode[];
    stats: MagicStats;
    statAdjustments: MagicStats;
}

export interface MagicCalculationResult {
    circles: CirclePath[];
    circleStates: MagicCircleState[];
    totalStats: MagicStats;
    totalStatAdjustments: MagicStats;
}
