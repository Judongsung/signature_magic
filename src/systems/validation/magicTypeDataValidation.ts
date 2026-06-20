import {
    MAGIC_CONNECTION_RULE_KEYS,
    MAGIC_NODE_EDITOR_CONTROLS,
    MAGIC_NODE_EDITOR_PRESENTATIONS,
    type MagicNodeCategory,
} from '../../constants/gameConfigs';
import {
    MAGIC_STAT_KEYS,
    type MagicNodeConnectionRules,
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
    result,
    type DataValidationResult,
} from './commonValidation';
import {
    getMagicCategoryIds,
    getMagicConnectionRuleKeys,
    isValidConnectionLimit,
    MAGIC_STAT_KEY_SET,
    type MagicTypeValidationOptions,
} from './magicValidationShared';

const MAGIC_NODE_EDITOR_CONTROL_SET: ReadonlySet<string> =
    new Set(Object.values(MAGIC_NODE_EDITOR_CONTROLS));
const MAGIC_NODE_EDITOR_PRESENTATION_SET: ReadonlySet<string> =
    new Set(Object.values(MAGIC_NODE_EDITOR_PRESENTATIONS));

function validateMagicConnectionRules(
    type: string,
    connectionRules: MagicNodeConnectionRules | undefined
): string[] {
    if (!connectionRules) return [];

    const errors: string[] = [];
    const validKeys = getMagicConnectionRuleKeys();

    Object.entries(connectionRules).forEach(([key, value]) => {
        if (!validKeys.has(key as keyof MagicNodeConnectionRules)) {
            errors.push(`Unknown magic connection rule key: ${type} -> ${key}`);
            return;
        }
        if (key === MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT && typeof value !== 'boolean') {
            errors.push(`Invalid magic connection rule ${MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT}: ${type} -> ${value}`);
        }
    });

    return errors;
}

function validateMagicStats(type: string, stats: MagicStatsConfig | undefined): string[] {
    if (!stats) return [`Missing magic type stats: ${type}`];

    return MAGIC_STAT_KEYS.flatMap(key => {
        const value = stats[key];
        return isFiniteNumber(value)
            ? []
            : [`Invalid magic type stat: ${type} -> ${key}`];
    });
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

    validFields.forEach((field, index) => {
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
            field.maxLength !== undefined &&
            (!Number.isInteger(field.maxLength) || (field.maxLength as number) <= 0)
        ) {
            errors.push(`Invalid magic node editor maxLength: ${type} -> ${index} -> ${field.maxLength}`);
        }
        if (field.placeholder !== undefined && typeof field.placeholder !== 'string') {
            errors.push(`Invalid magic node editor placeholder: ${type} -> ${index}`);
        }
        if (
            field.presentation !== undefined &&
            !MAGIC_NODE_EDITOR_PRESENTATION_SET.has(String(field.presentation))
        ) {
            errors.push(`Unknown magic node editor presentation: ${type} -> ${index} -> ${field.presentation}`);
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
    magicTypes: MagicTypeConfig[],
    categories: readonly MagicNodeCategory[],
    options: MagicTypeValidationOptions = {}
): DataValidationResult {
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
        if (!magicType.description.trim()) {
            errors.push(`Missing magic type description: ${magicType.type}`);
        }
        if (!isValidConnectionLimit(magicType.connectionLimits?.maxInputs, options)) {
            errors.push(`Invalid magic type maxInputs: ${magicType.type} -> ${magicType.connectionLimits?.maxInputs}`);
        }
        if (!isValidConnectionLimit(magicType.connectionLimits?.maxOutputs, options)) {
            errors.push(`Invalid magic type maxOutputs: ${magicType.type} -> ${magicType.connectionLimits?.maxOutputs}`);
        }
        errors.push(...validateMagicConnectionRules(magicType.type, magicType.connectionRules));
        errors.push(...validateMagicNodeInstanceEditor(magicType.type, magicType.instanceEditor));
        errors.push(...validateMagicStats(magicType.type, magicType.stats));
        errors.push(...validateMagicNodeStatRules(magicType.type, magicType.statRules));
    });

    return result(errors);
}

export function validateMagicTypes(
    magicTypes: MagicTypeConfig[],
    categories: readonly MagicNodeCategory[]
): DataValidationResult {
    return validateMagicTypeConfigs(magicTypes, categories);
}

export function validateSystemMagicTypes(
    magicTypes: MagicTypeConfig[],
    categories: readonly MagicNodeCategory[]
): DataValidationResult {
    return validateMagicTypeConfigs(magicTypes, categories, { allowZeroConnectionLimits: true });
}
