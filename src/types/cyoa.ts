import type { CyoaAction } from '../constants/gameConfigs';

export type CyoaRequirementMode = 'always' | 'visible' | 'never';

export interface CyoaTextInputConfig {
    id: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
}

export interface CyoaChoiceActionConfig {
    func: CyoaAction;
    target_id?: string;
}

export interface CyoaChoiceConfig {
    id: string;
    imagePath?: string;
    imageAlt: string;
    title: string;
    description?: string;
    tooltip?: string;
    width?: string;
    disabled?: boolean;
    actions?: CyoaChoiceActionConfig[];
}

export interface CyoaChoiceRowConfig {
    id: string;
    title: string;
    visible?: boolean;
    selectable?: boolean;
    required?: boolean;
    requiredMode?: CyoaRequirementMode;
    selectionMode?: 'single' | 'multi';
    input?: CyoaTextInputConfig;
    choices?: CyoaChoiceConfig[];
}

export interface CyoaChoice {
    id: string;
    imageSrc?: string;
    imageAlt: string;
    title: string;
    description?: string;
    tooltip?: string;
    width?: string;
    layoutSpan?: number;
    disabled?: boolean;
    actions?: CyoaChoiceActionConfig[];
}

export interface CyoaChoiceRowData {
    id: string;
    title: string;
    visible: boolean;
    selectable: boolean;
    required: boolean;
    requiredMode: CyoaRequirementMode;
    selectionMode: 'single' | 'multi';
    layoutColumns: number;
    input?: CyoaTextInputConfig;
    choices: CyoaChoice[];
}

export interface CyoaDialogueOptionConfig {
    id: string;
    playerLine: string;
    npcLine: string;
}

export interface CyoaDialogueScriptConfig {
    id: string;
    title: string;
    npcName: string;
    npcTitle: string;
    imagePath?: string;
    imageAlt: string;
    defaultOptionId: string;
    options: CyoaDialogueOptionConfig[];
}

export interface CyoaDialogueOptionData extends CyoaDialogueOptionConfig {
    choice: CyoaChoice;
}

export interface CyoaDialogueScriptData extends Omit<CyoaDialogueScriptConfig, 'imagePath' | 'options'> {
    imageSrc?: string;
    options: CyoaDialogueOptionData[];
}
