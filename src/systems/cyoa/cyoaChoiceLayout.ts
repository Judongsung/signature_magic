export interface CyoaChoiceWidth {
    numerator: number;
    denominator: number;
}

export const DEFAULT_CYOA_CHOICE_WIDTH = '1/3';

const DEFAULT_PARSED_CYOA_CHOICE_WIDTH: CyoaChoiceWidth = {
    numerator: 1,
    denominator: 3,
};

function greatestCommonDivisor(a: number, b: number): number {
    return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

function leastCommonMultiple(a: number, b: number): number {
    return Math.abs(a * b) / greatestCommonDivisor(a, b);
}

export function parseCyoaChoiceWidth(width = DEFAULT_CYOA_CHOICE_WIDTH): CyoaChoiceWidth {
    const match = width.match(/^(\d+)\/(\d+)$/);
    if (!match) return DEFAULT_PARSED_CYOA_CHOICE_WIDTH;

    const numerator = Number(match[1]);
    const denominator = Number(match[2]);
    if (numerator <= 0 || denominator <= 0 || numerator > denominator) {
        return DEFAULT_PARSED_CYOA_CHOICE_WIDTH;
    }

    return { numerator, denominator };
}

export function isValidCyoaChoiceWidth(width: string): boolean {
    const match = width.match(/^(\d+)\/(\d+)$/);
    if (!match) return false;

    const numerator = Number(match[1]);
    const denominator = Number(match[2]);
    return numerator > 0 && denominator > 0 && numerator <= denominator;
}

export function resolveCyoaLayoutColumns(widths: readonly CyoaChoiceWidth[]): number {
    if (widths.length === 0) return 1;
    return widths.map(width => width.denominator).reduce(leastCommonMultiple, 1);
}
