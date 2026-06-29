import {
    MAGIC_CIRCLE_NODE_CONFIG,
    MAGIC_CIRCLE_PORT_DIRECTIONS,
    MAGIC_CIRCLE_STATUSES,
} from '../../../constants/graphConfigs';
import type {
    MagicCircleNode,
    MagicCircleState,
    MagicCircleStatus,
    MagicEditorNode,
} from '../../../types/magic';
import {
    createMagicCirclePortHandleIds,
    getCircleChildNodes,
    resolveMagicCircleRequiredHeight,
} from '../model/magicCircleGraph';

export interface MagicCircleViewModel {
    status: MagicCircleStatus;
    displayOrder: number | undefined;
    minimumWidth: number;
    minimumHeight: number;
    inputHandleIds: string[];
    outputHandleIds: string[];
}

function resolveStatus(
    childCount: number,
    circleState: MagicCircleState | undefined
): MagicCircleStatus {
    if (childCount === 0) return MAGIC_CIRCLE_STATUSES.EMPTY;
    if (!circleState?.isOnOutputPath) return MAGIC_CIRCLE_STATUSES.EXTERNAL;
    return MAGIC_CIRCLE_STATUSES.VALID;
}

export function resolveMagicCircleViewModel(
    circle: Pick<MagicCircleNode, 'id' | 'width' | 'height' | 'data'>,
    nodes: readonly MagicEditorNode[],
    circleState: MagicCircleState | undefined
): MagicCircleViewModel {
    const childNodes = getCircleChildNodes(nodes, circle.id);

    return {
        status: resolveStatus(childNodes.length, circleState),
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
