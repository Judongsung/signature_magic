import type { CyoaAction } from '../constants/gameConfigs';

export type CyoaChoiceImageKey = 'hero' | 'svelte' | 'vite';

export interface CyoaChoiceActionConfig {
    func: CyoaAction;
    target_id?: string;
}

export interface CyoaChoiceConfig {
    id: string;
    imageKey: CyoaChoiceImageKey;
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
    selectionMode?: 'single' | 'multi';
    choices: CyoaChoiceConfig[];
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
    selectionMode: 'single' | 'multi';
    choices: CyoaChoice[];
}
