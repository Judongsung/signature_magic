export const APP_PHASES = {
    CYOA: 1,
    NODE_COMPOSITION: 2,
} as const;

export type AppPhase = (typeof APP_PHASES)[keyof typeof APP_PHASES];

export const CYOA_ACTIONS = {
    OPEN_ROW: 'OPEN_ROW',
} as const;

export type CyoaAction = (typeof CYOA_ACTIONS)[keyof typeof CYOA_ACTIONS];

export const EDITOR_CANVAS = {
    SNAP_GRID: [40, 40],
    EXTENT: [[-1200, -800], [1200, 800]],
} as const;

export const MAGIC_NODE_CATEGORIES = [
    { id: 'basic', label: '기초' },
    { id: 'action', label: '행동' },
    { id: 'control', label: '조절' },
    { id: 'extension', label: '확장' },
] as const;

export type MagicNodeCategory = (typeof MAGIC_NODE_CATEGORIES)[number]['id'];

export const MAGIC_CIRCLE_PREVIEW = {
    VIEWBOX_SIZE: 260,
    CENTER: 130,
    INNER_RADIUS: 46,
    OUTER_RADIUS: 112,
    OUTER_FRAME_RADIUS: 122,
    SINGLE_NODE_RADIUS: 72,
    INNER_GUIDE_RADIUS: 36,
    OUTER_GUIDE_RADIUS: 118,
    CORE_GRADIENT_RADIUS: 126,
    CORE_GLOW_RADIUS: 5,
    CORE_DOT_RADIUS: 1.6,
    NODE_RING_ECHO_OFFSET: 3.5,
    OUTER_BAND_PADDING: 8,
    MIN_OUTER_BAND_SPACING: 18,
    MIN_GLYPH_SCALE: 0.72,
    MAX_GLYPH_SCALE: 1.16,
    GLYPH_SCALE_RADIUS: 92,
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
