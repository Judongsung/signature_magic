import {
    MAGIC_CIRCLE_RENDERING_CONFIG,
    NODE_COMPOSITION_TRANSITION_CONFIG,
} from '../../../constants/magicCircleConfigs';

interface CssClampSize {
    minPx: number;
    preferredVmin: number;
    maxPx: number;
}

interface NodeCompositionTransitionConfig {
    CENTRAL_CIRCLE_SIZE: CssClampSize;
    VERTEX_CIRCLE_SIZE: CssClampSize;
    VERTEX_CIRCLE_OPACITY: number;
    CENTER_VERTEX_GAP_RATIO: number;
    POLYGON_START_ANGLE_DEGREES: number;
}

interface PolygonVertexLayout {
    angle: number;
    offsetX: string;
    offsetY: string;
    opacity: number;
}

export interface NodeCompositionTransitionLayout {
    centralCircleSize: string;
    vertexCircleSize: string;
    stageSize: string;
    vertices: PolygonVertexLayout[];
}

const MIN_POLYGON_VERTEX_COUNT = 1;
const DEGREES_PER_TURN = 360;
const RIGHT_ANGLE_DEGREES = 90;
const VISIBLE_OUTER_RADIUS_RATIO =
    MAGIC_CIRCLE_RENDERING_CONFIG.OUTER_FRAME_RADIUS /
    MAGIC_CIRCLE_RENDERING_CONFIG.VIEWBOX_SIZE;

function formatCssNumber(value: number): string {
    const normalizedValue = Math.abs(value) < 0.0001 ? 0 : value;

    return Number(normalizedValue.toFixed(4)).toString();
}

function cssClamp(size: CssClampSize): string {
    return `clamp(${formatCssNumber(size.minPx)}px, ${formatCssNumber(size.preferredVmin)}vmin, ${formatCssNumber(size.maxPx)}px)`;
}

function scaleCssClampSize(size: CssClampSize, scale: number): CssClampSize {
    return {
        minPx: size.minPx * scale,
        preferredVmin: size.preferredVmin * scale,
        maxPx: size.maxPx * scale,
    };
}

function addCssClampSizes(first: CssClampSize, second: CssClampSize): CssClampSize {
    return {
        minPx: first.minPx + second.minPx,
        preferredVmin: first.preferredVmin + second.preferredVmin,
        maxPx: first.maxPx + second.maxPx,
    };
}

function maxCssClampSize(first: CssClampSize, second: CssClampSize): CssClampSize {
    return {
        minPx: Math.max(first.minPx, second.minPx),
        preferredVmin: Math.max(first.preferredVmin, second.preferredVmin),
        maxPx: Math.max(first.maxPx, second.maxPx),
    };
}

function visibleCircleRadius(size: CssClampSize): CssClampSize {
    return scaleCssClampSize(size, VISIBLE_OUTER_RADIUS_RATIO);
}

function polygonSideScaleLimit(centralSize: CssClampSize, vertexSize: CssClampSize, vertexCount: number): number {
    if (vertexCount < 3) return 1;

    const halfInteriorAngleSin = Math.sin(Math.PI / vertexCount);
    const denominatorFactor = 1 - halfInteriorAngleSin;
    if (denominatorFactor <= 0) return 1;

    const componentScaleLimits = [
        (centralSize.minPx * halfInteriorAngleSin) / (vertexSize.minPx * denominatorFactor),
        (centralSize.preferredVmin * halfInteriorAngleSin) / (vertexSize.preferredVmin * denominatorFactor),
        (centralSize.maxPx * halfInteriorAngleSin) / (vertexSize.maxPx * denominatorFactor),
    ];

    return Math.min(1, ...componentScaleLimits);
}

function polygonRadius(
    centralSize: CssClampSize,
    vertexSize: CssClampSize,
    centerVertexGapRatio: number
): CssClampSize {
    const centralVisibleRadius = visibleCircleRadius(centralSize);
    const centerGap = scaleCssClampSize(centralVisibleRadius, centerVertexGapRatio);

    return addCssClampSizes(
        addCssClampSizes(centralVisibleRadius, centerGap),
        visibleCircleRadius(vertexSize)
    );
}

function stageSize(
    centralSize: CssClampSize,
    vertexSize: CssClampSize,
    radius: CssClampSize,
    vertexCount: number
): CssClampSize {
    if (vertexCount === 0) return centralSize;

    return maxCssClampSize(
        centralSize,
        addCssClampSizes(scaleCssClampSize(radius, 2), vertexSize)
    );
}

function cssClampMultiplier(clampValue: string, multiplier: number): string {
    return `calc(${clampValue} * ${formatCssNumber(multiplier)})`;
}

function polygonVertexAngle(index: number, vertexCount: number, startAngle: number): number {
    if (vertexCount <= MIN_POLYGON_VERTEX_COUNT) return startAngle;

    return startAngle + (DEGREES_PER_TURN * index) / vertexCount;
}

function buildPolygonVertices(
    vertexCount: number,
    radius: string,
    config: NodeCompositionTransitionConfig
): PolygonVertexLayout[] {
    return Array.from({ length: vertexCount }, (_, index) => {
        const angle = polygonVertexAngle(index, vertexCount, config.POLYGON_START_ANGLE_DEGREES);
        const angleRadians = (angle * Math.PI) / (RIGHT_ANGLE_DEGREES * 2);

        return {
            angle,
            offsetX: cssClampMultiplier(radius, Math.cos(angleRadians)),
            offsetY: cssClampMultiplier(radius, Math.sin(angleRadians)),
            opacity: config.VERTEX_CIRCLE_OPACITY,
        };
    });
}

export function buildNodeCompositionTransitionLayout(
    vertexCount: number,
    config: NodeCompositionTransitionConfig = NODE_COMPOSITION_TRANSITION_CONFIG
): NodeCompositionTransitionLayout {
    const safeVertexCount = Math.max(0, Math.floor(vertexCount));
    const vertexScale = polygonSideScaleLimit(
        config.CENTRAL_CIRCLE_SIZE,
        config.VERTEX_CIRCLE_SIZE,
        safeVertexCount
    );
    const fittedVertexSize = scaleCssClampSize(config.VERTEX_CIRCLE_SIZE, vertexScale);
    const radiusSize = polygonRadius(
        config.CENTRAL_CIRCLE_SIZE,
        fittedVertexSize,
        config.CENTER_VERTEX_GAP_RATIO
    );
    const radius = cssClamp(radiusSize);

    return {
        centralCircleSize: cssClamp(config.CENTRAL_CIRCLE_SIZE),
        vertexCircleSize: cssClamp(fittedVertexSize),
        stageSize: cssClamp(stageSize(
            config.CENTRAL_CIRCLE_SIZE,
            fittedVertexSize,
            radiusSize,
            safeVertexCount
        )),
        vertices: buildPolygonVertices(safeVertexCount, radius, config),
    };
}
