import { CYOA_CHOICE_IMAGE_PLACEMENTS, CYOA_CHOICE_IMAGE_SIZES, CYOA_DIALOGUE_TEXT_VARIANTS, CYOA_SELECTION_MODES } from '../../constants/cyoaConfigs';
import type { CyoaRowVisibilityCondition } from '../../types/cyoa';
import { isKnownStringValue } from './commonValidation';

const CYOA_SELECTION_MODE_VALUES = new Set<string>(Object.values(CYOA_SELECTION_MODES));
const CYOA_CHOICE_IMAGE_SIZE_VALUES = new Set<string>(Object.values(CYOA_CHOICE_IMAGE_SIZES));
const CYOA_CHOICE_IMAGE_PLACEMENT_VALUES = new Set<string>(Object.values(CYOA_CHOICE_IMAGE_PLACEMENTS));
const CYOA_DIALOGUE_TEXT_VARIANT_VALUES = new Set<string>(Object.values(CYOA_DIALOGUE_TEXT_VARIANTS));

export function isValidCyoaSelectionMode(selectionMode: unknown): boolean {
    return isKnownStringValue(selectionMode, CYOA_SELECTION_MODE_VALUES);
}

export function isValidCyoaChoiceImageSize(imageSize: unknown): boolean {
    return isKnownStringValue(imageSize, CYOA_CHOICE_IMAGE_SIZE_VALUES);
}

export function isValidCyoaChoiceImagePlacement(imagePlacement: unknown): boolean {
    return isKnownStringValue(imagePlacement, CYOA_CHOICE_IMAGE_PLACEMENT_VALUES);
}

export function isValidCyoaDialogueTextVariant(variant: unknown): boolean {
    return isKnownStringValue(variant, CYOA_DIALOGUE_TEXT_VARIANT_VALUES);
}

export function getVisibilityConditionChoiceIds(condition?: CyoaRowVisibilityCondition): string[] {
    if (!condition) return [];

    return [
        ...(condition.choiceSelected ? [condition.choiceSelected] : []),
        ...(condition.anyChoiceSelected ?? []),
        ...(condition.allChoicesSelected ?? []),
    ];
}
