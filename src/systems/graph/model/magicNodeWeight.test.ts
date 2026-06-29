import { describe, expect, it } from 'vitest';
import { MAGIC_NODE_KINDS } from '../../../constants/graphConfigs';
import type { MagicNodeData } from '../../../types/magic';
import {
    applyMagicNodeWeightToStat,
    canMagicTypeUseNodeWeight,
    resolveMagicNodeWeight,
} from './magicNodeWeight';

const ACTION_TYPE = {
    type: 'ignition',
    category: 'action',
} as const;
const CONTROL_TYPE = {
    type: 'diffuse',
    category: 'control',
} as const;
const EXTENSION_TYPE = {
    type: 'detect',
    category: 'extension',
} as const;
const SUSTAIN_TYPE = {
    type: 'sustain',
    category: 'control',
} as const;

function data(
    weight: string | undefined,
    nodeKind?: MagicNodeData['nodeKind']
): Pick<MagicNodeData, 'settings' | 'nodeKind'> {
    return {
        ...(weight ? { settings: { weight } } : {}),
        ...(nodeKind ? { nodeKind } : {}),
    };
}

describe('magicNodeWeight', () => {
    it('allows user nodes except extension and system types', () => {
        expect(canMagicTypeUseNodeWeight(ACTION_TYPE)).toBe(true);
        expect(canMagicTypeUseNodeWeight(CONTROL_TYPE)).toBe(true);
        expect(canMagicTypeUseNodeWeight(EXTENSION_TYPE)).toBe(false);
        expect(canMagicTypeUseNodeWeight({
            type: 'manifestation',
            category: 'control',
        })).toBe(false);
    });

    it('normalizes the stored weight and ignores disallowed nodes', () => {
        expect(resolveMagicNodeWeight(data(undefined), ACTION_TYPE)).toBe(1);
        expect(resolveMagicNodeWeight(data('2.6'), ACTION_TYPE)).toBe(3);
        expect(resolveMagicNodeWeight(data('120'), ACTION_TYPE)).toBe(99);
        expect(resolveMagicNodeWeight(data('8'), EXTENSION_TYPE)).toBe(1);
        expect(resolveMagicNodeWeight(
            data('8', MAGIC_NODE_KINDS.SYSTEM),
            ACTION_TYPE
        )).toBe(1);
    });

    it('weights every stat except duration for regular nodes', () => {
        expect(applyMagicNodeWeightToStat(
            4,
            'power',
            data('3'),
            ACTION_TYPE
        )).toBe(12);
        expect(applyMagicNodeWeightToStat(
            4,
            'duration',
            data('3'),
            ACTION_TYPE
        )).toBe(4);
    });

    it('weights duration only for sustain nodes', () => {
        expect(applyMagicNodeWeightToStat(
            4,
            'duration',
            data('3'),
            SUSTAIN_TYPE
        )).toBe(12);
    });
});
