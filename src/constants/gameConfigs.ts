export const APP_PHASES = {
    INTRO_DIALOGUE: 1,
    CYOA: 2,
    NODE_INTRO_DIALOGUE: 3,
    NODE_COMPOSITION: 4,
    NODE_RESULT_DIALOGUE: 5,
} as const;

export type AppPhase = (typeof APP_PHASES)[keyof typeof APP_PHASES];

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

export const EDITOR_MOUSE_BUTTONS = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
} as const;

export const EDITOR_CANVAS = {
    SNAP_GRID: [40, 40],
    EXTENT: [[-1200, -800], [1200, 800]],
    PAN_ON_DRAG_BUTTONS: [EDITOR_MOUSE_BUTTONS.RIGHT],
    INITIAL_VIEWPORT_ZOOM: 1,
    INITIAL_VIEWPORT_DURATION_MS: 0,
    INITIAL_VIEWPORT_CENTER_RETRY_LIMIT: 2,
    CLICK_PLACEMENT_NODE_SIZE: { width: 80, height: 80 },
    EDGE_INTERACTION_STROKE_WIDTH: 18,
    EDGE_SELECTED_GLOW_STROKE_WIDTH: 9,
} as const;

export const MAGIC_NODE_CATEGORIES = ['basic', 'action', 'control', 'extension'] as const;

export type MagicNodeCategory = (typeof MAGIC_NODE_CATEGORIES)[number];

export const DEFAULT_ACTIVE_MAGIC_NODE_CATEGORIES: MagicNodeCategory[] = ['basic'];

export const MAGIC_CONNECTION_RULE_KEYS = {
    ALLOW_CYCLE_FROM_OUTPUT: 'allowCycleFromOutput',
} as const;

export const MAGIC_NODE_EDITOR_CONTROLS = {
    TEXT: 'text',
    STEPPER: 'stepper',
} as const;

export type MagicNodeEditorControl =
    (typeof MAGIC_NODE_EDITOR_CONTROLS)[keyof typeof MAGIC_NODE_EDITOR_CONTROLS];

export const MAGIC_NODE_EDITOR_PRESENTATIONS = {
    NODE_LABEL: 'nodeLabel',
    NODE_CAPTION: 'nodeCaption',
    NODE_LABEL_SUFFIX: 'nodeLabelSuffix',
} as const;

export type MagicNodeEditorPresentation =
    (typeof MAGIC_NODE_EDITOR_PRESENTATIONS)[keyof typeof MAGIC_NODE_EDITOR_PRESENTATIONS];

export const MAGIC_NODE_EDITOR_BEHAVIORS = {
    CYCLE_REPEAT_COUNT: 'cycleRepeatCount',
} as const;

export type MagicNodeEditorBehavior =
    (typeof MAGIC_NODE_EDITOR_BEHAVIORS)[keyof typeof MAGIC_NODE_EDITOR_BEHAVIORS];

export const MAGIC_REPEAT_CONFIG = {
    INFINITE_COUNT: 0,
    INFINITE_CALCULATION_COUNT: 1,
    INFINITE_LABEL: '∞',
    FINITE_LABEL_PREFIX: '×',
} as const;

export const MAGIC_NODE_DEFAULT_CAPTION_EDITOR_FIELD = {
    key: 'caption',
    label: '캡션',
    control: MAGIC_NODE_EDITOR_CONTROLS.TEXT,
    maxLength: 80,
    placeholder: '노드 캡션을 입력하세요.',
    presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_CAPTION,
} as const;

export const CYOA_SELECTION_MODES = {
    SINGLE: 'single',
    MULTI: 'multi',
} as const;

export type CyoaSelectionMode = (typeof CYOA_SELECTION_MODES)[keyof typeof CYOA_SELECTION_MODES];

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

export type CyoaChoiceImagePlacement = (typeof CYOA_CHOICE_IMAGE_PLACEMENTS)[keyof typeof CYOA_CHOICE_IMAGE_PLACEMENTS];
