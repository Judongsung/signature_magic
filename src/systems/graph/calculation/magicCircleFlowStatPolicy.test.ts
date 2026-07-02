import { describe, expect, it } from 'vitest';
import type { MagicStats } from '../../../types/magicStats';
import {
    combineMagicCircleFlowStats,
    finalizeMagicCircleFlowStats,
} from './magicCircleFlowStatPolicy';
import type { MagicStatRuleContext } from './magicStatRules';

const LEFT_STATS: MagicStats = {
    castingTime: 10,
    instability: 14,
    power: 10,
    range: 3,
    manaCost: 5,
    duration: 2,
};

const RIGHT_STATS: MagicStats = {
    castingTime: 14,
    instability: 8,
    power: 14,
    range: 5,
    manaCost: 7,
    duration: 4,
};

const EMPTY_CONTEXT: MagicStatRuleContext = {
    statKey: 'castingTime',
    scope: 'total',
    nodes: [],
    edges: [],
    magicTypes: new Map(),
};

describe('magicCircleFlowStatPolicy', () => {
    it('applies each stat rule when two circle flows join', () => {
        expect(combineMagicCircleFlowStats(
            LEFT_STATS,
            RIGHT_STATS,
            'parallel',
            EMPTY_CONTEXT
        )).toEqual({
            castingTime: 14,
            instability: 14,
            power: 24,
            range: 5,
            manaCost: 12,
            duration: 4,
        });
    });

    it('uses serial rules while preserving whole-circle instability', () => {
        expect(combineMagicCircleFlowStats(
            LEFT_STATS,
            RIGHT_STATS,
            'serial',
            EMPTY_CONTEXT
        )).toEqual({
            castingTime: 24,
            instability: 14,
            power: 24,
            range: 15,
            manaCost: 12,
            duration: 6,
        });
    });

    it('replaces segment instability with the maximum whole-circle value', () => {
        const accumulatedStats = {
            ...LEFT_STATS,
            instability: 99,
        };

        expect(finalizeMagicCircleFlowStats(
            accumulatedStats,
            { ...LEFT_STATS, instability: 6 },
            [
                { ...RIGHT_STATS, instability: 14 },
                { ...RIGHT_STATS, instability: 8 },
            ]
        )).toEqual({
            ...accumulatedStats,
            instability: 14,
        });
    });
});
