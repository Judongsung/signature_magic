export const NODE_COMPOSITION_PANE_RESIZE_CONFIG = {
    DEFAULT_PERCENT: 50,
    MIN_PERCENT: 30,
    MAX_PERCENT: 75,
    KEY_STEP_PERCENT: 5,
    COMPACT_LAYOUT_MEDIA_QUERY: '(max-width: 900px)',
    PRIMARY_POINTER_BUTTON: 0,
} as const;

interface PaneResizeRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface PaneResizePointer {
    clientX: number;
    clientY: number;
}

export function clampPanePercent(value: number): number {
    return Math.min(
        NODE_COMPOSITION_PANE_RESIZE_CONFIG.MAX_PERCENT,
        Math.max(NODE_COMPOSITION_PANE_RESIZE_CONFIG.MIN_PERCENT, value)
    );
}

export function resolvePanePercentFromPointer(
    pointer: PaneResizePointer,
    containerRect: PaneResizeRect,
    isCompactLayout: boolean
): number | undefined {
    const pointerOffset = isCompactLayout
        ? pointer.clientY - containerRect.top
        : pointer.clientX - containerRect.left;
    const containerSize = isCompactLayout ? containerRect.height : containerRect.width;
    if (containerSize <= 0) return undefined;

    return clampPanePercent((pointerOffset / containerSize) * 100);
}

export function resolvePanePercentFromKey(currentPercent: number, key: string): number | undefined {
    const { DEFAULT_PERCENT, KEY_STEP_PERCENT, MAX_PERCENT, MIN_PERCENT } = NODE_COMPOSITION_PANE_RESIZE_CONFIG;
    const keyActions: Record<string, () => number> = {
        ArrowLeft: () => clampPanePercent(currentPercent - KEY_STEP_PERCENT),
        ArrowUp: () => clampPanePercent(currentPercent - KEY_STEP_PERCENT),
        ArrowRight: () => clampPanePercent(currentPercent + KEY_STEP_PERCENT),
        ArrowDown: () => clampPanePercent(currentPercent + KEY_STEP_PERCENT),
        Home: () => MIN_PERCENT,
        End: () => MAX_PERCENT,
        Enter: () => DEFAULT_PERCENT,
    };

    return keyActions[key]?.();
}
