import { MAGIC_REPEAT_CONFIG } from '../../../constants/gameConfigs';
import type { MagicTypeConfig } from '../../../types/magic';
import { resolveMagicNodeCycleRepeatCount } from '../model/magicNodeData';
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

        const configuredCount = resolveMagicNodeCycleRepeatCount(
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
