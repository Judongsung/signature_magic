import {
    CIRCLE_SYSTEM_MAGIC_NODE_PRESENTATIONS,
    CIRCLE_SYSTEM_MAGIC_NODE_TYPES,
} from '../../../constants/circleSystemMagicNodeConfigs';
import {
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';

export interface CircleSystemMagicNodePresentation {
    label: string;
    description: string;
}

export function resolveCircleSystemMagicNodePresentation(
    config: Pick<MagicTypeConfig, 'type'>,
    hasOutgoingCircleConnection: boolean
): CircleSystemMagicNodePresentation | undefined {
    if (
        config.type === CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION &&
        hasOutgoingCircleConnection
    ) {
        return CIRCLE_SYSTEM_MAGIC_NODE_PRESENTATIONS.TRANSFER;
    }
}
