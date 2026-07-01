import type {
    CyoaDialogueResultCondition,
    CyoaDialogueResultContext,
    CyoaDialogueResultLineConfig,
} from '../../types/cyoa';
import {
    type MagicStatKey,
} from '../../types/magicStats';

function matchesNumericRange(value: number, range: { min?: number; max?: number }): boolean {
    if (range.min !== undefined && value < range.min) return false;
    if (range.max !== undefined && value > range.max) return false;

    return true;
}

export function matchesCyoaDialogueResultCondition(
    condition: CyoaDialogueResultCondition | undefined,
    context: CyoaDialogueResultContext | undefined
): boolean {
    if (!condition) return true;
    if (!context) return false;

    if (
        condition.circleCount
        && !matchesNumericRange(context.circleCount, condition.circleCount)
    ) {
        return false;
    }

    return Object.entries(condition.totalStats ?? {}).every(([statKey, range]) =>
        matchesNumericRange(context.totalStats[statKey as MagicStatKey], range)
    );
}

export function resolveCyoaDialogueResultLine(
    resultLines: readonly CyoaDialogueResultLineConfig[] | undefined,
    context: CyoaDialogueResultContext | undefined
) {
    return resultLines?.find(resultLine =>
        matchesCyoaDialogueResultCondition(resultLine.when, context)
    );
}
