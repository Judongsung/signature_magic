import {
    MAGIC_CIRCLE_SEQUENCE_CONFIG,
    MAGIC_CONTROL_PAIR_NODE_TYPES,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import { NODE_EDITOR_TEXT } from '../../../constants/uiText';
import type { MagicNode } from '../../../types/magic';
import {
    isMagicControlPairType,
    type MagicControlPairLayout,
} from '../model/magicControlPairs';

export interface MagicControlPairConnector {
    pairId: string;
    lane: number;
    startIndentDepth: number;
    endIndentDepth: number;
    railIndentDepth: number;
    startY: number;
    endY: number;
}

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

export function resolveMagicControlPairConnectors(
    layout: Pick<MagicControlPairLayout, 'branchLayouts'>
): MagicControlPairConnector[] {
    return layout.branchLayouts
        .map(({
            pair,
            lane,
            startIndentDepth,
            endIndentDepth,
            railIndentDepth,
        }) => ({
            pairId: pair.id,
            lane,
            startIndentDepth,
            endIndentDepth,
            railIndentDepth,
            startY: resolveSequenceCenterY(pair.startIndex),
            endY: resolveSequenceCenterY(pair.endIndex),
        }));
}

function resolveSequenceCenterY(sequenceIndex: number): number {
    return MAGIC_CIRCLE_SEQUENCE_CONFIG.CONTENT_TOP +
        sequenceIndex * (
            MAGIC_CIRCLE_SEQUENCE_CONFIG.NODE_HEIGHT +
            MAGIC_CIRCLE_SEQUENCE_CONFIG.VERTICAL_GAP
        ) +
        MAGIC_CIRCLE_SEQUENCE_CONFIG.NODE_HEIGHT / 2;
}
