import {
    MAGIC_CONTROL_PAIR_NODE_TYPES,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import {
    CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS,
    CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS,
} from '../../../constants/circleSystemMagicNodeConfigs';
import {
    type MagicGraphPresetCircleSystemNodeSlotConfig,
    type MagicGraphPresetConfig,
    type MagicGraphPresetEdgeConfig,
    type MagicGraphPresetNodeConfig,
} from '../presets/magicGraphPresetTypes';
import { normalizeMagicNodeSettings } from './magicNodeData';
import { isMagicCirclePortHandleId } from './magicCircleGraph';
import {
    readMagicTypeConfigByType,
    type MagicTypeLookup,
} from './magicTypeLookup';

export interface MagicGraphControlPairAnalysis {
    invalidNodeIds: readonly string[];
    invalidPairIds: readonly string[];
    hasCrossedRepeatPairs: boolean;
}

interface RepeatInterval {
    circleId: string;
    start: number;
    end: number;
}

const CONTROL_PAIR_NODE_TYPES = new Set<string>(
    Object.values(MAGIC_CONTROL_PAIR_NODE_TYPES)
);
const SYSTEM_MAGIC_TYPE_LOOKUP = new Map(
    CIRCLE_SYSTEM_MAGIC_TYPE_CONFIGS.map(config => [config.type, config])
);

export function findNonContiguousMagicGraphSequenceCircleIds(
    nodes: readonly MagicGraphPresetNodeConfig[],
    circleIds: readonly string[]
): string[] {
    return circleIds.filter(circleId => {
        const sequence = nodes
            .filter(node => node.circleId === circleId)
            .map(node => node.sequenceIndex)
            .sort((left, right) => left - right);

        return sequence.some((sequenceIndex, expectedIndex) =>
            sequenceIndex !== expectedIndex
        );
    });
}

export function analyzeMagicGraphControlPairs(
    nodes: readonly MagicGraphPresetNodeConfig[]
): MagicGraphControlPairAnalysis {
    const invalidNodeIds = nodes
        .filter(node =>
            CONTROL_PAIR_NODE_TYPES.has(node.magicType) !==
            Boolean(node.controlPair)
        )
        .map(node => node.id);
    const pairedNodes = nodes.filter(node =>
        CONTROL_PAIR_NODE_TYPES.has(node.magicType)
    );
    const pairIds = new Set(
        pairedNodes.flatMap(node =>
            node.controlPair?.id ? [node.controlPair.id] : []
        )
    );
    const invalidPairIds: string[] = [];
    const repeatIntervals: RepeatInterval[] = [];

    pairIds.forEach(pairId => {
        const pairNodes = pairedNodes.filter(node =>
            node.controlPair?.id === pairId
        );
        const start = pairNodes.find(node =>
            node.controlPair?.role === MAGIC_CONTROL_PAIR_ROLES.START
        );
        const end = pairNodes.find(node =>
            node.controlPair?.role === MAGIC_CONTROL_PAIR_ROLES.END
        );
        if (
            pairNodes.length !== 2 ||
            !start ||
            !end ||
            start.magicType !== end.magicType ||
            start.circleId !== end.circleId ||
            end.settings !== undefined ||
            (
                start.magicType === MAGIC_CONTROL_PAIR_NODE_TYPES.REPEAT &&
                start.sequenceIndex >= end.sequenceIndex
            )
        ) {
            invalidPairIds.push(pairId);
            return;
        }

        if (start.magicType === MAGIC_CONTROL_PAIR_NODE_TYPES.REPEAT) {
            repeatIntervals.push({
                circleId: start.circleId,
                start: start.sequenceIndex,
                end: end.sequenceIndex,
            });
        }
    });

    return {
        invalidNodeIds,
        invalidPairIds,
        hasCrossedRepeatPairs: repeatIntervals.some((left, index) =>
            repeatIntervals.slice(index + 1).some(right =>
                left.circleId === right.circleId &&
                intervalsCross(left, right)
            )
        ),
    };
}

export function hasValidMagicGraphControlPairs(
    nodes: readonly MagicGraphPresetNodeConfig[]
): boolean {
    const analysis = analyzeMagicGraphControlPairs(nodes);
    return analysis.invalidNodeIds.length === 0 &&
        analysis.invalidPairIds.length === 0 &&
        !analysis.hasCrossedRepeatPairs;
}

export function hasValidMagicGraphSystemNodeSlots(
    slots: readonly MagicGraphPresetCircleSystemNodeSlotConfig[],
    editableNodeCount: number
): boolean {
    const expectedMagicTypes = new Set(
        CIRCLE_SYSTEM_MAGIC_NODE_CONFIGS.map(config => config.magicType)
    );
    const actualMagicTypes = new Set(slots.map(slot => slot.magicType));

    return slots.length === expectedMagicTypes.size &&
        actualMagicTypes.size === slots.length &&
        slots.every(slot =>
            expectedMagicTypes.has(slot.magicType) &&
            Number.isInteger(slot.slotIndex) &&
            slot.slotIndex >= 0 &&
            slot.slotIndex <= editableNodeCount
        );
}

export function isMagicGraphExternalCircleEdge(
    edge: MagicGraphPresetEdgeConfig,
    circleIds: ReadonlySet<string>
): boolean {
    return circleIds.has(edge.source) &&
        circleIds.has(edge.target) &&
        isMagicCirclePortHandleId(edge.sourceHandle, 'output') &&
        isMagicCirclePortHandleId(edge.targetHandle, 'input');
}

export function normalizeMagicGraphPresetSettings(
    preset: MagicGraphPresetConfig,
    magicTypes: MagicTypeLookup
): MagicGraphPresetConfig {
    return {
        ...preset,
        circles: preset.circles.map(circle => ({
            ...circle,
            systemNodeSlots: circle.systemNodeSlots.map(slot => {
                const { settings: _settings, ...slotWithoutSettings } = slot;
                const settings = normalizeMagicNodeSettings(
                    readMagicTypeConfigByType(
                        slot.magicType,
                        SYSTEM_MAGIC_TYPE_LOOKUP
                    ),
                    slot.settings
                );

                return {
                    ...slotWithoutSettings,
                    ...(settings ? { settings } : {}),
                };
            }),
        })),
        nodes: preset.nodes.map(node => {
            const { settings: _settings, ...nodeWithoutSettings } = node;
            const settings = normalizeMagicNodeSettings(
                readMagicTypeConfigByType(node.magicType, magicTypes),
                node.settings
            );

            return {
                ...nodeWithoutSettings,
                ...(settings ? { settings } : {}),
            };
        }),
    };
}

function intervalsCross(
    left: RepeatInterval,
    right: RepeatInterval
): boolean {
    return (
        left.start < right.start &&
        right.start < left.end &&
        left.end < right.end
    ) || (
        right.start < left.start &&
        left.start < right.end &&
        right.end < left.end
    );
}
