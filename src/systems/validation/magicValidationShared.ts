import {
    MAGIC_CONNECTION_RULE_KEYS,
    type MagicNodeCategory,
} from '../../constants/gameConfigs';
import {
    MAGIC_STAT_KEYS,
    type MagicNodeConnectionRules,
} from '../../types/magic';

export interface MagicTypeValidationOptions {
    allowZeroConnectionLimits?: boolean;
}

export const MAGIC_STAT_KEY_SET = new Set<string>(MAGIC_STAT_KEYS);

export function isValidConnectionLimit(
    limit: number | null | undefined,
    options: MagicTypeValidationOptions = {}
): boolean {
    if (limit === undefined || limit === null) return true;
    if (!Number.isInteger(limit)) return false;

    // 일반 노드는 양수 제한만 허용하고, 시스템 노드만 0으로 특정 방향 연결을 막을 수 있다.
    return options.allowZeroConnectionLimits ? limit >= 0 : limit > 0;
}

export function getMagicCategoryIds(categories: readonly MagicNodeCategory[]): Set<MagicNodeCategory> {
    return new Set(categories);
}

export function getMagicConnectionRuleKeys(): Set<keyof MagicNodeConnectionRules> {
    return new Set<keyof MagicNodeConnectionRules>([
        MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT,
    ]);
}
