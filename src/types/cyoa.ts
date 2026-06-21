import type {
    CyoaChoiceImagePlacement,
    CyoaChoiceImageSize,
    CyoaDialogueTextVariant,
    CyoaSelectionMode,
} from '../constants/gameConfigs';
import type { MagicStatEffectConfig, MagicStatKey, MagicStats } from './magic';

export interface CyoaRowVisibilityCondition {
    choiceSelected?: string;
    anyChoiceSelected?: string[];
    allChoicesSelected?: string[];
}

export interface CyoaTextInputConfig {
    id: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
}

export interface CyoaChoiceBaseConfig {
    id: string;
    imagePath?: string;
    imageAlt: string;
    imageSize?: CyoaChoiceImageSize;
    imagePlacement?: CyoaChoiceImagePlacement;
    title: string;
    description?: string;
    tooltip?: string;
    width?: string;
    disabled?: boolean;
    statEffects?: MagicStatEffectConfig[];
}

export type CyoaSubChoiceConfig = CyoaChoiceBaseConfig;

export interface CyoaSubChoiceGroupConfig {
    id: string;
    title: string;
    requiredCount?: number;
    selectionMode?: CyoaSelectionMode;
    choices: CyoaSubChoiceConfig[];
}

export interface CyoaChoiceConfig extends CyoaChoiceBaseConfig {
    subChoiceGroup?: CyoaSubChoiceGroupConfig;
}

export interface CyoaChoiceRowConfig {
    id: string;
    title: string;
    description?: string;
    visible?: boolean;
    selectable?: boolean;
    requiredCount?: number;
    visibleWhen?: CyoaRowVisibilityCondition;
    selectionMode?: CyoaSelectionMode;
    input?: CyoaTextInputConfig;
    choices?: CyoaChoiceConfig[];
}

export interface CyoaChoiceBase {
    id: string;
    imageSrc?: string;
    imageAlt: string;
    imageSize?: CyoaChoiceImageSize;
    imagePlacement?: CyoaChoiceImagePlacement;
    title: string;
    description?: string;
    tooltip?: string;
    width?: string;
    layoutSpan?: number;
    disabled?: boolean;
    statEffects?: MagicStatEffectConfig[];
}

export type CyoaSubChoice = CyoaChoiceBase;

export interface CyoaSubChoiceGroupData {
    id: string;
    title: string;
    requiredCount: number;
    selectionMode: CyoaSelectionMode;
    choices: CyoaSubChoice[];
}

export interface CyoaChoice extends CyoaChoiceBase {
    subChoiceGroup?: CyoaSubChoiceGroupData;
}

export interface CyoaChoiceRowData {
    id: string;
    title: string;
    description?: string;
    visible: boolean;
    selectable: boolean;
    requiredCount: number;
    visibleWhen?: CyoaRowVisibilityCondition;
    selectionMode: CyoaSelectionMode;
    layoutColumns: number;
    input?: CyoaTextInputConfig;
    choices: CyoaChoice[];
}

export interface CyoaDialogueOptionConfig {
    id: string;
    playerLine: string;
    npcLine: CyoaDialogueLine;
    npcImagePath?: string;
    npcImageAlt?: string;
}

export interface CyoaDialogueTextSegment {
    text: string;
    variant?: CyoaDialogueTextVariant;
}

export type CyoaDialogueLine = string | CyoaDialogueTextSegment[];

export interface CyoaDialogueResultContext {
    circleCount: number;
    totalStats: MagicStats;
}

export interface CyoaDialogueNumericRangeCondition {
    min?: number;
    max?: number;
}

export interface CyoaDialogueResultCondition {
    circleCount?: CyoaDialogueNumericRangeCondition;
    totalStats?: Partial<Record<MagicStatKey, CyoaDialogueNumericRangeCondition>>;
}

export interface CyoaDialogueResultLineConfig {
    when: CyoaDialogueResultCondition;
    npcLine: CyoaDialogueLine;
}

export interface CyoaDialogueOptionRowConfig extends Pick<
    CyoaChoiceRowConfig,
    'id' | 'visible' | 'visibleWhen' | 'selectionMode'
> {
    resultWhen?: CyoaDialogueResultCondition;
    options: CyoaDialogueOptionConfig[];
}

export interface CyoaDialogueScriptConfig {
    id: string;
    title: string;
    npcName: string;
    npcTitle: string;
    imagePath?: string;
    imageAlt: string;
    defaultNpcLine: CyoaDialogueLine;
    resultLines?: CyoaDialogueResultLineConfig[];
    options?: CyoaDialogueOptionConfig[];
    optionRows?: CyoaDialogueOptionRowConfig[];
}

export interface CyoaDialogueOptionData extends CyoaDialogueOptionConfig {
    choice: CyoaChoice;
    npcImageSrc?: string;
}

export interface CyoaDialogueOptionRowData extends CyoaChoiceRowData {
    resultWhen?: CyoaDialogueResultCondition;
    options: CyoaDialogueOptionData[];
}

export interface CyoaDialogueScriptData extends Omit<CyoaDialogueScriptConfig, 'imagePath' | 'options' | 'optionRows'> {
    imageSrc?: string;
    options: CyoaDialogueOptionData[];
    optionRows: CyoaDialogueOptionRowData[];
}

export type CyoaRowVisibility = Record<string, boolean>;
export type CyoaRowSelections = Record<string, string[]>;
export type CyoaInputValues = Record<string, string>;
