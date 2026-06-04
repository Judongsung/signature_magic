export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
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
