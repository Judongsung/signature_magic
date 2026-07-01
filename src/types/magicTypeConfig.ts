import type {
    MAGIC_NODE_EDITOR_CONTROLS,
    MagicNodeCategory,
    MagicNodeEditorBehavior,
    MagicNodeEditorPresentation,
} from '../constants/nodeEditorConfigs';
import type {
    MagicNodeStatBoundsConfig,
    MagicNodeStatRulesConfig,
    MagicStatsConfig,
} from './magicStats';

export type MagicType = string;

interface MagicNodeEditorFieldBaseConfig {
    key: string;
    label: string;
    helpText?: string;
    presentation?: MagicNodeEditorPresentation;
    behavior?: MagicNodeEditorBehavior;
}

export interface MagicNodeTextEditorFieldConfig
    extends MagicNodeEditorFieldBaseConfig {
    control: typeof MAGIC_NODE_EDITOR_CONTROLS.TEXT;
    maxLength?: number;
    placeholder?: string;
}

export interface MagicNodeStepperEditorFieldConfig
    extends MagicNodeEditorFieldBaseConfig {
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
