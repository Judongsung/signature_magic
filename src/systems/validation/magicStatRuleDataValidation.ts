import { MAGIC_STAT_SCALING_OPERATIONS } from '../../constants/magicStatConfigs';
import {
    MAGIC_STAT_KEYS,
    type MagicStatRuleConfig,
    type MagicStatRulesConfig,
} from '../../types/magic';
import {
    isMagicStatAggregationOperation,
    isMagicStatScalingOperation,
} from '../graph/calculation/magicStatRules';
import {
    isFiniteNumber,
    isPlainObject,
    result,
    type DataValidationResult,
} from './commonValidation';
import { MAGIC_STAT_KEY_SET } from './magicValidationShared';

function validateMagicStatRuleConfig(statKey: string, rule: MagicStatRuleConfig | undefined): string[] {
    if (!rule) return [`Missing magic stat rule config: ${statKey}`];

    const errors: string[] = [];

    if (!isMagicStatAggregationOperation(rule.nodeAggregation)) {
        errors.push(`Invalid magic stat node aggregation: ${statKey} -> ${rule.nodeAggregation}`);
    }
    if (!isMagicStatAggregationOperation(rule.serialAggregation)) {
        errors.push(`Invalid magic stat serial aggregation: ${statKey} -> ${rule.serialAggregation}`);
    }
    if (!isMagicStatAggregationOperation(rule.branchAggregation)) {
        errors.push(`Invalid magic stat branch aggregation config: ${statKey} -> ${rule.branchAggregation}`);
    }
    if (!rule.scaling || !isMagicStatScalingOperation(rule.scaling.operation)) {
        errors.push(`Invalid magic stat scaling operation: ${statKey} -> ${rule.scaling?.operation}`);
    }
    if (
        rule.scaling?.operation === MAGIC_STAT_SCALING_OPERATIONS.EXPONENTIAL_BY_NODE_COUNT &&
        !isFiniteNumber(rule.scaling.factor)
    ) {
        errors.push(`Invalid magic stat scaling factor: ${statKey} -> ${rule.scaling.factor}`);
    }

    return errors;
}

export function validateMagicStatRuleConfigs(statRulesInput: unknown): DataValidationResult {
    if (!isPlainObject(statRulesInput)) {
        return result(['Invalid magic stat rule configs']);
    }

    const statRules = statRulesInput as MagicStatRulesConfig;
    const errors: string[] = [];

    Object.keys(statRules).forEach(statKey => {
        if (!MAGIC_STAT_KEY_SET.has(statKey)) {
            errors.push(`Unknown magic stat rule config key: ${statKey}`);
        }
    });

    MAGIC_STAT_KEYS.forEach(statKey => {
        errors.push(...validateMagicStatRuleConfig(statKey, statRules[statKey]));
    });

    return result(errors);
}
