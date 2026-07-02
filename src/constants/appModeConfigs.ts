import {
    APP_PHASES,
    type AppPhase,
} from './appPhaseConfigs';

export const APP_MODES = {
    CYOA: 'cyoa',
    META: 'meta',
} as const;

export type AppMode = (typeof APP_MODES)[keyof typeof APP_MODES];

export interface AppModeConfig {
    phaseOrder: readonly AppPhase[];
    usesCyoaStatEffects: boolean;
    enforcesMaximumMana: boolean;
}

export const APP_MODE_CONFIGS = {
    [APP_MODES.CYOA]: {
        phaseOrder: [
            APP_PHASES.INTRO_DIALOGUE,
            APP_PHASES.CYOA,
            APP_PHASES.NODE_INTRO_DIALOGUE,
            APP_PHASES.NODE_COMPOSITION,
            APP_PHASES.NODE_RESULT_DIALOGUE,
        ],
        usesCyoaStatEffects: true,
        enforcesMaximumMana: true,
    },
    [APP_MODES.META]: {
        phaseOrder: [
            APP_PHASES.NODE_COMPOSITION,
            APP_PHASES.MAGIC_RESULT,
        ],
        usesCyoaStatEffects: false,
        enforcesMaximumMana: false,
    },
} as const satisfies Record<AppMode, AppModeConfig>;

export function getAppModeConfig(mode: AppMode): AppModeConfig {
    return APP_MODE_CONFIGS[mode];
}

export function getInitialAppPhase(mode: AppMode): AppPhase {
    return APP_MODE_CONFIGS[mode].phaseOrder[0];
}

export function isAppPhaseInMode(
    mode: AppMode,
    phase: AppPhase
): boolean {
    const phaseOrder: readonly AppPhase[] = APP_MODE_CONFIGS[mode].phaseOrder;
    return phaseOrder.includes(phase);
}
