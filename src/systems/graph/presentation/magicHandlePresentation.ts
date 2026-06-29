import {
    MAGIC_CIRCLE_PORT_CONFIG,
    MAGIC_NODE_RENDERING_CONFIG,
} from '../../../constants/graphConfigs';

export function resolveHandleLeft(index: number, count: number): string {
    if (count <= 1) return MAGIC_NODE_RENDERING_CONFIG.SINGLE_HANDLE_LEFT;
    const offset = index * (
        MAGIC_NODE_RENDERING_CONFIG.HANDLE_SPREAD_PERCENT / (count - 1)
    );

    return `${MAGIC_NODE_RENDERING_CONFIG.HANDLE_SPREAD_START_PERCENT + offset}%`;
}

export function resolveCirclePortLeft(index: number, count: number): string {
    if (count <= 1) return MAGIC_NODE_RENDERING_CONFIG.SINGLE_HANDLE_LEFT;

    const offsetPx = (
        index - (count - 1) / 2
    ) * MAGIC_CIRCLE_PORT_CONFIG.SPACING_PX;
    if (offsetPx === 0) return MAGIC_NODE_RENDERING_CONFIG.SINGLE_HANDLE_LEFT;

    const operator = offsetPx < 0 ? '-' : '+';
    return `calc(${MAGIC_NODE_RENDERING_CONFIG.SINGLE_HANDLE_LEFT} ${operator} ${Math.abs(offsetPx)}px)`;
}
