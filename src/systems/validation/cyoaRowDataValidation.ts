import {
    CYOA_INPUT_ROLES,
    CYOA_SELECTION_MODES,
    CYOA_SELECTION_POLICY,
} from '../../constants/cyoaConfigs';
import { MAGIC_NODE_CATEGORIES } from '../../constants/nodeEditorConfigs';
import type { CyoaChoiceBaseConfig, CyoaChoiceRowConfig, CyoaSubChoiceGroupConfig, } from '../../types/cyoa';
import {
    MAGIC_STAT_EFFECT_OPERATIONS,
    MAGIC_STAT_EFFECT_PHASES,
    MAGIC_STAT_EFFECT_VALUE_SIGNS,
} from '../../types/magicStatEffects';
import {
    MAGIC_STAT_KEYS,
} from '../../types/magicStats';
import { MAGIC_STAT_EFFECT_PHASE } from '../graph/calculation/magicStatEffectBundles';
import { isValidCyoaChoiceWidth } from '../cyoa/cyoaChoiceLayout';
import {
    collectDuplicateErrors,
    findDuplicates,
    formatValidationError,
    formatValidationPath,
    isFiniteNumber,
    isPlainObject,
    isPlainObjectArray,
    result,
    success,
    type DataValidationResult,
} from './commonValidation';
import {
    isValidCyoaChoiceImagePlacement,
    isValidCyoaChoiceImageSize,
    isValidCyoaSelectionMode,
} from './cyoaValidationShared';

const VALID_CYOA_INPUT_ROLES = new Set<string>(Object.values(CYOA_INPUT_ROLES));
const VALID_MAGIC_NODE_CATEGORIES = new Set<string>(MAGIC_NODE_CATEGORIES);
const VALID_MAGIC_STAT_EFFECT_VALUE_SIGNS =
    new Set<string>(Object.values(MAGIC_STAT_EFFECT_VALUE_SIGNS));
const DEFAULT_MAGIC_TYPE_CHECK = (_magicType: string): boolean => true;

type MagicTypeCheck = (magicType: string) => boolean;

function getCyoaSubChoiceGroup(
    choice: CyoaChoiceBaseConfig
): CyoaSubChoiceGroupConfig | undefined {
    const group = (choice as CyoaChoiceBaseConfig & { subChoiceGroup?: unknown }).subChoiceGroup;
    return isPlainObject(group) ? group as unknown as CyoaSubChoiceGroupConfig : undefined;
}

function getCyoaSubChoices(group?: CyoaSubChoiceGroupConfig): CyoaChoiceBaseConfig[] {
    if (!group || !Array.isArray(group.choices)) return [];
    return group.choices.filter(isPlainObject) as unknown as CyoaChoiceBaseConfig[];
}

function validateCyoaNodeTarget(
    choiceId: string,
    effectIndex: number,
    phase: unknown,
    nodeTarget: unknown,
    isKnownMagicType: MagicTypeCheck
): string[] {
    if (nodeTarget === undefined) return [];
    if (!isPlainObject(nodeTarget)) {
        return [formatValidationError(
            'Invalid',
            'CYOA stat effect node target',
            choiceId,
            effectIndex
        )];
    }

    const errors: string[] = [];
    const categories = nodeTarget.categories;
    const magicTypes = nodeTarget.magicTypes;
    const statValueSign = nodeTarget.statValueSign;

    if (phase !== MAGIC_STAT_EFFECT_PHASE.NODE) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA final stat effect node target',
            choiceId,
            effectIndex
        ));
    }
    if (
        categories === undefined &&
        magicTypes === undefined &&
        statValueSign === undefined
    ) {
        errors.push(formatValidationError(
            'Empty',
            'CYOA stat effect node target',
            choiceId,
            effectIndex
        ));
    }

    errors.push(...validateCyoaNodeTargetValues(
        choiceId,
        effectIndex,
        'category',
        'categories',
        categories,
        value => VALID_MAGIC_NODE_CATEGORIES.has(value)
    ));
    errors.push(...validateCyoaNodeTargetValues(
        choiceId,
        effectIndex,
        'magic type',
        'magic types',
        magicTypes,
        isKnownMagicType
    ));
    if (
        statValueSign !== undefined &&
        !VALID_MAGIC_STAT_EFFECT_VALUE_SIGNS.has(String(statValueSign))
    ) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA stat effect node value sign',
            choiceId,
            effectIndex,
            String(statValueSign)
        ));
    }

    return errors;
}

function validateCyoaNodeTargetValues(
    choiceId: string,
    effectIndex: number,
    targetKind: string,
    targetCollectionKind: string,
    values: unknown,
    isKnownValue: (value: string) => boolean
): string[] {
    if (values === undefined) return [];
    if (!Array.isArray(values) || values.length === 0) {
        return [formatValidationError(
            'Invalid',
            `CYOA stat effect node ${targetCollectionKind}`,
            choiceId,
            effectIndex
        )];
    }

    const errors: string[] = [];
    const validValues = values.filter((value): value is string => typeof value === 'string');

    values.forEach((value, valueIndex) => {
        if (typeof value !== 'string') {
            errors.push(formatValidationError(
                'Invalid',
                `CYOA stat effect node ${targetKind}`,
                choiceId,
                effectIndex,
                valueIndex
            ));
            return;
        }
        if (!isKnownValue(value)) {
            errors.push(formatValidationError(
                'Unknown',
                `CYOA stat effect node ${targetKind}`,
                choiceId,
                effectIndex,
                value
            ));
        }
    });
    findDuplicates(validValues).forEach(value => {
        errors.push(formatValidationError(
            'Duplicate',
            `CYOA stat effect node ${targetKind}`,
            choiceId,
            effectIndex,
            value
        ));
    });

    return errors;
}

function validateCyoaStatEffects(
    choiceId: string,
    statEffects: unknown,
    isKnownMagicType: MagicTypeCheck
): string[] {
    if (statEffects === undefined) return [];
    if (!Array.isArray(statEffects)) {
        return [formatValidationError('Invalid', 'CYOA stat effects', choiceId)];
    }

    const errors: string[] = [];
    const validPhases = new Set<string>(MAGIC_STAT_EFFECT_PHASES);
    const validOperations = new Set<string>(MAGIC_STAT_EFFECT_OPERATIONS);
    const validStatKeys = new Set<string>(MAGIC_STAT_KEYS);

    statEffects.forEach((effect, index) => {
        if (!isPlainObject(effect)) {
            errors.push(formatValidationError('Invalid', 'CYOA stat effect', choiceId, index));
            return;
        }

        const { phase, operation, stat, value, nodeTarget } = effect;

        if (!validPhases.has(String(phase))) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA stat effect phase',
                choiceId,
                index,
                String(phase)
            ));
        }
        if (!validOperations.has(String(operation))) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA stat effect operation',
                choiceId,
                index,
                String(operation)
            ));
        }
        if (!validStatKeys.has(String(stat))) {
            errors.push(formatValidationError(
                'Unknown',
                'CYOA stat effect key',
                choiceId,
                index,
                String(stat)
            ));
            return;
        }
        if (!isFiniteNumber(value)) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA stat effect value',
                choiceId,
                index,
                String(stat)
            ));
        }
        errors.push(...validateCyoaNodeTarget(
            choiceId,
            index,
            phase,
            nodeTarget,
            isKnownMagicType
        ));
    });

    return errors;
}

function validateCyoaChoice(
    choice: CyoaChoiceBaseConfig,
    isKnownImagePath: (imagePath: string) => boolean,
    isKnownMagicType: MagicTypeCheck
): string[] {
    const errors: string[] = [];

    if (choice.imagePath && !isKnownImagePath(choice.imagePath)) {
        errors.push(formatValidationError(
            'Unknown',
            'CYOA image path',
            choice.id,
            choice.imagePath
        ));
    }
    if (choice.imageSize !== undefined && !isValidCyoaChoiceImageSize(choice.imageSize)) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA choice image size',
            choice.id,
            String(choice.imageSize)
        ));
    }
    if (choice.imagePlacement !== undefined && !isValidCyoaChoiceImagePlacement(choice.imagePlacement)) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA choice image placement',
            choice.id,
            String(choice.imagePlacement)
        ));
    }
    if (choice.description !== undefined && typeof choice.description !== 'string') {
        errors.push(formatValidationError('Invalid', 'CYOA choice description', choice.id));
    }
    if (choice.tooltip !== undefined && typeof choice.tooltip !== 'string') {
        errors.push(formatValidationError('Invalid', 'CYOA choice tooltip', choice.id));
    }
    if (choice.width && !isValidCyoaChoiceWidth(choice.width)) {
        errors.push(formatValidationError('Invalid', 'CYOA choice width', choice.id, choice.width));
    }
    errors.push(...validateCyoaStatEffects(
        choice.id,
        choice.statEffects,
        isKnownMagicType
    ));

    return errors;
}

function validateCyoaSubChoiceGroup(
    group: CyoaSubChoiceGroupConfig,
    isKnownImagePath: (imagePath: string) => boolean,
    isKnownMagicType: MagicTypeCheck
): string[] {
    const errors: string[] = [];
    const requiredCount = group.requiredCount ?? CYOA_SELECTION_POLICY.DEFAULT_REQUIRED_COUNT;
    const selectionMode = group.selectionMode ?? CYOA_SELECTION_MODES.SINGLE;
    const rawChoices: unknown[] = Array.isArray(group.choices) ? group.choices : [];

    if (typeof group.title !== 'string' || group.title.trim().length === 0) {
        errors.push(formatValidationError('Invalid', 'CYOA sub-choice group title', group.id));
    }
    if (!Number.isInteger(requiredCount) || requiredCount < 0) {
        errors.push(formatValidationError('Invalid', 'CYOA sub-choice required count', group.id, requiredCount));
    }
    if (!isValidCyoaSelectionMode(selectionMode)) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA sub-choice selection mode',
            group.id,
            String(selectionMode)
        ));
    }
    if (!Array.isArray(group.choices)) {
        errors.push(formatValidationError('Invalid', 'CYOA sub-choice choices', group.id));
    }
    if (requiredCount > rawChoices.length) {
        errors.push(`CYOA sub-choice required count exceeds choices: ${formatValidationPath(group.id, requiredCount)}`);
    }
    if (
        selectionMode === CYOA_SELECTION_MODES.SINGLE &&
        requiredCount > CYOA_SELECTION_POLICY.SINGLE_SELECT_MAX_REQUIRED_COUNT
    ) {
        errors.push(formatValidationError(
            'Invalid',
            'CYOA single-select sub-choice required count',
            group.id,
            requiredCount
        ));
    }

    rawChoices.forEach((rawChoice, index) => {
        if (!isPlainObject(rawChoice)) {
            errors.push(formatValidationError('Invalid', 'CYOA sub-choice', group.id, index));
            return;
        }

        const choice = rawChoice as unknown as CyoaChoiceBaseConfig;
        errors.push(...validateCyoaChoice(choice, isKnownImagePath, isKnownMagicType));

        if ('subChoiceGroup' in choice && choice.subChoiceGroup !== undefined) {
            errors.push(formatValidationError('Invalid', 'nested CYOA sub-choice group', choice.id));
        }
    });

    return errors;
}

export function validateCyoaRows(
    rowsInput: unknown,
    isKnownImagePath: (imagePath: string) => boolean,
    isKnownMagicType: MagicTypeCheck = DEFAULT_MAGIC_TYPE_CHECK
): DataValidationResult {
    if (!isCyoaRowArray(rowsInput)) {
        return result(['Invalid CYOA row configs']);
    }

    const rows = rowsInput as unknown as CyoaChoiceRowConfig[];
    if (rows.length === 0) return success();

    const errors: string[] = [];
    const rowIds = rows.map(row => row.id);
    const subChoiceGroups = rows.flatMap(row =>
        (row.choices ?? []).flatMap(choice => {
            const group = getCyoaSubChoiceGroup(choice);
            return group ? [group] : [];
        })
    );
    const subChoiceGroupIds = subChoiceGroups.map(group => group.id);
    const choiceIds = rows.flatMap(row => (row.choices ?? []).flatMap(choice => [
        choice.id,
        ...getCyoaSubChoices(getCyoaSubChoiceGroup(choice)).map(subChoice => subChoice.id),
    ]));
    const choiceIdSet = new Set(choiceIds);
    const inputIds = rows.flatMap(row => row.input ? [row.input.id] : []);
    const inputRoles = rows.flatMap(row => row.input?.role ? [String(row.input.role)] : []);

    errors.push(...collectDuplicateErrors(rowIds, 'CYOA row id'));
    errors.push(...collectDuplicateErrors(subChoiceGroupIds, 'CYOA sub-choice group id'));
    [...new Set(subChoiceGroupIds.filter(groupId => rowIds.includes(groupId)))].forEach(groupId => {
        errors.push(formatValidationError('Duplicate', 'CYOA selection group id', groupId));
    });
    errors.push(...collectDuplicateErrors(choiceIds, 'CYOA choice id'));
    errors.push(...collectDuplicateErrors(inputIds, 'CYOA input id'));
    errors.push(...collectDuplicateErrors(inputRoles, 'CYOA input role'));

    rows.forEach(row => {
        const rawChoices = row.choices ?? [];
        const rowChoiceById = new Map(rawChoices.map(choice => [choice.id, choice]));
        const lockedChoiceIds = Array.isArray(row.lockedChoiceIds) ? row.lockedChoiceIds : [];
        const validLockedChoiceIds = lockedChoiceIds.filter((choiceId): choiceId is string =>
            typeof choiceId === 'string'
        );
        const maxSelectedCount = row.maxSelectedCount;
        const selectionMode = row.selectionMode ?? CYOA_SELECTION_MODES.SINGLE;
        const requiredCount = row.requiredCount ?? CYOA_SELECTION_POLICY.DEFAULT_REQUIRED_COUNT;

        if (row.description !== undefined && typeof row.description !== 'string') {
            errors.push(formatValidationError('Invalid', 'CYOA row description', row.id));
        }
        if (row.npcDescription !== undefined && typeof row.npcDescription !== 'string') {
            errors.push(formatValidationError('Invalid', 'CYOA row NPC description', row.id));
        }
        if (row.requiredCount !== undefined && (!Number.isInteger(row.requiredCount) || row.requiredCount < 0)) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA required count',
                row.id,
                row.requiredCount
            ));
        }
        if (row.selectionMode !== undefined && !isValidCyoaSelectionMode(row.selectionMode)) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA selection mode',
                row.id,
                String(row.selectionMode)
            ));
        }
        if (row.lockedChoiceIds !== undefined && !Array.isArray(row.lockedChoiceIds)) {
            errors.push(formatValidationError('Invalid', 'CYOA locked choice ids', row.id));
        }
        lockedChoiceIds.forEach((choiceId, index) => {
            if (typeof choiceId !== 'string') {
                errors.push(formatValidationError('Invalid', 'CYOA locked choice id', row.id, index));
                return;
            }

            const lockedChoice = rowChoiceById.get(choiceId);
            if (!lockedChoice) {
                errors.push(formatValidationError('Unknown', 'CYOA locked choice', row.id, choiceId));
                return;
            }
            if (lockedChoice.disabled) {
                errors.push(formatValidationError('Invalid', 'disabled CYOA locked choice', row.id, choiceId));
            }
        });
        findDuplicates(validLockedChoiceIds).forEach(choiceId => {
            errors.push(formatValidationError('Duplicate', 'CYOA locked choice id', row.id, choiceId));
        });
        if (maxSelectedCount !== undefined && (!Number.isInteger(maxSelectedCount) || maxSelectedCount < 0)) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA max selected count',
                row.id,
                maxSelectedCount
            ));
        }
        if (selectionMode === CYOA_SELECTION_MODES.SINGLE && maxSelectedCount !== undefined && maxSelectedCount > 1) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA single-select max selected count',
                row.id,
                maxSelectedCount
            ));
        }
        if (maxSelectedCount !== undefined && Number.isInteger(maxSelectedCount) && maxSelectedCount >= 0) {
            if (requiredCount > maxSelectedCount) {
                errors.push(formatValidationError(
                    'Invalid',
                    'CYOA required count exceeds max selected count',
                    row.id,
                    requiredCount
                ));
            }
            if (validLockedChoiceIds.length > maxSelectedCount) {
                errors.push(formatValidationError(
                    'Invalid',
                    'CYOA locked choice count exceeds max selected count',
                    row.id,
                    validLockedChoiceIds.length
                ));
            }
        }
        if (row.input && (row.choices?.length ?? 0) > 0) {
            errors.push(`CYOA row cannot mix input and choices: ${row.id}`);
        }
        if (row.input?.role !== undefined && !VALID_CYOA_INPUT_ROLES.has(String(row.input.role))) {
            errors.push(formatValidationError(
                'Unknown',
                'CYOA input role',
                row.id,
                String(row.input.role)
            ));
        }
        if (row.input && (row.requiredCount ?? 0) > CYOA_SELECTION_POLICY.INPUT_REQUIRED_COUNT) {
            errors.push(formatValidationError(
                'Invalid',
                'CYOA input required count',
                row.id,
                row.requiredCount ?? 0
            ));
        }
        if (!row.input && row.requiredCount !== undefined && row.requiredCount > (row.choices?.length ?? 0)) {
            errors.push(`CYOA required count exceeds choices: ${formatValidationPath(row.id, row.requiredCount)}`);
        }
        if (row.visibleWhen?.choiceSelected && !choiceIdSet.has(row.visibleWhen.choiceSelected)) {
            errors.push(formatValidationError(
                'Unknown',
                'CYOA visibleWhen choice',
                row.id,
                row.visibleWhen.choiceSelected
            ));
        }
        row.visibleWhen?.anyChoiceSelected?.forEach(choiceId => {
            if (!choiceIdSet.has(choiceId)) {
                errors.push(formatValidationError(
                    'Unknown',
                    'CYOA visibleWhen any choice',
                    row.id,
                    choiceId
                ));
            }
        });
        row.visibleWhen?.allChoicesSelected?.forEach(choiceId => {
            if (!choiceIdSet.has(choiceId)) {
                errors.push(formatValidationError(
                    'Unknown',
                    'CYOA visibleWhen all choice',
                    row.id,
                    choiceId
                ));
            }
        });

        (row.choices ?? []).forEach(choice => {
            errors.push(...validateCyoaChoice(choice, isKnownImagePath, isKnownMagicType));
            const rawSubChoiceGroup = (choice as typeof choice & { subChoiceGroup?: unknown }).subChoiceGroup;
            const subChoiceGroup = getCyoaSubChoiceGroup(choice);
            if (rawSubChoiceGroup !== undefined && !subChoiceGroup) {
                errors.push(formatValidationError('Invalid', 'CYOA sub-choice group', choice.id));
            } else if (subChoiceGroup) {
                errors.push(...validateCyoaSubChoiceGroup(
                    subChoiceGroup,
                    isKnownImagePath,
                    isKnownMagicType
                ));
            }
        });
    });

    return result(errors);
}

function isCyoaRowArray(value: unknown): value is Record<string, unknown>[] {
    if (!isPlainObjectArray(value)) return false;

    return value.every(row =>
        (row.input === undefined || isPlainObject(row.input)) &&
        (row.choices === undefined || (
            isPlainObjectArray(row.choices) && row.choices.every(isSafeCyoaChoiceContainer)
        )) &&
        isSafeVisibilityCondition(row.visibleWhen)
    );
}

function isSafeCyoaChoiceContainer(choice: Record<string, unknown>): boolean {
    const group = choice.subChoiceGroup;
    return group === undefined || !isPlainObject(group) ||
        group.choices === undefined || isPlainObjectArray(group.choices);
}

function isSafeVisibilityCondition(value: unknown): boolean {
    if (value === undefined) return true;
    if (!isPlainObject(value)) return false;

    return (value.anyChoiceSelected === undefined || Array.isArray(value.anyChoiceSelected)) &&
        (value.allChoicesSelected === undefined || Array.isArray(value.allChoicesSelected));
}
