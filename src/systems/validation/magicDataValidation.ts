import {
    MAGIC_CONNECTION_RULE_KEYS,
    type MagicNodeCategory,
} from '../../constants/gameConfigs';
import { MAGIC_STAT_SCALING_OPERATIONS } from '../../constants/magicStatConfigs';
import {
    MAGIC_STAT_KEYS,
    type MagicNodeConnectionRules,
    type MagicNodeStatRulesConfig,
    type MagicStatRuleConfig,
    type MagicStatRulesConfig,
    type MagicTypeConfig,
    type MagicStatsConfig,
} from '../../types/magic';
import type { MagicGlyphConfig } from '../graph/presentation/magicGlyphRegistry';
import { isGlyphKind, type GlyphShape } from '../graph/presentation/magicGlyphShapes';
import {
    isMagicStatAggregationOperation,
    isMagicStatBranchAggregation,
    isMagicStatScalingOperation,
} from '../graph/calculation/magicStatRules';
import { findDuplicates, result, type DataValidationResult } from './commonValidation';

interface MagicTypeValidationOptions {
    allowZeroConnectionLimits?: boolean;
}

function isValidConnectionLimit(
    limit: number | null | undefined,
    options: MagicTypeValidationOptions = {}
): boolean {
    if (limit === undefined || limit === null) return true;
    if (!Number.isInteger(limit)) return false;

    // 일반 노드는 양수 제한만 허용하고, 시스템 노드만 0으로 특정 방향 연결을 막을 수 있다.
    return options.allowZeroConnectionLimits ? limit >= 0 : limit > 0;
}

function validateMagicConnectionRules(
    type: string,
    connectionRules: MagicNodeConnectionRules | undefined
): string[] {
    if (!connectionRules) return [];

    const errors: string[] = [];
    const validKeys = new Set<keyof MagicNodeConnectionRules>([
        MAGIC_CONNECTION_RULE_KEYS.ALLOW_CYCLE_FROM_OUTPUT,
    ]);

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
        return Number.isFinite(value)
            ? []
            : [`Invalid magic type stat: ${type} -> ${key}`];
    });
}

function validateMagicNodeStatRules(type: string, statRules: MagicNodeStatRulesConfig | undefined): string[] {
    if (!statRules) return [];

    const errors: string[] = [];
    const validStatKeys = new Set<string>(MAGIC_STAT_KEYS);

    Object.entries(statRules).forEach(([statKey, rule]) => {
        if (!validStatKeys.has(statKey)) {
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
        (rule.scaling.factor === undefined || !Number.isFinite(rule.scaling.factor))
    ) {
        errors.push(`Invalid magic stat scaling factor: ${statKey} -> ${rule.scaling.factor}`);
    }

    return errors;
}

export function validateMagicStatRuleConfigs(statRules: MagicStatRulesConfig): DataValidationResult {
    const errors: string[] = [];
    const validStatKeys = new Set<string>(MAGIC_STAT_KEYS);

    Object.keys(statRules).forEach(statKey => {
        if (!validStatKeys.has(statKey)) {
            errors.push(`Unknown magic stat rule config key: ${statKey}`);
        }
    });

    MAGIC_STAT_KEYS.forEach(statKey => {
        errors.push(...validateMagicStatRuleConfig(statKey, statRules[statKey]));
    });

    return result(errors);
}

function validateMagicTypeConfigs(
    magicTypes: MagicTypeConfig[],
    categories: readonly MagicNodeCategory[],
    options: MagicTypeValidationOptions = {}
): DataValidationResult {
    const errors: string[] = [];
    const categoryIds = new Set(categories);
    const duplicateTypes = findDuplicates(magicTypes.map(magicType => magicType.type));

    duplicateTypes.forEach(type => {
        errors.push(`Duplicate magic type id: ${type}`);
    });

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

export function validateMagicGlyphs(
    glyphs: MagicGlyphConfig[],
    magicTypes: MagicTypeConfig[]
): DataValidationResult {
    const errors: string[] = [];
    const magicTypeIds = new Set(magicTypes.map(magicType => magicType.type));
    const glyphTypeIds = glyphs.map(glyph => glyph.magicType);
    const glyphTypeIdSet = new Set(glyphTypeIds);

    findDuplicates(glyphTypeIds).forEach(type => {
        errors.push(`Duplicate magic glyph config: ${type}`);
    });

    magicTypes.forEach(magicType => {
        if (!glyphTypeIdSet.has(magicType.type)) {
            errors.push(`Missing magic glyph config: ${magicType.type}`);
        }
    });

    glyphs.forEach(glyph => {
        if (!magicTypeIds.has(glyph.magicType)) {
            errors.push(`Unknown magic glyph type: ${glyph.magicType}`);
        }
        if (!isGlyphKind(glyph.kind)) {
            errors.push(`Unknown magic glyph kind: ${glyph.magicType} -> ${glyph.kind}`);
        }
        glyph.runeKinds?.forEach((kind, index) => {
            if (!isGlyphKind(kind)) {
                errors.push(`Unknown magic rune kind: ${glyph.magicType} -> ${index} -> ${kind}`);
            }
        });
        if (!Number.isInteger(glyph.baseCount) || glyph.baseCount <= 0) {
            errors.push(`Invalid magic glyph baseCount: ${glyph.magicType} -> ${glyph.baseCount}`);
        }
    });

    return result(errors);
}

export function validateMagicGlyphShapes(
    shapes: Record<string, GlyphShape>
): DataValidationResult {
    const errors: string[] = [];
    const entries = Object.entries(shapes);

    if (entries.length === 0) {
        errors.push('Missing magic glyph shapes');
    }

    entries.forEach(([kind, shape]) => {
        const paths = shape.paths ?? [];
        const circles = shape.circles ?? [];
        const rects = shape.rects ?? [];

        if (paths.length + circles.length + rects.length === 0) {
            errors.push(`Empty magic glyph shape: ${kind}`);
        }

        paths.forEach((path, index) => {
            if (!path.d.trim()) {
                errors.push(`Invalid magic glyph path: ${kind} -> ${index}`);
            }
        });

        circles.forEach((circle, index) => {
            if (!Number.isFinite(circle.r) || circle.r <= 0) {
                errors.push(`Invalid magic glyph circle radius: ${kind} -> ${index}`);
            }
        });

        rects.forEach((rect, index) => {
            if (!Number.isFinite(rect.width) || rect.width <= 0 || !Number.isFinite(rect.height) || rect.height <= 0) {
                errors.push(`Invalid magic glyph rect size: ${kind} -> ${index}`);
            }
        });
    });

    return result(errors);
}
