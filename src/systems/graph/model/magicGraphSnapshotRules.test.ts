import { describe, expect, it } from 'vitest';
import {
    MAGIC_CIRCLE_HANDLE_IDS,
    MAGIC_CONTROL_PAIR_ROLES,
} from '../../../constants/graphConfigs';
import {
    CIRCLE_SYSTEM_MAGIC_NODE_TYPES,
} from '../../../constants/circleSystemMagicNodeConfigs';
import {
    type MagicGraphPresetConfig,
    type MagicGraphPresetNodeConfig,
} from '../presets/magicGraphPresetTypes';
import { magicTypeMap } from '../registry/magicTypeRegistry';
import {
    analyzeMagicGraphControlPairs,
    findNonContiguousMagicGraphSequenceCircleIds,
    hasValidMagicGraphConnectionJoinSlots,
    hasValidMagicGraphExternalFlow,
    hasValidMagicGraphSystemNodeSlots,
    isMagicGraphExternalCircleEdge,
    normalizeMagicGraphPresetSettings,
} from './magicGraphSnapshotRules';

function pairedNode(
    id: string,
    pairId: string,
    role: 'start' | 'end',
    sequenceIndex: number
): MagicGraphPresetNodeConfig {
    return {
        id,
        magicType: 'repeat',
        circleId: 'circle-a',
        sequenceIndex,
        controlPair: { id: pairId, role },
    };
}

describe('magicGraphSnapshotRules', () => {
    it('finds non-contiguous sequences by circle', () => {
        const nodes: MagicGraphPresetNodeConfig[] = [
            {
                id: 'first',
                magicType: 'ignition',
                circleId: 'circle-a',
                sequenceIndex: 0,
            },
            {
                id: 'third',
                magicType: 'stream',
                circleId: 'circle-a',
                sequenceIndex: 2,
            },
        ];

        expect(findNonContiguousMagicGraphSequenceCircleIds(
            nodes,
            ['circle-a', 'circle-b']
        )).toEqual(['circle-a']);
    });

    it('reports incomplete and crossed control pairs', () => {
        const incomplete = analyzeMagicGraphControlPairs([
            pairedNode(
                'start',
                'incomplete',
                MAGIC_CONTROL_PAIR_ROLES.START,
                0
            ),
        ]);
        expect(incomplete.invalidPairIds).toEqual(['incomplete']);

        const crossed = analyzeMagicGraphControlPairs([
            pairedNode('a-start', 'a', MAGIC_CONTROL_PAIR_ROLES.START, 0),
            pairedNode('b-start', 'b', MAGIC_CONTROL_PAIR_ROLES.START, 1),
            pairedNode('a-end', 'a', MAGIC_CONTROL_PAIR_ROLES.END, 2),
            pairedNode('b-end', 'b', MAGIC_CONTROL_PAIR_ROLES.END, 3),
        ]);
        expect(crossed.hasCrossedRepeatPairs).toBe(true);
    });

    it('reports a reverse branch pair as invalid', () => {
        const start = {
            ...pairedNode(
                'branch-start',
                'reverse-branch',
                MAGIC_CONTROL_PAIR_ROLES.START,
                2
            ),
            magicType: 'branch',
        };
        const end = {
            ...pairedNode(
                'branch-end',
                'reverse-branch',
                MAGIC_CONTROL_PAIR_ROLES.END,
                1
            ),
            magicType: 'branch',
        };

        expect(analyzeMagicGraphControlPairs([start, end]).invalidPairIds)
            .toEqual(['reverse-branch']);
    });

    it('validates circle system slots and external edges', () => {
        expect(hasValidMagicGraphSystemNodeSlots([{
            magicType: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
            slotIndex: 1,
        }], 1)).toBe(true);
        expect(hasValidMagicGraphSystemNodeSlots([], 1)).toBe(false);

        expect(isMagicGraphExternalCircleEdge({
            id: 'edge',
            source: 'circle-a',
            target: 'circle-b',
            sourceHandle: MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
            targetHandle: MAGIC_CIRCLE_HANDLE_IDS.INPUT,
        }, new Set(['circle-a', 'circle-b']))).toBe(true);
    });

    it('rejects connection join slots inside repeat intervals', () => {
        const nodes = [
            pairedNode(
                'repeat-start',
                'repeat',
                MAGIC_CONTROL_PAIR_ROLES.START,
                0
            ),
            {
                id: 'middle',
                magicType: 'ignition',
                circleId: 'circle-a',
                sequenceIndex: 1,
            },
            pairedNode(
                'repeat-end',
                'repeat',
                MAGIC_CONTROL_PAIR_ROLES.END,
                2
            ),
        ];
        const edge = {
            id: 'edge',
            source: 'circle-b',
            target: 'circle-a',
            sourceHandle: MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
            targetHandle: MAGIC_CIRCLE_HANDLE_IDS.INPUT,
        };

        expect(hasValidMagicGraphConnectionJoinSlots(
            [{ ...edge, joinSlotIndex: 0 }],
            nodes
        )).toBe(true);
        expect(hasValidMagicGraphConnectionJoinSlots(
            [{ ...edge, joinSlotIndex: 1 }],
            nodes
        )).toBe(false);
        expect(hasValidMagicGraphConnectionJoinSlots(
            [{ ...edge, joinSlotIndex: 2 }],
            nodes
        )).toBe(false);
        expect(hasValidMagicGraphConnectionJoinSlots(
            [{ ...edge, joinSlotIndex: 3 }],
            nodes
        )).toBe(true);
    });

    it('allows joins only before the first branch start', () => {
        const nodes: MagicGraphPresetNodeConfig[] = [
            {
                id: 'prefix',
                magicType: 'ignition',
                circleId: 'circle-a',
                sequenceIndex: 0,
            },
            {
                id: 'branch-start',
                magicType: 'branch',
                circleId: 'circle-a',
                sequenceIndex: 1,
                controlPair: {
                    id: 'branch-pair',
                    role: MAGIC_CONTROL_PAIR_ROLES.START,
                },
            },
            {
                id: 'branch-end',
                magicType: 'branch',
                circleId: 'circle-a',
                sequenceIndex: 2,
                controlPair: {
                    id: 'branch-pair',
                    role: MAGIC_CONTROL_PAIR_ROLES.END,
                },
            },
        ];
        const edge = {
            id: 'edge',
            source: 'circle-b',
            target: 'circle-a',
            sourceHandle: MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
            targetHandle: MAGIC_CIRCLE_HANDLE_IDS.INPUT,
        };

        expect(hasValidMagicGraphConnectionJoinSlots(
            [{ ...edge, joinSlotIndex: 1 }],
            nodes
        )).toBe(true);
        expect(hasValidMagicGraphConnectionJoinSlots(
            [{ ...edge, joinSlotIndex: 2 }],
            nodes
        )).toBe(false);
    });

    it('rejects circle fan-out while allowing multiple inputs', () => {
        expect(hasValidMagicGraphExternalFlow(
            ['a', 'b', 'target'],
            [
                {
                    id: 'a-target',
                    source: 'a',
                    target: 'target',
                    sourceHandle: MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
                    targetHandle: MAGIC_CIRCLE_HANDLE_IDS.INPUT,
                },
                {
                    id: 'b-target',
                    source: 'b',
                    target: 'target',
                    sourceHandle: MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
                    targetHandle: 'circle-input-1',
                },
            ]
        )).toBe(true);
        expect(hasValidMagicGraphExternalFlow(
            ['source', 'a', 'b'],
            [
                {
                    id: 'source-a',
                    source: 'source',
                    target: 'a',
                    sourceHandle: MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
                    targetHandle: MAGIC_CIRCLE_HANDLE_IDS.INPUT,
                },
                {
                    id: 'source-b',
                    source: 'source',
                    target: 'b',
                    sourceHandle: 'circle-output-1',
                    targetHandle: MAGIC_CIRCLE_HANDLE_IDS.INPUT,
                },
            ]
        )).toBe(false);
    });

    it('normalizes stored user and system settings', () => {
        const preset: MagicGraphPresetConfig = {
            id: 'preset',
            label: 'Preset',
            circles: [{
                id: 'circle-a',
                position: { x: 0, y: 0 },
                width: 480,
                height: 640,
                systemNodeSlots: [{
                    magicType:
                        CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
                    slotIndex: 1,
                    settings: {
                        caption: '  발현  ',
                        unknown: 'removed',
                    },
                }],
            }],
            nodes: [{
                id: 'detect',
                magicType: 'detect',
                circleId: 'circle-a',
                sequenceIndex: 0,
                settings: {
                    caption: '  감지  ',
                    weight: '7',
                },
            }],
            edges: [],
        };

        const normalized = normalizeMagicGraphPresetSettings(
            preset,
            magicTypeMap
        );

        expect(normalized.circles[0].systemNodeSlots[0].settings)
            .toEqual({ caption: '발현' });
        expect(normalized.nodes[0].settings)
            .toEqual({ caption: '감지' });
    });
});
