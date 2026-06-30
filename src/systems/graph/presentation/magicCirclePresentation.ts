import {
    MAGIC_CIRCLE_NODE_CONFIG,
    MAGIC_CIRCLE_PORT_DIRECTIONS,
    MAGIC_CIRCLE_STATUSES,
} from '../../../constants/graphConfigs';
import type {
    MagicCircleNode,
    MagicCircleState,
    MagicCircleStatus,
    MagicNode,
} from '../../../types/magic';
import {
    createMagicCirclePortHandleIds,
    resolveMagicCircleRequiredHeight,
} from '../model/magicCircleGraph';
import { isCircleSystemMagicNode } from '../model/circleSystemMagicNodes';

export interface MagicCircleViewModel {
    status: MagicCircleStatus;
    displayOrder: number | undefined;
    minimumWidth: number;
    minimumHeight: number;
    inputHandleIds: string[];
    outputHandleIds: string[];
}

function resolveStatus(
    childCount: number
): MagicCircleStatus {
    if (childCount === 0) return MAGIC_CIRCLE_STATUSES.EMPTY;
    return MAGIC_CIRCLE_STATUSES.VALID;
}

export function resolveMagicCircleViewModel(
    circle: Pick<MagicCircleNode, 'id' | 'width' | 'height' | 'data'>,
    childNodes: readonly MagicNode[],
    circleState: MagicCircleState | undefined
): MagicCircleViewModel {
    const editableChildCount = childNodes.filter(node =>
        !isCircleSystemMagicNode(node)
    ).length;

    return {
        status: resolveStatus(editableChildCount),
        displayOrder: circleState?.displayOrder,
        minimumWidth: MAGIC_CIRCLE_NODE_CONFIG.MIN_SIZE.width,
        minimumHeight: resolveMagicCircleRequiredHeight(childNodes.length),
        inputHandleIds: createMagicCirclePortHandleIds(
            MAGIC_CIRCLE_PORT_DIRECTIONS.INPUT,
            circle.data.inputHandleCount
        ),
        outputHandleIds: createMagicCirclePortHandleIds(
            MAGIC_CIRCLE_PORT_DIRECTIONS.OUTPUT,
            circle.data.outputHandleCount
        ),
    };
}
