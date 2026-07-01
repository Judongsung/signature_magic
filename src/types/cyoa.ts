import type { CyoaChoiceImagePlacement, CyoaChoiceImageSize, CyoaDialogueTextVariant, CyoaInputRole, CyoaSelectionMode } from '../constants/cyoaConfigs';
import type { MagicStatEffectConfig } from './magicStatEffects';
import type { MagicStatKey, MagicStats } from './magicStats';

export interface CyoaRowVisibilityCondition {
    choiceSelected?: string;
    anyChoiceSelected?: string[];
    allChoicesSelected?: string[];
}

export interface CyoaTextInputConfig {
    id: string;
    label: string;
    role?: CyoaInputRole;
    placeholder?: string;
    defaultValue?: string;
}

export interface CyoaChoiceCommon {
    id: string;
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

export interface CyoaChoiceBaseConfig extends CyoaChoiceCommon {
    imagePath?: string;
}

export type CyoaSubChoiceConfig = CyoaChoiceBaseConfig;

export interface CyoaSubChoiceGroupCommon<TChoice> {
    id: string;
    title: string;
    choices: TChoice[];
}

export interface CyoaSubChoiceGroupConfig extends CyoaSubChoiceGroupCommon<CyoaSubChoiceConfig> {
    requiredCount?: number;
    selectionMode?: CyoaSelectionMode;
}

export interface CyoaChoiceConfig extends CyoaChoiceBaseConfig {
    subChoiceGroup?: CyoaSubChoiceGroupConfig;
}

export interface CyoaChoiceRowCommon {
    id: string;
    title: string;
    description?: string;
    npcDescription?: string;
    visibleWhen?: CyoaRowVisibilityCondition;
}

export interface CyoaChoiceRowConfig extends CyoaChoiceRowCommon {
    visible?: boolean;
    selectable?: boolean;
    requiredCount?: number;
    maxSelectedCount?: number;
    lockedChoiceIds?: string[];
    selectionMode?: CyoaSelectionMode;
    input?: CyoaTextInputConfig;
    choices?: CyoaChoiceConfig[];
}

export interface CyoaChoiceBase extends CyoaChoiceCommon {
    imageSrc?: string;
    layoutSpan?: number;
}

export type CyoaSubChoice = CyoaChoiceBase;

export interface CyoaSubChoiceGroupData extends CyoaSubChoiceGroupCommon<CyoaSubChoice> {
    requiredCount: number;
    selectionMode: CyoaSelectionMode;
}

export interface CyoaChoice extends CyoaChoiceBase {
    subChoiceGroup?: CyoaSubChoiceGroupData;
}

export interface CyoaChoiceRowData extends CyoaChoiceRowCommon {
    visible: boolean;
    selectable: boolean;
    requiredCount: number;
    maxSelectedCount?: number;
    lockedChoiceIds?: string[];
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

export interface CyoaDialogueScriptCommon {
    id: string;
    title: string;
    npcName: string;
    npcTitle: string;
    imageAlt: string;
    defaultNpcLine: CyoaDialogueLine;
    resultLines?: CyoaDialogueResultLineConfig[];
}

export interface CyoaDialogueScriptConfig extends CyoaDialogueScriptCommon {
    imagePath?: string;
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

export interface CyoaDialogueScriptData extends CyoaDialogueScriptCommon {
    imageSrc?: string;
    options: CyoaDialogueOptionData[];
    optionRows: CyoaDialogueOptionRowData[];
}

export type CyoaRowVisibility = Record<string, boolean>;
export type CyoaRowSelections = Record<string, string[]>;
export type CyoaInputValues = Record<string, string>;
