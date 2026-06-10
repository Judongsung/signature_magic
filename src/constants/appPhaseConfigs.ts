import {
    APP_PHASES,
    CYOA_DIALOGUE_SCRIPT_IDS,
    type AppPhase,
    type CyoaDialogueScriptId,
} from './gameConfigs';

export const APP_PHASE_SCREEN_KINDS = {
    DIALOGUE: 'dialogue',
    CYOA: 'cyoa',
    NODE_COMPOSITION: 'nodeComposition',
} as const;

type AppPhaseScreenKind =
    (typeof APP_PHASE_SCREEN_KINDS)[keyof typeof APP_PHASE_SCREEN_KINDS];

interface BaseAppPhaseConfig {
    phase: AppPhase;
    screen: AppPhaseScreenKind;
}

interface DialogueAppPhaseConfig extends BaseAppPhaseConfig {
    screen: typeof APP_PHASE_SCREEN_KINDS.DIALOGUE;
    dialogueScriptId: CyoaDialogueScriptId;
}

interface StandardAppPhaseConfig extends BaseAppPhaseConfig {
    screen: Exclude<AppPhaseScreenKind, typeof APP_PHASE_SCREEN_KINDS.DIALOGUE>;
}

export type AppPhaseConfig = DialogueAppPhaseConfig | StandardAppPhaseConfig;

export const APP_PHASE_CONFIGS: AppPhaseConfig[] = [
    {
        phase: APP_PHASES.INTRO_DIALOGUE,
        screen: APP_PHASE_SCREEN_KINDS.DIALOGUE,
        dialogueScriptId: CYOA_DIALOGUE_SCRIPT_IDS.GUILD_RECEPTION,
    },
    {
        phase: APP_PHASES.CYOA,
        screen: APP_PHASE_SCREEN_KINDS.CYOA,
    },
    {
        phase: APP_PHASES.NODE_INTRO_DIALOGUE,
        screen: APP_PHASE_SCREEN_KINDS.DIALOGUE,
        dialogueScriptId: CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_INTRO,
    },
    {
        phase: APP_PHASES.NODE_COMPOSITION,
        screen: APP_PHASE_SCREEN_KINDS.NODE_COMPOSITION,
    },
];

export const APP_PHASE_ORDER: AppPhase[] = APP_PHASE_CONFIGS.map(config => config.phase);

export function getAppPhaseConfig(phase: AppPhase): AppPhaseConfig | undefined {
    return APP_PHASE_CONFIGS.find(config => config.phase === phase);
}
