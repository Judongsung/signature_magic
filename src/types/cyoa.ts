import type {
    CyoaChoiceImagePlacement,
    CyoaChoiceImageSize,
    CyoaDialogueTextVariant,
    CyoaSelectionMode,
} from '../constants/gameConfigs';
import type { MagicStatEffectConfig } from './magic';

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

export interface CyoaChoiceConfig {
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

export interface CyoaChoice {
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

export interface CyoaDialogueOptionRowConfig extends Pick<
    CyoaChoiceRowConfig,
    'id' | 'visible' | 'visibleWhen' | 'selectionMode'
> {
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
    options?: CyoaDialogueOptionConfig[];
    optionRows?: CyoaDialogueOptionRowConfig[];
}

export interface CyoaDialogueOptionData extends CyoaDialogueOptionConfig {
    choice: CyoaChoice;
    npcImageSrc?: string;
}

export interface CyoaDialogueOptionRowData extends CyoaChoiceRowData {
    options: CyoaDialogueOptionData[];
}

export interface CyoaDialogueScriptData extends Omit<CyoaDialogueScriptConfig, 'imagePath' | 'options' | 'optionRows'> {
    imageSrc?: string;
    options: CyoaDialogueOptionData[];
    optionRows: CyoaDialogueOptionRowData[];
}
