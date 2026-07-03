import type { MagicStatKey } from '../types/magicStats';

export const MAGIC_STAT_DISPLAY_CONTEXTS = {
    NODE: 'node',
    CIRCLE: 'circle',
    TOTAL: 'total',
} as const;

export type MagicStatDisplayContext =
    (typeof MAGIC_STAT_DISPLAY_CONTEXTS)[keyof typeof MAGIC_STAT_DISPLAY_CONTEXTS];

export interface MagicStatGradeBand {
    maximum: number;
    label: string;
}

export const MAGIC_STAT_PRESENTATION_CONFIG = {
    PRECISION: 100,
    RANGE_BASE_METERS: 1,
    UNITS: {
        castingTime: '초',
        range: 'm',
        manaCost: '마나',
        duration: '초',
    } satisfies Partial<Record<MagicStatKey, string>>,
    NODE_RANGE_PREFIX: '×',
    NODE_RANGE_ADJUSTMENT_UNIT: '배',
} as const;

export const MAGIC_STAT_GRADE_BANDS = {
    power: [
        { maximum: 0, label: '없음' },
        { maximum: 4, label: '미약' },
        { maximum: 14, label: '실용' },
        { maximum: 39.99, label: '강력' },
        { maximum: Number.POSITIVE_INFINITY, label: '대규모' },
    ],
    instability: [
        { maximum: 5, label: '안정' },
        { maximum: 10, label: '주의' },
        { maximum: 15, label: '위험' },
        { maximum: Number.POSITIVE_INFINITY, label: '극위험' },
    ],
} as const satisfies Partial<
    Record<MagicStatKey, readonly MagicStatGradeBand[]>
>;
