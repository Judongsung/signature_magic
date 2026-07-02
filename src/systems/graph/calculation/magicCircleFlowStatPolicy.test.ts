import { describe, expect, it } from 'vitest';
import type { MagicStats } from '../../../types/magicStats';
import {
    combineMagicCircleFlowStats,
    finalizeMagicCircleFlowStats,
    resolveMagicFlowTotalStats,
} from './magicCircleFlowStatPolicy';

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

describe('magicCircleFlowStatPolicy', () => {
    it('applies each stat rule when two circle flows join', () => {
        expect(combineMagicCircleFlowStats(
            LEFT_STATS,
            RIGHT_STATS,
            'parallel'
        )).toEqual({
            castingTime: 14,
            instability: 22,
            power: 24,
            range: 5,
            manaCost: 12,
            duration: 4,
        });
    });

    it('uses configured serial rules before circle finalization', () => {
        expect(combineMagicCircleFlowStats(
            LEFT_STATS,
            RIGHT_STATS,
            'serial'
        )).toEqual({
            castingTime: 24,
            instability: 22,
            power: 24,
            range: 15,
            manaCost: 12,
            duration: 6,
        });
    });

    it('keeps only the current circle instability in circle details', () => {
        const accumulatedStats = {
            ...LEFT_STATS,
            instability: 99,
        };

        expect(finalizeMagicCircleFlowStats(
            accumulatedStats,
            { ...LEFT_STATS, instability: 6 }
        )).toEqual({
            ...accumulatedStats,
            instability: 6,
        });
    });

    it('adds one instability for every external circle connection', () => {
        expect(resolveMagicFlowTotalStats(
            LEFT_STATS,
            [
                { ...LEFT_STATS, instability: 6 },
                { ...RIGHT_STATS, instability: 14 },
                { ...RIGHT_STATS, instability: 8 },
            ],
            2
        )).toEqual({
            ...LEFT_STATS,
            instability: 16,
        });
    });
});
