import type { MagicNodeKind } from '../types/magic';

export const GRAPH_NODE_TYPES = {
    MAGIC_NODE: 'magicNode',
} as const;

export const GRAPH_EDGE_TYPES = {
    MAGIC_EDGE: 'magicEdge',
} as const;

export const MAGIC_NODE_KINDS = {
    USER: 'user',
    SYSTEM: 'system',
} as const satisfies Record<string, MagicNodeKind>;

export const MAGIC_NODE_ID_PREFIX = 'node';
export const MAGIC_EDGE_ID_PREFIX = 'edge';
export const MAGIC_CIRCLE_ID_PREFIX = 'circle';

export const MAGIC_NODE_HANDLE_CONFIG = {
    INPUT_PREFIX: 'input',
    OUTPUT_PREFIX: 'output',
    DEFAULT_INPUT_ID: 'input-0',
    DEFAULT_OUTPUT_ID: 'output-0',
    DEFAULT_MAX_INPUTS: 1,
    DEFAULT_MAX_OUTPUTS: 1,
    DEFAULT_VISIBLE_COUNT: 1,
} as const;

export const MAGIC_NODE_RENDERING_CONFIG = {
    FALLBACK_COLOR: '#888',
    FALLBACK_ICON: '?',
    SINGLE_HANDLE_LEFT: '50%',
    HANDLE_SPREAD_START_PERCENT: 25,
    HANDLE_SPREAD_PERCENT: 50,
} as const;

export const MAGIC_EDGE_RENDERING_CONFIG = {
    ARROW_LENGTH: 9,
    ARROW_TAIL_X: -9,
    ARROW_TIP_X: 9,
    ARROW_HALF_WIDTH: 5,
    BASE_COLOR: '#bf7fff',
    SELECTED_COLOR: '#f0d0ff',
    DEFAULT_STROKE_WIDTH: 2,
    SELECTED_STROKE_WIDTH: 3.5,
} as const;

export const MAGIC_STAR_FIELD_CONFIG = {
    COUNT: 700,
    SEED: 731,
    MIN_POSITION_PERCENT: 2,
    MAX_POSITION_PERCENT: 98,
    MIN_RADIUS_PX: 0.38,
    MAX_RADIUS_PX: 1.05,
    MIN_ALPHA: 0.2,
    MAX_ALPHA: 0.58,
    MIN_GLOW_PX: 3.2,
    MAX_GLOW_PX: 7.2,
    COLORS: [
        '233, 199, 111',
        '205, 234, 255',
        '110, 214, 209',
        '185, 150, 255',
    ],
} as const;

export const MAGIC_GRAPH_RESULT_PREVIEW_CONFIG = {
    NODE_SIZE: { width: 80, height: 80 },
    BOUNDS_PADDING_PX: 96,
    MIN_ASPECT_RATIO: 1.25,
    MAX_ASPECT_RATIO: 2.4,
    DEFAULT_ASPECT_RATIO: 1.7,
    FIT_VIEW_PADDING: 0.2,
    FIT_VIEW_MIN_ZOOM: 0.12,
    FIT_VIEW_MAX_ZOOM: 1,
} as const;
