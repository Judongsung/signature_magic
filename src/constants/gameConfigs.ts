export const APP_PHASES = {
    CYOA: 1,
    NODE_COMPOSITION: 2,
} as const;

export type AppPhase = (typeof APP_PHASES)[keyof typeof APP_PHASES];

export const CYOA_ACTIONS = {
    OPEN_ROW: 'OPEN_ROW',
} as const;

export type CyoaAction = (typeof CYOA_ACTIONS)[keyof typeof CYOA_ACTIONS];
