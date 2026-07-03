import { NODE_COMPOSITION_TRANSITION_CONFIG } from '../../../constants/magicCircleConfigs';
import {
    type CirclePath,
} from '../calculation/magicCalculationTypes';
import {
    buildMagicCircleRenderModels,
    type MagicCircleRenderModel,
} from './magicCircleRenderer';
import {
    buildNodeCompositionTransitionLayout,
    type NodeCompositionTransitionConfig,
    type NodeCompositionTransitionLayout,
} from './nodeCompositionTransitionLayout';

const CIRCLE_START_INDEX = 1;

export interface MagicCircleCompositionSceneCircle {
    circle: MagicCircleRenderModel;
    index: number;
    vertexIndex: number;
    opacity: number;
    vertexX: string;
    vertexY: string;
}

export interface MagicCircleCompositionScene {
    circles: MagicCircleCompositionSceneCircle[];
    centralCircle?: MagicCircleCompositionSceneCircle;
    polygonCircles: MagicCircleCompositionSceneCircle[];
    layout: NodeCompositionTransitionLayout;
}

export interface MagicCircleCompositionSceneOptions {
    centralCircleId?: string;
    layoutConfig?: NodeCompositionTransitionConfig;
}

export function buildMagicCircleCompositionScene(
    sourceCircles: CirclePath[],
    options: MagicCircleCompositionSceneOptions = {}
): MagicCircleCompositionScene {
    const centralCircleIndex = options.centralCircleId
        ? sourceCircles.findIndex(circle =>
            circle.id === options.centralCircleId
        )
        : -1;
    const orderedCircles = centralCircleIndex > 0
        ? [
            sourceCircles[centralCircleIndex],
            ...sourceCircles.filter((_, index) =>
                index !== centralCircleIndex
            ),
        ]
        : sourceCircles;
    const renderModels = buildMagicCircleRenderModels(orderedCircles)
        .slice(0, NODE_COMPOSITION_TRANSITION_CONFIG.MAX_CIRCLE_INSTANCES);
    const vertexCount = Math.max(renderModels.length - CIRCLE_START_INDEX, 0);
    const layout = buildNodeCompositionTransitionLayout(
        vertexCount,
        options.layoutConfig
    );
    const circles = renderModels.map((circle, index) => {
        const vertexIndex = index - CIRCLE_START_INDEX;
        const vertex = vertexIndex >= 0 ? layout.vertices[vertexIndex] : undefined;

        return {
            circle,
            index,
            vertexIndex,
            opacity: vertex?.opacity ?? 1,
            vertexX: vertex?.offsetX ?? '0px',
            vertexY: vertex?.offsetY ?? '0px',
        };
    });

    return {
        circles,
        centralCircle: circles[0],
        polygonCircles: circles.slice(CIRCLE_START_INDEX),
        layout,
    };
}
