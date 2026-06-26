export const CYOA_DIALOGUE_SCRIPT_IDS = {
    GUILD_RECEPTION: 'guild-reception',
    NODE_COMPOSITION_INTRO: 'node-composition-intro',
    NODE_COMPOSITION_RESULT: 'node-composition-result',
} as const;

export type CyoaDialogueScriptId =
    (typeof CYOA_DIALOGUE_SCRIPT_IDS)[keyof typeof CYOA_DIALOGUE_SCRIPT_IDS];

export const CYOA_DIALOGUE_TEXT_VARIANTS = {
    MUMBLE: 'mumble',
} as const;

export type CyoaDialogueTextVariant =
    (typeof CYOA_DIALOGUE_TEXT_VARIANTS)[keyof typeof CYOA_DIALOGUE_TEXT_VARIANTS];

export const CYOA_SELECTION_MODES = {
    SINGLE: 'single',
    MULTI: 'multi',
} as const;

export type CyoaSelectionMode = (typeof CYOA_SELECTION_MODES)[keyof typeof CYOA_SELECTION_MODES];

export const CYOA_SELECTION_POLICY = {
    DEFAULT_REQUIRED_COUNT: 1,
    INPUT_REQUIRED_COUNT: 1,
    SINGLE_SELECT_MAX_REQUIRED_COUNT: 1,
} as const;

export const CYOA_INPUT_ROLES = {
    SIGNATURE_NAME: 'signatureName',
} as const;

export type CyoaInputRole = (typeof CYOA_INPUT_ROLES)[keyof typeof CYOA_INPUT_ROLES];

export const CYOA_CHOICE_IMAGE_SIZES = {
    DEFAULT: 'default',
    LARGE: 'large',
    WIDE: 'wide',
} as const;

export type CyoaChoiceImageSize = (typeof CYOA_CHOICE_IMAGE_SIZES)[keyof typeof CYOA_CHOICE_IMAGE_SIZES];

export const CYOA_CHOICE_IMAGE_PLACEMENTS = {
    LEFT: 'left',
    RIGHT: 'right',
    TOP: 'top',
} as const;

export type CyoaChoiceImagePlacement =
    (typeof CYOA_CHOICE_IMAGE_PLACEMENTS)[keyof typeof CYOA_CHOICE_IMAGE_PLACEMENTS];
