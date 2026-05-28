export type CyoaChoiceImageKey = 'hero' | 'svelte' | 'vite';

export interface CyoaChoiceConfig {
    id: string;
    imageKey: CyoaChoiceImageKey;
    imageAlt: string;
    title: string;
    description: string;
}

export interface CyoaChoice {
    id: string;
    imageSrc: string;
    imageAlt: string;
    title: string;
    description: string;
}
