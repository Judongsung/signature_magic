export const EDITOR_MOUSE_BUTTONS = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
} as const;

export const EDITOR_GRID_SIZE = {
    WIDTH: 40,
    HEIGHT: 40,
} as const;

export const EDITOR_CANVAS = {
    SNAP_GRID: [EDITOR_GRID_SIZE.WIDTH, EDITOR_GRID_SIZE.HEIGHT],
    EXTENT: [[-1200, -800], [1200, 800]],
    PAN_ON_DRAG_BUTTONS: [EDITOR_MOUSE_BUTTONS.RIGHT],
    INITIAL_VIEWPORT_ZOOM: 1,
    INITIAL_VIEWPORT_DURATION_MS: 0,
    INITIAL_VIEWPORT_CENTER_RETRY_LIMIT: 2,
    EDGE_INTERACTION_STROKE_WIDTH: 18,
    EDGE_SELECTED_GLOW_STROKE_WIDTH: 9,
} as const;

export const MAGIC_NODE_CATEGORIES = ['basic', 'action', 'control', 'extension'] as const;
export const MAGIC_SEQUENCE_DISABLED_NODE_TYPES = ['repeat'] as const;

export type MagicNodeCategory = (typeof MAGIC_NODE_CATEGORIES)[number];

export const DEFAULT_ACTIVE_MAGIC_NODE_CATEGORIES: MagicNodeCategory[] = ['basic'];

export const MAGIC_EDITOR_GUIDE_PATH = './magic-editor-guide.html';

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

export const MAGIC_CIRCLE_METADATA_CONFIG = {
    NAME_MAX_LENGTH: 80,
    CAPTION_MAX_LENGTH: 160,
} as const;

export const MAGIC_NODE_DEFAULT_CAPTION_EDITOR_FIELD = {
    key: 'caption',
    label: '캡션',
    control: MAGIC_NODE_EDITOR_CONTROLS.TEXT,
    maxLength: 80,
    placeholder: '노드 캡션을 입력하세요.',
    presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_CAPTION,
} as const;
