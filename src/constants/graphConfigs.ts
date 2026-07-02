import {
    type MagicCirclePortDirection,
    type MagicCircleStatus,
    type MagicControlPairRole,
    type MagicEditorNodeKind,
} from '../systems/graph/magicGraphTypes';
import { EDITOR_GRID_SIZE } from './nodeEditorConfigs';

export const GRAPH_NODE_TYPES = {
    MAGIC_NODE: 'magicNode',
    MAGIC_CIRCLE: 'magicCircle',
} as const;

export const GRAPH_EDGE_TYPES = {
    MAGIC_EDGE: 'magicEdge',
} as const;

export const MAGIC_NODE_KINDS = {
    USER: 'user',
    SYSTEM: 'system',
    CIRCLE: 'circle',
} as const satisfies Record<string, MagicEditorNodeKind>;

export const MAGIC_NODE_ID_PREFIX = 'node';
export const MAGIC_EDGE_ID_PREFIX = 'edge';
export const MAGIC_CIRCLE_ID_PREFIX = 'circle';

export const MAGIC_CIRCLE_HANDLE_IDS = {
    INPUT: 'circle-input',
    OUTPUT: 'circle-output',
} as const;

export const MAGIC_CIRCLE_PORT_DIRECTIONS = {
    INPUT: 'input',
    OUTPUT: 'output',
} as const satisfies Record<string, MagicCirclePortDirection>;

export const MAGIC_NODE_SIZE = { width: 80, height: 80 } as const;
export const MAGIC_CIRCLE_SEQUENCE_CONFIG = {
    NODE_HEIGHT: EDITOR_GRID_SIZE.HEIGHT,
    HORIZONTAL_INSET: EDITOR_GRID_SIZE.WIDTH,
    VERTICAL_GAP: 0,
    CONTENT_TOP: EDITOR_GRID_SIZE.HEIGHT * 2,
    CONTENT_BOTTOM: 48,
} as const;

export const MAGIC_CIRCLE_STATUSES = {
    EMPTY: 'empty',
    VALID: 'valid',
} as const satisfies Record<string, MagicCircleStatus>;

export const MAGIC_CONTROL_PAIR_NODE_TYPES = {
    REPEAT: 'repeat',
    BRANCH: 'branch',
} as const;

export const MAGIC_CONTROL_PAIR_ROLES = {
    START: 'start',
    END: 'end',
} as const satisfies Record<string, MagicControlPairRole>;

export const MAGIC_CONTROL_PAIR_CONFIG = {
    ID_PREFIX: 'control-pair',
    END_ID_SUFFIX: 'end',
    REPEAT_INDENT_PX: 20,
    RAIL_BASE_WIDTH: 28,
    RAIL_LANE_GAP: 12,
    CONNECTOR_HOOK_WIDTH: 18,
    CONNECTOR_CORNER_RADIUS: 6,
    CONNECTOR_MARKER_SIZE: 6,
} as const;

export const MAGIC_CIRCLE_PORT_CONFIG = {
    DEFAULT_VISIBLE_COUNT: 1,
    TRAILING_EMPTY_PORT_COUNT: 1,
    SPACING_PX: EDITOR_GRID_SIZE.WIDTH,
    INDEX_SEPARATOR: '-',
} as const;

export const MAGIC_CIRCLE_NODE_CONFIG = {
    DEFAULT_SIZE: { width: 480, height: 640 },
    MIN_SIZE: { width: 320, height: 400 },
    DEFAULT_POSITION: { x: -240, y: -320 },
    PORT_OFFSET: 28,
    COLLISION_GAP: 40,
    DRAG_HANDLE_CLASS: 'magic-circle-title-bar',
    DRAG_HANDLE_SELECTOR: '.magic-circle-title-bar',
} as const;

export const MAGIC_NODE_RENDERING_CONFIG = {
    FALLBACK_COLOR: '#888',
    FALLBACK_ICON: '?',
    SINGLE_HANDLE_LEFT: '50%',
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

export const MAGIC_GRAPH_RESULT_PREVIEW_CONFIG = {
    NODE_SIZE: MAGIC_NODE_SIZE,
    BOUNDS_PADDING_PX: 96,
    DEFAULT_ASPECT_RATIO: 1.7,
    FIT_VIEW_PADDING: 0.2,
    FIT_VIEW_MIN_ZOOM: 0.12,
    FIT_VIEW_MAX_ZOOM: 1,
} as const;
