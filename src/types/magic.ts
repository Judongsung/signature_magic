import type { Node } from '@xyflow/svelte';
import {
    MAGIC_CONNECTION_RULE_KEYS,
    type MagicNodeCategory,
    type MagicNodeEditorControl,
    type MagicNodeEditorPresentation,
} from '../constants/gameConfigs';
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

export interface MagicStatEffectConfig {
    phase: MagicStatEffectPhase;
    operation: MagicStatEffectOperation;
    stat: MagicStatKey;
    value: number;
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

export interface MagicStatRuleConfig {
    nodeAggregation: MagicStatAggregationOperation;
    serialAggregation: MagicStatAggregationOperation;
    branchAggregation: MagicStatAggregationOperation;
    scaling: MagicStatScalingConfig;
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

export interface MagicNodeConnectionLimits {
    // undefined는 기본 제한, null은 무제한, 0은 시스템 노드의 방향별 연결 금지를 뜻한다.
    maxInputs?: number | null;
    maxOutputs?: number | null;
}

export interface MagicNodeConnectionRules {
    [MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT]?: boolean;
}

export interface MagicNodeEditorFieldConfig {
    key: string;
    label: string;
    control: MagicNodeEditorControl;
    maxLength?: number;
    placeholder?: string;
    presentation?: MagicNodeEditorPresentation;
}

export interface MagicNodeInstanceEditorConfig {
    fields: MagicNodeEditorFieldConfig[];
}

export type MagicNodeSettings = Record<string, string>;

export type MagicNodeKind = 'user' | 'system';

export interface MagicTypeConfig {
    type: MagicType;
    label: string;
    icon: string;
    color: string;
    category: MagicNodeCategory;
    description: string;
    connectionLimits?: MagicNodeConnectionLimits;
    connectionRules?: MagicNodeConnectionRules;
    instanceEditor?: MagicNodeInstanceEditorConfig;
    stats?: MagicStatsConfig;
    statRules?: MagicNodeStatRulesConfig;
}

export interface MagicNodeData extends Record<string, unknown> {
    magicType: MagicType;
    settings?: MagicNodeSettings;
    nodeKind?: MagicNodeKind;
    isRoot?: boolean;
    isLeaf?: boolean;
    inputHandleCount?: number;
    outputHandleCount?: number;
    cycleInputHandleIndex?: number;
    cycleInputHandleConnected?: boolean;
    showTooltip?: boolean;
    showBadges?: boolean;
}

export interface MagicGraphNode {
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: MagicNodeData;
    deletable?: boolean;
}

export type MagicNode = Node<MagicNodeData> & MagicGraphNode;

export interface MagicGraphPresetNodeConfig {
    id: string;
    magicType: MagicType;
    settings?: MagicNodeSettings;
    position: { x: number; y: number };
}

export interface MagicGraphPresetSystemNodePositionConfig {
    id: string;
    position: { x: number; y: number };
}

export interface MagicGraphPresetEdgeConfig {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface MagicGraphPresetConfig {
    id: string;
    label: string;
    systemNodePositions?: MagicGraphPresetSystemNodePositionConfig[];
    nodes: MagicGraphPresetNodeConfig[];
    edges: MagicGraphPresetEdgeConfig[];
}

export interface CirclePath {
    id: string;
    nodes: MagicGraphNode[];
    stats: MagicStats;
}

export interface MagicCalculationResult {
    circles: CirclePath[];
    totalStats: MagicStats;
}
