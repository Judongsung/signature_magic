export const APP_PHASES = {
    CYOA: 1,
    NODE_COMPOSITION: 2,
} as const;

export type AppPhase = (typeof APP_PHASES)[keyof typeof APP_PHASES];

export const CYOA_ACTIONS = {
    OPEN_ROW: 'OPEN_ROW',
} as const;

export type CyoaAction = (typeof CYOA_ACTIONS)[keyof typeof CYOA_ACTIONS];

export const CYOA_TEMP_IMAGE_PATH = '../assets/images/temp.webp';

export const EDITOR_CANVAS = {
    SNAP_GRID: [40, 40],
    EXTENT: [[-1200, -800], [1200, 800]],
} as const;

export const MAGIC_NODE_CATEGORIES = [
    { id: 'basic', label: '기초' },
    { id: 'action', label: '행동' },
    { id: 'control', label: '조절' },
    { id: 'extension', label: '확장' },
] as const;

export type MagicNodeCategory = (typeof MAGIC_NODE_CATEGORIES)[number]['id'];
