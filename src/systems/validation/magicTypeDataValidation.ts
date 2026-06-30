import {
    MAGIC_NODE_EDITOR_BEHAVIORS,
    MAGIC_NODE_EDITOR_CONTROLS,
    MAGIC_NODE_EDITOR_PRESENTATIONS,
    type MagicNodeCategory,
} from '../../constants/nodeEditorConfigs';
import {
    MAGIC_STAT_KEYS,
    type MagicNodeInstanceEditorConfig,
    type MagicNodeStatRulesConfig,
    type MagicTypeConfig,
    type MagicStatsConfig,
} from '../../types/magic';
import { isMagicStatBranchAggregation } from '../graph/calculation/magicStatRules';
import {
    collectDuplicateErrors,
    isFiniteNumber,
    isNonEmptyString,
    isPlainObject,
    isPlainObjectArray,
    result,
    type DataValidationResult,
} from './commonValidation';
import {
    getMagicCategoryIds,
    MAGIC_STAT_KEY_SET,
} from './magicValidationShared';

const MAGIC_NODE_EDITOR_CONTROL_SET: ReadonlySet<string> =
    new Set(Object.values(MAGIC_NODE_EDITOR_CONTROLS));
const MAGIC_NODE_EDITOR_PRESENTATION_SET: ReadonlySet<string> =
    new Set(Object.values(MAGIC_NODE_EDITOR_PRESENTATIONS));
const MAGIC_NODE_EDITOR_BEHAVIOR_SET: ReadonlySet<string> =
    new Set(Object.values(MAGIC_NODE_EDITOR_BEHAVIORS));
const MAGIC_STAT_BOUND_OVERRIDE_KEYS = new Set(['minimum', 'maximum']);

function validateMagicStats(type: string, stats: MagicStatsConfig | undefined): string[] {
    if (!stats) return [`Missing magic type stats: ${type}`];

    return MAGIC_STAT_KEYS.flatMap(key => {
        const value = stats[key];
        return isFiniteNumber(value)
            ? []
            : [`Invalid magic type stat: ${type} -> ${key}`];
    });
}

function validateMagicNodeStatBounds(type: string, statBounds: unknown): string[] {
    if (statBounds === undefined) return [];
    if (!isPlainObject(statBounds)) {
        return [`Invalid magic node stat bounds: ${type}`];
    }

    const errors: string[] = [];

    Object.entries(statBounds).forEach(([statKey, bounds]) => {
        if (!MAGIC_STAT_KEY_SET.has(statKey)) {
            errors.push(`Unknown magic node stat bounds key: ${type} -> ${statKey}`);
            return;
        }
        if (!isPlainObject(bounds)) {
            errors.push(`Invalid magic node stat bounds: ${type} -> ${statKey}`);
            return;
        }

        Object.keys(bounds).forEach(key => {
            if (!MAGIC_STAT_BOUND_OVERRIDE_KEYS.has(key)) {
                errors.push(`Unknown magic node stat bound key: ${type} -> ${statKey} -> ${key}`);
            }
        });

        const { minimum, maximum } = bounds;
        if (minimum !== undefined && minimum !== null && !isFiniteNumber(minimum)) {
            errors.push(`Invalid magic node stat minimum: ${type} -> ${statKey} -> ${minimum}`);
        }
        if (maximum !== undefined && maximum !== null && !isFiniteNumber(maximum)) {
            errors.push(`Invalid magic node stat maximum: ${type} -> ${statKey} -> ${maximum}`);
        }
        if (
            isFiniteNumber(minimum) &&
            isFiniteNumber(maximum) &&
            minimum > maximum
        ) {
            errors.push(`Invalid magic node stat bounds order: ${type} -> ${statKey} -> ${minimum} -> ${maximum}`);
        }
    });

    return errors;
}

function validateMagicNodeInstanceEditor(
    type: string,
    instanceEditor: MagicNodeInstanceEditorConfig | undefined
): string[] {
    if (!instanceEditor) return [];
    if (!Array.isArray(instanceEditor.fields)) {
        return [`Invalid magic node editor fields: ${type}`];
    }

    const errors: string[] = [];
    const validFields = instanceEditor.fields.filter(isPlainObject);

    if (validFields.length !== instanceEditor.fields.length) {
        errors.push(`Invalid magic node editor field config: ${type}`);
    }

    errors.push(...collectDuplicateErrors(
        validFields.map(field => String(field.key ?? '')),
        `magic node editor field key: ${type}`
    ));
    errors.push(...collectDuplicateErrors(
        validFields.flatMap(field =>
            typeof field.presentation === 'string' ? [field.presentation] : []
        ),
        `magic node editor presentation: ${type}`
    ));
    errors.push(...collectDuplicateErrors(
        validFields.flatMap(field =>
            typeof field.behavior === 'string' ? [field.behavior] : []
        ),
        `magic node editor behavior: ${type}`
    ));

    validFields.forEach((field, index) => {
        const rawField = field as unknown as Record<string, unknown>;

        if (!isNonEmptyString(field.key)) {
            errors.push(`Invalid magic node editor field key: ${type} -> ${index}`);
        }
        if (!isNonEmptyString(field.label)) {
            errors.push(`Invalid magic node editor field label: ${type} -> ${index}`);
        }
        if (!MAGIC_NODE_EDITOR_CONTROL_SET.has(String(field.control))) {
            errors.push(`Unknown magic node editor control: ${type} -> ${index} -> ${field.control}`);
        }
        if (
            rawField.maxLength !== undefined &&
            (!Number.isInteger(rawField.maxLength) || Number(rawField.maxLength) <= 0)
        ) {
            errors.push(`Invalid magic node editor maxLength: ${type} -> ${index} -> ${rawField.maxLength}`);
        }
        if (rawField.placeholder !== undefined && typeof rawField.placeholder !== 'string') {
            errors.push(`Invalid magic node editor placeholder: ${type} -> ${index}`);
        }
        if (field.control === MAGIC_NODE_EDITOR_CONTROLS.STEPPER) {
            if (!Number.isInteger(field.min)) {
                errors.push(`Invalid magic node editor stepper min: ${type} -> ${index} -> ${field.min}`);
            }
            if (!Number.isInteger(field.max) || Number(field.max) < Number(field.min)) {
                errors.push(`Invalid magic node editor stepper max: ${type} -> ${index} -> ${field.max}`);
            }
            if (!Number.isInteger(field.step) || Number(field.step) <= 0) {
                errors.push(`Invalid magic node editor stepper step: ${type} -> ${index} -> ${field.step}`);
            }
            if (
                !Number.isInteger(field.defaultValue) ||
                Number(field.defaultValue) < Number(field.min) ||
                Number(field.defaultValue) > Number(field.max)
            ) {
                errors.push(`Invalid magic node editor stepper defaultValue: ${type} -> ${index} -> ${field.defaultValue}`);
            }
        }
        if (field.helpText !== undefined && typeof field.helpText !== 'string') {
            errors.push(`Invalid magic node editor helpText: ${type} -> ${index}`);
        }
        if (
            field.presentation !== undefined &&
            !MAGIC_NODE_EDITOR_PRESENTATION_SET.has(String(field.presentation))
        ) {
            errors.push(`Unknown magic node editor presentation: ${type} -> ${index} -> ${field.presentation}`);
        }
        if (
            field.behavior !== undefined &&
            !MAGIC_NODE_EDITOR_BEHAVIOR_SET.has(String(field.behavior))
        ) {
            errors.push(`Unknown magic node editor behavior: ${type} -> ${index} -> ${field.behavior}`);
        }
        if (
            field.behavior === MAGIC_NODE_EDITOR_BEHAVIORS.REPEAT_COUNT &&
            field.control !== MAGIC_NODE_EDITOR_CONTROLS.STEPPER
        ) {
            errors.push(`Invalid repeat count control: ${type} -> ${index}`);
        }
        if (
            field.behavior === MAGIC_NODE_EDITOR_BEHAVIORS.NODE_WEIGHT &&
            field.control !== MAGIC_NODE_EDITOR_CONTROLS.STEPPER
        ) {
            errors.push(`Invalid node weight control: ${type} -> ${index}`);
        }
        if (
            field.presentation === MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL_SUFFIX &&
            field.control !== MAGIC_NODE_EDITOR_CONTROLS.STEPPER
        ) {
            errors.push(`Invalid node label suffix control: ${type} -> ${index}`);
        }
        if (
            field.behavior === MAGIC_NODE_EDITOR_BEHAVIORS.REPEAT_COUNT &&
            field.presentation !== MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL_SUFFIX
        ) {
            errors.push(`Invalid repeat count presentation: ${type} -> ${index}`);
        }
        if (
            field.behavior === MAGIC_NODE_EDITOR_BEHAVIORS.NODE_WEIGHT &&
            field.presentation !== MAGIC_NODE_EDITOR_PRESENTATIONS.NODE_LABEL_SUFFIX
        ) {
            errors.push(`Invalid node weight presentation: ${type} -> ${index}`);
        }
    });

    return errors;
}

function validateMagicNodeStatRules(type: string, statRules: MagicNodeStatRulesConfig | undefined): string[] {
    if (!statRules) return [];

    const errors: string[] = [];

    Object.entries(statRules).forEach(([statKey, rule]) => {
        if (!MAGIC_STAT_KEY_SET.has(statKey)) {
            errors.push(`Unknown magic stat rule key: ${type} -> ${statKey}`);
            return;
        }
        if (!rule) return;
        if (rule.branchAggregation !== undefined && !isMagicStatBranchAggregation(rule.branchAggregation)) {
            errors.push(`Invalid magic stat branch aggregation: ${type} -> ${statKey} -> ${rule.branchAggregation}`);
        }
    });

    return errors;
}

function validateMagicTypeConfigs(
    magicTypesInput: unknown,
    categoriesInput: unknown
): DataValidationResult {
    if (!isPlainObjectArray(magicTypesInput)) {
        return result(['Invalid magic type configs']);
    }
    if (!Array.isArray(categoriesInput) || !categoriesInput.every(category => typeof category === 'string')) {
        return result(['Invalid magic type categories']);
    }

    const magicTypes = magicTypesInput as unknown as MagicTypeConfig[];
    const categories = categoriesInput as unknown as readonly MagicNodeCategory[];
    const errors: string[] = [];
    const categoryIds = getMagicCategoryIds(categories);

    errors.push(...collectDuplicateErrors(
        magicTypes.map(magicType => magicType.type),
        'magic type id'
    ));

    magicTypes.forEach(magicType => {
        if (!categoryIds.has(magicType.category)) {
            errors.push(`Unknown magic type category: ${magicType.type} -> ${magicType.category}`);
        }
        if (!isNonEmptyString(magicType.description)) {
            errors.push(`Missing magic type description: ${magicType.type}`);
        }
        errors.push(...validateMagicNodeInstanceEditor(magicType.type, magicType.instanceEditor));
        errors.push(...validateMagicStats(magicType.type, magicType.stats));
        errors.push(...validateMagicNodeStatBounds(magicType.type, magicType.statBounds));
        errors.push(...validateMagicNodeStatRules(magicType.type, magicType.statRules));
    });

    return result(errors);
}

export function validateMagicTypes(
    magicTypes: unknown,
    categories: unknown
): DataValidationResult {
    return validateMagicTypeConfigs(magicTypes, categories);
}

export function validateSystemMagicTypes(
    magicTypes: unknown,
    categories: unknown
): DataValidationResult {
    return validateMagicTypeConfigs(magicTypes, categories);
}
