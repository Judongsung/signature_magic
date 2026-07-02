import {
    GRAPH_NODE_TYPES,
    MAGIC_NODE_KINDS,
} from '../../constants/graphConfigs';
import { EMPTY_MAGIC_STATS } from '../../types/magicStats';
import type { MagicType } from '../../types/magicTypeConfig';
import type { CirclePath } from '../graph/calculation/magicCalculationTypes';
import {
    buildMagicCircleRenderModels,
    type MagicCircleRenderModel,
} from '../graph/presentation/magicCircleRenderer';

export const APP_TITLE_MAGIC_TYPE_SEQUENCE = [
    'coordinate',
    'harmony',
    'amplify',
    'diffuse',
    'light',
    'disperse',
] as const satisfies readonly MagicType[];

export const APP_TITLE_PRESENTATION_CONFIG = {
    CIRCLE_ID: 'app-title-circle',
    CIRCLE_INDEX: 0,
    GLYPH_SPIN_DURATION_MULTIPLIER: 2,
} as const;

export function buildAppTitleMagicCircle(): MagicCircleRenderModel {
    const circle: CirclePath = {
        id: APP_TITLE_PRESENTATION_CONFIG.CIRCLE_ID,
        nodes: APP_TITLE_MAGIC_TYPE_SEQUENCE.map((magicType, index) => ({
            id: `${APP_TITLE_PRESENTATION_CONFIG.CIRCLE_ID}-node-${index}`,
            type: GRAPH_NODE_TYPES.MAGIC_NODE,
            position: { x: 0, y: 0 },
            data: {
                magicType,
                nodeKind: MAGIC_NODE_KINDS.USER,
            },
        })),
        stats: EMPTY_MAGIC_STATS,
        statAdjustments: EMPTY_MAGIC_STATS,
    };

    const renderModel = buildMagicCircleRenderModels([circle])[0];

    return {
        ...renderModel,
        bands: renderModel.bands.map(band => ({
            ...band,
            spinDuration: band.spinDuration
                * APP_TITLE_PRESENTATION_CONFIG.GLYPH_SPIN_DURATION_MULTIPLIER,
        })),
    };
}
