export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rect = Point & Size;
export type ViewportTransform = Point & { zoom: number };
export type GridSize = readonly [number, number];
export type CanvasExtent = readonly [
    readonly [number, number],
    readonly [number, number],
];

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function snapPointToGrid(point: Point, grid: GridSize): Point {
    return {
        x: Math.round(point.x / grid[0]) * grid[0],
        y: Math.round(point.y / grid[1]) * grid[1],
    };
}

export function clampPointToExtent(point: Point, extent: CanvasExtent): Point {
    return {
        x: clamp(point.x, extent[0][0], extent[1][0]),
        y: clamp(point.y, extent[0][1], extent[1][1]),
    };
}

export function getExtentCenter(extent: CanvasExtent): Point {
    return {
        x: (extent[0][0] + extent[1][0]) / 2,
        y: (extent[0][1] + extent[1][1]) / 2,
    };
}

export function resolveCenteredViewport(
    flowCenterPosition: Point,
    viewportSize: Size,
    zoom: number
): ViewportTransform {
    return {
        x: viewportSize.width / 2 - flowCenterPosition.x * zoom,
        y: viewportSize.height / 2 - flowCenterPosition.y * zoom,
        zoom,
    };
}

export function resolveDropPosition(
    flowPosition: Point,
    grid: GridSize,
    extent: CanvasExtent
): Point {
    return clampPointToExtent(snapPointToGrid(flowPosition, grid), extent);
}

export function resolveCenteredDropPosition(
    flowCenterPosition: Point,
    nodeSize: Size,
    grid: GridSize,
    extent: CanvasExtent
): Point {
    return resolveDropPosition({
        x: flowCenterPosition.x - nodeSize.width / 2,
        y: flowCenterPosition.y - nodeSize.height / 2,
    }, grid, extent);
}

function rectanglesOverlap(left: Rect, right: Rect, gap: number): boolean {
    return left.x < right.x + right.width + gap &&
        left.x + left.width + gap > right.x &&
        left.y < right.y + right.height + gap &&
        left.y + left.height + gap > right.y;
}

export function resolveNearestAvailableRectPosition(
    desiredPosition: Point,
    size: Size,
    occupiedRects: readonly Rect[],
    grid: GridSize,
    extent: CanvasExtent,
    gap: number
): Point {
    const rectExtent: CanvasExtent = [
        extent[0],
        [
            Math.max(extent[0][0], extent[1][0] - size.width),
            Math.max(extent[0][1], extent[1][1] - size.height),
        ],
    ];
    const desired = resolveDropPosition(desiredPosition, grid, rectExtent);
    const isAvailable = (position: Point) =>
        !occupiedRects.some(rect => rectanglesOverlap(
            { ...position, ...size },
            rect,
            gap
        ));
    if (isAvailable(desired)) return desired;

    const candidates: Point[] = [];
    const minX = Math.ceil(rectExtent[0][0] / grid[0]) * grid[0];
    const minY = Math.ceil(rectExtent[0][1] / grid[1]) * grid[1];
    const maxX = Math.floor(rectExtent[1][0] / grid[0]) * grid[0];
    const maxY = Math.floor(rectExtent[1][1] / grid[1]) * grid[1];

    for (let y = minY; y <= maxY; y += grid[1]) {
        for (let x = minX; x <= maxX; x += grid[0]) {
            candidates.push({ x, y });
        }
    }

    candidates.sort((left, right) => {
        const leftDistance = (left.x - desired.x) ** 2 + (left.y - desired.y) ** 2;
        const rightDistance = (right.x - desired.x) ** 2 + (right.y - desired.y) ** 2;
        return leftDistance - rightDistance ||
            Math.abs(left.y - desired.y) - Math.abs(right.y - desired.y) ||
            left.y - right.y ||
            left.x - right.x;
    });

    return candidates.find(isAvailable) ?? desired;
}
