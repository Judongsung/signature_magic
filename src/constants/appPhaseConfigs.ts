import { CYOA_DIALOGUE_SCRIPT_IDS, type CyoaDialogueScriptId } from './cyoaConfigs';

export const APP_PHASES = {
    INTRO_DIALOGUE: 1,
    CYOA: 2,
    NODE_INTRO_DIALOGUE: 3,
    NODE_COMPOSITION: 4,
    NODE_RESULT_DIALOGUE: 5,
    MAGIC_RESULT: 6,
} as const;

export type AppPhase = (typeof APP_PHASES)[keyof typeof APP_PHASES];

export const APP_PHASE_SCREEN_KINDS = {
    DIALOGUE: 'dialogue',
    CYOA: 'cyoa',
    NODE_COMPOSITION: 'nodeComposition',
    MAGIC_RESULT: 'magicResult',
} as const;

type AppPhaseScreenKind =
    (typeof APP_PHASE_SCREEN_KINDS)[keyof typeof APP_PHASE_SCREEN_KINDS];

interface DialogueAppPhaseConfig {
    screen: typeof APP_PHASE_SCREEN_KINDS.DIALOGUE;
    dialogueScriptId: CyoaDialogueScriptId;
    usesGraphResultContext?: boolean;
    showsMaximumMana: boolean;
}

interface StandardAppPhaseConfig {
    screen: Exclude<AppPhaseScreenKind, typeof APP_PHASE_SCREEN_KINDS.DIALOGUE>;
    showsMaximumMana: boolean;
}

export type AppPhaseConfig = DialogueAppPhaseConfig | StandardAppPhaseConfig;

export const APP_PHASE_CONFIGS = {
    [APP_PHASES.INTRO_DIALOGUE]: {
        screen: APP_PHASE_SCREEN_KINDS.DIALOGUE,
        dialogueScriptId: CYOA_DIALOGUE_SCRIPT_IDS.GUILD_RECEPTION,
        showsMaximumMana: false,
    },
    [APP_PHASES.CYOA]: {
        screen: APP_PHASE_SCREEN_KINDS.CYOA,
        showsMaximumMana: true,
    },
    [APP_PHASES.NODE_INTRO_DIALOGUE]: {
        screen: APP_PHASE_SCREEN_KINDS.DIALOGUE,
        dialogueScriptId: CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_INTRO,
        showsMaximumMana: true,
    },
    [APP_PHASES.NODE_COMPOSITION]: {
        screen: APP_PHASE_SCREEN_KINDS.NODE_COMPOSITION,
        showsMaximumMana: true,
    },
    [APP_PHASES.NODE_RESULT_DIALOGUE]: {
        screen: APP_PHASE_SCREEN_KINDS.DIALOGUE,
        dialogueScriptId: CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_RESULT,
        usesGraphResultContext: true,
        showsMaximumMana: true,
    },
    [APP_PHASES.MAGIC_RESULT]: {
        screen: APP_PHASE_SCREEN_KINDS.MAGIC_RESULT,
        showsMaximumMana: false,
    },
} satisfies Record<AppPhase, AppPhaseConfig>;

export function getAppPhaseConfig(phase: AppPhase): AppPhaseConfig {
    return APP_PHASE_CONFIGS[phase];
}
