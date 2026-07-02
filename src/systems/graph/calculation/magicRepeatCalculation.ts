import { MAGIC_REPEAT_CONFIG } from '../../../constants/nodeEditorConfigs';
import { MAGIC_CONTROL_PAIR_NODE_TYPES } from '../../../constants/graphConfigs';
import {
    type MagicEditorNode,
} from '../magicGraphTypes';
import {
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import { resolveMagicNodeRepeatCount } from '../model/magicNodeData';
import {
    isMagicControlPairNode,
    resolveMagicControlPairs,
} from '../model/magicControlPairs';

export type MagicNodeExecutionCounts = ReadonlyMap<string, number>;

export function buildMagicControlPairExecutionCounts(
    nodes: readonly MagicEditorNode[],
    magicTypes: ReadonlyMap<string, MagicTypeConfig>
): MagicNodeExecutionCounts {
    const executionCounts = new Map<string, number>();
    const repeatPairs = resolveMagicControlPairs(nodes)
        .filter(pair =>
            pair.magicType === MAGIC_CONTROL_PAIR_NODE_TYPES.REPEAT
        );

    repeatPairs.forEach(pair => {
        const configuredCount = resolveMagicNodeRepeatCount(
            pair.start.data,
            magicTypes.get(pair.start.data.magicType)
        );
        const effectiveCount = configuredCount ??
            MAGIC_REPEAT_CONFIG.DEFAULT_COUNT;
        if (effectiveCount <= MAGIC_REPEAT_CONFIG.DEFAULT_COUNT) {
            return;
        }

        nodes.forEach(node => {
            const sequenceIndex = typeof node.data.sequenceIndex === 'number'
                ? node.data.sequenceIndex
                : undefined;
            if (
                isMagicControlPairNode(node) &&
                node.data.controlPair.id === pair.id
            ) {
                return;
            }
            if (
                node.parentId !== pair.circleId ||
                !Number.isInteger(sequenceIndex) ||
                sequenceIndex! <= pair.startIndex ||
                sequenceIndex! >= pair.endIndex
            ) {
                return;
            }

            executionCounts.set(
                node.id,
                (executionCounts.get(node.id) ??
                    MAGIC_REPEAT_CONFIG.DEFAULT_COUNT) *
                    effectiveCount
            );
        });
    });

    return executionCounts;
}
