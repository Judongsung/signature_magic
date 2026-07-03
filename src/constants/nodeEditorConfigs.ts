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
    EXTENT: [[-1200, -1600], [1200, 1600]],
    PAN_ON_DRAG_BUTTONS: [EDITOR_MOUSE_BUTTONS.RIGHT],
    INITIAL_VIEWPORT_ZOOM: 0.75,
    INITIAL_VIEWPORT_DURATION_MS: 0,
    INITIAL_VIEWPORT_CENTER_RETRY_LIMIT: 2,
    EDGE_INTERACTION_STROKE_WIDTH: 18,
    EDGE_SELECTED_GLOW_STROKE_WIDTH: 9,
} as const;

export const MAGIC_CONTROL_NODE_CATEGORY = 'extension' as const;
export const MAGIC_NODE_CATEGORIES = [
    'basic',
    'action',
    'control',
    MAGIC_CONTROL_NODE_CATEGORY,
] as const;

export type MagicNodeCategory = (typeof MAGIC_NODE_CATEGORIES)[number];

export const DEFAULT_ACTIVE_MAGIC_NODE_CATEGORIES: MagicNodeCategory[] = ['basic'];

export const MAGIC_NODE_WEIGHT_CONFIG = {
    KEY: 'weight',
    MIN: 1,
    MAX: 99,
    STEP: 1,
    DEFAULT: 1,
    LABEL: '가중치',
    LABEL_PREFIX: '×',
    EXCLUDED_CATEGORY: MAGIC_CONTROL_NODE_CATEGORY,
    DURATION_WEIGHTED_MAGIC_TYPE: 'sustain',
} as const;

export const MAGIC_EDITOR_GUIDE_PATH = './magic-editor-guide.html';

export const MAGIC_NODE_EDITOR_CONTROLS = {
    TEXT: 'text',
    STEPPER: 'stepper',
} as const;

export const MAGIC_NODE_EDITOR_PRESENTATIONS = {
    NODE_LABEL: 'nodeLabel',
    NODE_CAPTION: 'nodeCaption',
    NODE_LABEL_SUFFIX: 'nodeLabelSuffix',
} as const;

export type MagicNodeEditorPresentation =
    (typeof MAGIC_NODE_EDITOR_PRESENTATIONS)[keyof typeof MAGIC_NODE_EDITOR_PRESENTATIONS];

export const MAGIC_NODE_EDITOR_BEHAVIORS = {
    REPEAT_COUNT: 'repeatCount',
    NODE_WEIGHT: 'nodeWeight',
} as const;

export type MagicNodeEditorBehavior =
    (typeof MAGIC_NODE_EDITOR_BEHAVIORS)[keyof typeof MAGIC_NODE_EDITOR_BEHAVIORS];

export const NODE_COMPOSITION_SIGNATURE_PRESENTATIONS = {
    GUIDED: 'guided',
    NEUTRAL: 'neutral',
} as const;

export type NodeCompositionSignaturePresentation =
    (typeof NODE_COMPOSITION_SIGNATURE_PRESENTATIONS)[keyof typeof NODE_COMPOSITION_SIGNATURE_PRESENTATIONS];

export const MAGIC_REPEAT_CONFIG = {
    DEFAULT_COUNT: 1,
    COUNT_LABEL_PREFIX: '×',
} as const;

export const MAGIC_CIRCLE_METADATA_CONFIG = {
    NAME_MAX_LENGTH: 80,
    CAPTION_MAX_LENGTH: 160,
} as const;

export const MAGIC_NODE_DEFAULT_CAPTION_EDITOR_FIELD = {
    key: 'caption',
    label: '메모',
    control: MAGIC_NODE_EDITOR_CONTROLS.TEXT,
    maxLength: 80,
    placeholder: '단위 마법에 남길 메모를 입력하세요.',
    presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_CAPTION,
} as const;

export const MAGIC_NODE_WEIGHT_EDITOR_FIELD = {
    key: MAGIC_NODE_WEIGHT_CONFIG.KEY,
    label: MAGIC_NODE_WEIGHT_CONFIG.LABEL,
    control: MAGIC_NODE_EDITOR_CONTROLS.STEPPER,
    min: MAGIC_NODE_WEIGHT_CONFIG.MIN,
    max: MAGIC_NODE_WEIGHT_CONFIG.MAX,
    step: MAGIC_NODE_WEIGHT_CONFIG.STEP,
    defaultValue: MAGIC_NODE_WEIGHT_CONFIG.DEFAULT,
    helpText: '효과와 비용을 입력한 수만큼 겹칩니다. 시전 시간은 늘지 않고, 범위는 같은 배율을 거듭 적용하며, 유지는 지속 시간도 늘어납니다.',
    presentation: MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL_SUFFIX,
    behavior: MAGIC_NODE_EDITOR_BEHAVIORS.NODE_WEIGHT,
} as const;
