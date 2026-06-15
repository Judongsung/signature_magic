import type { MAGIC_STAR_FIELD_CONFIG } from '../../../constants/graphConfigs';

type StarFieldConfig = typeof MAGIC_STAR_FIELD_CONFIG;
type StarFieldUnit = 'px' | '%';

export interface StarFieldBounds {
    width: number;
    height: number;
    unit: StarFieldUnit;
}

export interface StarFieldStar {
    x: string;
    y: string;
    size: string;
    color: string;
    glow: string;
}

function createSeededRandom(seed: number): () => number {
    let value = seed;

    return () => {
        value = (value * 9301 + 49297) % 233280;

        return value / 233280;
    };
}

function rangedValue(randomValue: number, min: number, max: number): number {
    return min + randomValue * (max - min);
}

function formatNumber(value: number): string {
    return value.toFixed(2).replace(/\.?0+$/, '');
}

export function createStarField(
    config: StarFieldConfig,
    bounds: StarFieldBounds
): StarFieldStar[] {
    const random = createSeededRandom(config.SEED);

    return Array.from({ length: config.COUNT }, (_, index) => {
        const xPercent = rangedValue(random(), config.MIN_POSITION_PERCENT, config.MAX_POSITION_PERCENT);
        const yPercent = rangedValue(random(), config.MIN_POSITION_PERCENT, config.MAX_POSITION_PERCENT);
        const radius = rangedValue(random(), config.MIN_RADIUS_PX, config.MAX_RADIUS_PX);
        const alpha = rangedValue(random(), config.MIN_ALPHA, config.MAX_ALPHA);
        const color = config.COLORS[index % config.COLORS.length];
        const glow = rangedValue(random(), config.MIN_GLOW_PX, config.MAX_GLOW_PX);

        return {
            x: `${formatNumber(bounds.width * (xPercent / 100))}${bounds.unit}`,
            y: `${formatNumber(bounds.height * (yPercent / 100))}${bounds.unit}`,
            size: `${formatNumber(radius * 2)}px`,
            color: `rgba(${color}, ${formatNumber(alpha)})`,
            glow: `0 0 ${formatNumber(glow)}px rgba(${color}, ${formatNumber(alpha * 0.8)})`,
        };
    });
}
