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
    BASE_COLOR: '#bf7fff',
    SELECTED_COLOR: '#f0d0ff',
    DEFAULT_STROKE_WIDTH: 2,
    SELECTED_STROKE_WIDTH: 3.5,
} as const;
