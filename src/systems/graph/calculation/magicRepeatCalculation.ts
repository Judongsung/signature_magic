import { MAGIC_REPEAT_CONFIG } from '../../../constants/nodeEditorConfigs';
import { MAGIC_CONTROL_PAIR_NODE_TYPES } from '../../../constants/graphConfigs';
import type {
    MagicEditorNode,
    MagicTypeConfig,
} from '../../../types/magic';
import { resolveMagicNodeRepeatCount } from '../model/magicNodeData';
import {
    isMagicControlPairNode,
    resolveMagicControlPairs,
} from '../model/magicControlPairs';
import { isCircleSystemMagicNode } from '../model/circleSystemMagicNodes';
import type { MagicGraphAnalysis } from './magicGraphAnalysis';

export type MagicNodeExecutionCounts = ReadonlyMap<string, number>;

export function buildMagicNodeExecutionCounts(
    analysis: MagicGraphAnalysis,
    magicTypes: ReadonlyMap<string, MagicTypeConfig>
): MagicNodeExecutionCounts {
    const executionCounts = new Map<string, number>();

    analysis.cycleCirclePaths.forEach(path => {
        const repeatNode = analysis.topology.nodeMap.get(path.closingEdge.source);
        if (!repeatNode) return;

        const configuredCount = resolveMagicNodeRepeatCount(
            repeatNode.data,
            magicTypes.get(repeatNode.data.magicType)
        );
        const effectiveCount = configuredCount === MAGIC_REPEAT_CONFIG.INFINITE_COUNT
            ? MAGIC_REPEAT_CONFIG.INFINITE_CALCULATION_COUNT
            : configuredCount ?? MAGIC_REPEAT_CONFIG.INFINITE_CALCULATION_COUNT;
        if (effectiveCount <= MAGIC_REPEAT_CONFIG.INFINITE_CALCULATION_COUNT) return;

        path.nodes.forEach(node => {
            const currentCount = executionCounts.get(node.id) ?? MAGIC_REPEAT_CONFIG.INFINITE_CALCULATION_COUNT;
            executionCounts.set(node.id, currentCount * effectiveCount);
        });
    });

    return executionCounts;
}

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
        const effectiveCount =
            configuredCount === MAGIC_REPEAT_CONFIG.INFINITE_COUNT
                ? MAGIC_REPEAT_CONFIG.INFINITE_CALCULATION_COUNT
                : configuredCount ??
                    MAGIC_REPEAT_CONFIG.INFINITE_CALCULATION_COUNT;
        if (effectiveCount <= MAGIC_REPEAT_CONFIG.INFINITE_CALCULATION_COUNT) {
            return;
        }

        nodes.forEach(node => {
            const sequenceIndex = typeof node.data.sequenceIndex === 'number'
                ? node.data.sequenceIndex
                : undefined;
            if (isCircleSystemMagicNode(node)) {
                return;
            }
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
                    MAGIC_REPEAT_CONFIG.INFINITE_CALCULATION_COUNT) *
                    effectiveCount
            );
        });
    });

    return executionCounts;
}
