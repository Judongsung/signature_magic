export const APP_PHASES = {
    CYOA: 1,
    NODE_COMPOSITION: 2,
} as const;

export type AppPhase = (typeof APP_PHASES)[keyof typeof APP_PHASES];

export const CYOA_ACTIONS = {
    OPEN_ROW: 'OPEN_ROW',
} as const;

export type CyoaAction = (typeof CYOA_ACTIONS)[keyof typeof CYOA_ACTIONS];

export const CYOA_SCREEN_TEXT = {
    EYEBROW: 'GUILD RECEPTION DESK',
    TITLE: '길드 등록 접수',
    DESCRIPTION: '업무 시간 내 접수 담당자가 확인할 기본 정보를 순서대로 작성하십시오.',
} as const;

export const NODE_EDITOR_TEXT = {
    TOOLBAR_LABEL: '노드',
    CATEGORY_ARIA_LABEL: '노드 카테고리',
    EMPTY_CATEGORY: '표시할 노드 없음',
    CLEAR_ALL: '전체 초기화',
    TOOLBAR_HINT: '드래그해서 배치 · 선택 후 Delete 로 제거',
    CANVAS_ARIA_LABEL: 'magic node canvas',
} as const;

export const MAGIC_CIRCLE_TEXT = {
    EMPTY_HINT: '노드를 연결하면 마법진이 생성됩니다.',
    TOTAL_STATS_ARIA_LABEL: 'Total magic stats',
    TOTAL_STATS_LABEL: 'Total Stats',
    CIRCLE_COUNT_LABEL: '서클 마법',
    CIRCLE_LABEL: 'Circle',
    CIRCLE_ARIA_LABEL: 'Magic circle',
} as const;

export const UI_BUTTON_TEXT = {
    DEV_SKIP_TO_NODE_COMPOSITION: 'DEV: 비술 조합실',
    SUBMIT_REGISTRATION: '등록 신청서 제출',
} as const;

export const EDITOR_MOUSE_BUTTONS = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
} as const;

export const EDITOR_CANVAS = {
    SNAP_GRID: [40, 40],
    EXTENT: [[-1200, -800], [1200, 800]],
    PAN_ON_DRAG_BUTTONS: [EDITOR_MOUSE_BUTTONS.RIGHT],
    EDGE_INTERACTION_STROKE_WIDTH: 18,
    EDGE_SELECTED_GLOW_STROKE_WIDTH: 9,
} as const;

export const MAGIC_NODE_CATEGORIES = [
    { id: 'basic', label: '기초' },
    { id: 'action', label: '행동' },
    { id: 'control', label: '조절' },
    { id: 'extension', label: '확장' },
] as const;

export type MagicNodeCategory = (typeof MAGIC_NODE_CATEGORIES)[number]['id'];

export const DEFAULT_ACTIVE_MAGIC_NODE_CATEGORY_IDS: MagicNodeCategory[] = ['basic'];

export const MAGIC_STAT_SCALING_OPERATIONS = {
    NONE: 'none',
    EXPONENTIAL_BY_NODE_COUNT: 'exponentialByNodeCount',
} as const;

export type MagicStatScalingOperation =
    (typeof MAGIC_STAT_SCALING_OPERATIONS)[keyof typeof MAGIC_STAT_SCALING_OPERATIONS];

export interface MagicStatRuleConfig {
    scalingOperation: MagicStatScalingOperation;
    exponentialFactor?: number;
}

export const MAGIC_STAT_RULE_CONFIGS: Record<string, MagicStatRuleConfig> = {
    instability: {
        scalingOperation: MAGIC_STAT_SCALING_OPERATIONS.EXPONENTIAL_BY_NODE_COUNT,
        exponentialFactor: 1.15,
    },
} as const;

export const MAGIC_CONNECTION_RULE_KEYS = {
    ALLOW_CYCLE_FROM_OUTPUT: 'allowCycleFromOutput',
} as const;

export const MAGIC_CIRCLE_PREVIEW = {
    VIEWBOX_SIZE: 260,
    CENTER: 130,
    INNER_RADIUS: 34,
    OUTER_RADIUS: 93,
    OUTER_FRAME_RADIUS: 122,
    SINGLE_NODE_RADIUS: 60,
    INNER_GUIDE_RADIUS: 30,
    OUTER_GUIDE_RADIUS: 116,
    CORE_GRADIENT_RADIUS: 126,
    CORE_GLOW_RADIUS: 5,
    CORE_DOT_RADIUS: 1.6,
    NODE_STAR_MIN_POINTS: 3,
    NODE_RING_ECHO_OFFSET: 3.5,
    OUTER_BAND_PADDING: 14,
    OUTER_GLYPH_CLEARANCE: 2,
    GLYPH_DESIGN_RADIUS: 9,
    MIN_OUTER_BAND_SPACING: 18,
    MIN_GLYPH_SCALE: 0.68,
    MAX_GLYPH_SCALE: 1.02,
    GLYPH_SCALE_RADIUS: 104,
    GLYPH_INDEX_COUNT_STEP: 2,
    GLYPH_INDEX_COUNT_STEP_LIMIT: 3,
    HALF_TURN_DEGREES: 180,
    FULL_TURN_DEGREES: 360,
    SVG_UP_DEGREES: 90,
    BASE_SPIN_SECONDS: 18,
    SPIN_STEP_SECONDS: 5,
    DENSE_RING_THRESHOLD: 4,
    RING_STROKE_WIDTH: 1.4,
    DENSE_RING_STROKE_WIDTH: 1.15,
} as const;
