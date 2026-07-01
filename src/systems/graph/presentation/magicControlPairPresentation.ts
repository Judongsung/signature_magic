import {
    MAGIC_CIRCLE_SEQUENCE_CONFIG,
    MAGIC_CONTROL_PAIR_CONFIG,
    MAGIC_CONTROL_PAIR_NODE_TYPES,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import { NODE_EDITOR_TEXT } from '../../../constants/uiText';
import {
    type MagicNode,
} from '../magicGraphTypes';
import {
    isMagicControlPairType,
    type MagicControlPairLayout,
} from '../model/magicControlPairs';

export interface MagicControlPairConnectorPresentation {
    readonly pairId: string;
    readonly path: string;
}

export interface MagicControlPairMarkerPresentation {
    readonly width: number;
    readonly height: number;
    readonly refX: number;
    readonly refY: number;
    readonly path: string;
}

export interface MagicControlPairOverlayPresentation {
    readonly connectors: readonly MagicControlPairConnectorPresentation[];
    readonly marker: MagicControlPairMarkerPresentation;
}

const BRANCH_MARKER_SIZE =
    MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_MARKER_SIZE;
const BRANCH_MARKER_PRESENTATION: MagicControlPairMarkerPresentation = {
    width: BRANCH_MARKER_SIZE,
    height: BRANCH_MARKER_SIZE,
    refX: BRANCH_MARKER_SIZE,
    refY: BRANCH_MARKER_SIZE / 2,
    path: `M 0 0 L ${BRANCH_MARKER_SIZE} ${BRANCH_MARKER_SIZE / 2} L 0 ${BRANCH_MARKER_SIZE}`,
};

export interface MagicControlPairNodePresentation {
    isEnd: boolean;
    label: string;
    showDetails: boolean;
    showTooltip: boolean;
}

export function resolveMagicControlPairNodePresentation(
    node: Pick<MagicNode, 'data'>,
    defaultLabel: string,
    baseTypeLabel?: string
): MagicControlPairNodePresentation {
    if (
        !isMagicControlPairType(node.data.magicType) ||
        !node.data.controlPair
    ) {
        return {
            isEnd: false,
            label: defaultLabel,
            showDetails: true,
            showTooltip: true,
        };
    }

    const isEnd =
        node.data.controlPair.role === MAGIC_CONTROL_PAIR_ROLES.END;
    if (isEnd) {
        return {
            isEnd: true,
            label: node.data.magicType ===
                MAGIC_CONTROL_PAIR_NODE_TYPES.REPEAT
                ? NODE_EDITOR_TEXT.CONTROL_REPEAT_END
                : NODE_EDITOR_TEXT.CONTROL_BRANCH_TARGET,
            showDetails: false,
            showTooltip: false,
        };
    }

    return {
        isEnd: false,
        label: node.data.magicType === MAGIC_CONTROL_PAIR_NODE_TYPES.REPEAT
            ? `${NODE_EDITOR_TEXT.CONTROL_REPEAT_START}${
                baseTypeLabel && defaultLabel.startsWith(baseTypeLabel)
                    ? defaultLabel.slice(baseTypeLabel.length)
                    : ''
            }`
            : defaultLabel,
        showDetails: true,
        showTooltip: true,
    };
}

export function resolveMagicControlPairOverlayPresentation(
    layout: Pick<
        MagicControlPairLayout,
        'branchLayouts' | 'rightRailWidth'
    >,
    circleWidth: number
): MagicControlPairOverlayPresentation {
    const cardRight = circleWidth -
        MAGIC_CIRCLE_SEQUENCE_CONFIG.HORIZONTAL_INSET -
        layout.rightRailWidth;

    return {
        connectors: layout.branchLayouts.map(connector => ({
            pairId: connector.pair.id,
            path: resolveBranchConnectorPath(connector, cardRight),
        })),
        marker: BRANCH_MARKER_PRESENTATION,
    };
}

function resolveBranchConnectorPath(
    connector: MagicControlPairLayout['branchLayouts'][number],
    cardRight: number
): string {
    const startAnchorX = cardRight +
        connector.startIndentDepth *
            MAGIC_CONTROL_PAIR_CONFIG.REPEAT_INDENT_PX;
    const endAnchorX = cardRight +
        connector.endIndentDepth *
            MAGIC_CONTROL_PAIR_CONFIG.REPEAT_INDENT_PX;
    const laneX = cardRight +
        connector.railIndentDepth *
            MAGIC_CONTROL_PAIR_CONFIG.REPEAT_INDENT_PX +
        MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_HOOK_WIDTH +
        connector.lane *
            MAGIC_CONTROL_PAIR_CONFIG.RAIL_LANE_GAP;
    const startY = resolveSequenceCenterY(connector.pair.startIndex);
    const endY = resolveSequenceCenterY(connector.pair.endIndex);
    const direction = endY >= startY ? 1 : -1;
    const cornerRadius = Math.min(
        MAGIC_CONTROL_PAIR_CONFIG.CONNECTOR_CORNER_RADIUS,
        Math.abs(endY - startY) / 2,
        laneX - startAnchorX,
        laneX - endAnchorX
    );

    return [
        `M ${startAnchorX} ${startY}`,
        `H ${laneX - cornerRadius}`,
        `Q ${laneX} ${startY} ${laneX} ${startY + direction * cornerRadius}`,
        `V ${endY - direction * cornerRadius}`,
        `Q ${laneX} ${endY} ${laneX - cornerRadius} ${endY}`,
        `H ${endAnchorX}`,
    ].join(' ');
}

function resolveSequenceCenterY(sequenceIndex: number): number {
    return MAGIC_CIRCLE_SEQUENCE_CONFIG.CONTENT_TOP +
        sequenceIndex * (
            MAGIC_CIRCLE_SEQUENCE_CONFIG.NODE_HEIGHT +
            MAGIC_CIRCLE_SEQUENCE_CONFIG.VERTICAL_GAP
        ) +
        MAGIC_CIRCLE_SEQUENCE_CONFIG.NODE_HEIGHT / 2;
}
