export const APP_PHASES = {
    CYOA: 1,
    NODE_COMPOSITION: 2,
} as const;

export type AppPhase = (typeof APP_PHASES)[keyof typeof APP_PHASES];

