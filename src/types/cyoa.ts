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
    description: string;
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
    imageSrc: string;
    imageAlt: string;
    title: string;
    description: string;
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
    input?: CyoaTextInputConfig;
    choices: CyoaChoice[];
}
