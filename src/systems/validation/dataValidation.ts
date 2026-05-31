import type { CyoaAction, MagicNodeCategory } from '../../constants/gameConfigs';
import type { CyoaChoiceRowConfig } from '../../types/cyoa';
import {
    MAGIC_STAT_KEYS,
    type MagicNodeStatRulesConfig,
    type MagicTypeConfig,
    type MagicStatsConfig,
} from '../../types/magic';
import type { MagicGlyphConfig } from '../graph/magicGlyphRegistry';
import { isGlyphKind, type GlyphShape } from '../graph/magicGlyphShapes';
import { isMagicStatBranchAggregation } from '../graph/magicStatRules';

export interface DataValidationResult {
    valid: boolean;
    errors: string[];
}

function success(): DataValidationResult {
    return { valid: true, errors: [] };
}

function result(errors: string[]): DataValidationResult {
    return { valid: errors.length === 0, errors };
}

function findDuplicates(values: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    values.forEach(value => {
        if (seen.has(value)) duplicates.add(value);
        seen.add(value);
    });

    return [...duplicates];
}

function isValidChoiceWidth(width: string): boolean {
    const match = width.match(/^(\d+)\/(\d+)$/);
    if (!match) return false;

    const numerator = Number(match[1]);
    const denominator = Number(match[2]);
    return numerator > 0 && denominator > 0 && numerator <= denominator;
}

function isValidConnectionLimit(limit: number | null | undefined): boolean {
    return limit === undefined || limit === null || (Number.isInteger(limit) && limit > 0);
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

function validateMagicStatRules(type: string, statRules: MagicNodeStatRulesConfig | undefined): string[] {
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

export function validateMagicTypes(
    magicTypes: MagicTypeConfig[],
    categories: readonly { id: MagicNodeCategory }[]
): DataValidationResult {
    const errors: string[] = [];
    const categoryIds = new Set(categories.map(category => category.id));
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
        if (!isValidConnectionLimit(magicType.connectionLimits?.maxInputs)) {
            errors.push(`Invalid magic type maxInputs: ${magicType.type} -> ${magicType.connectionLimits?.maxInputs}`);
        }
        if (!isValidConnectionLimit(magicType.connectionLimits?.maxOutputs)) {
            errors.push(`Invalid magic type maxOutputs: ${magicType.type} -> ${magicType.connectionLimits?.maxOutputs}`);
        }
        errors.push(...validateMagicStats(magicType.type, magicType.stats));
        errors.push(...validateMagicStatRules(magicType.type, magicType.statRules));
    });

    return result(errors);
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

export function validateCyoaRows(
    rows: CyoaChoiceRowConfig[],
    actions: Record<string, CyoaAction>,
    isKnownImagePath: (imagePath: string) => boolean
): DataValidationResult {
    if (rows.length === 0) return success();

    const errors: string[] = [];
    const rowIds = rows.map(row => row.id);
    const rowIdSet = new Set(rowIds);
    const actionSet = new Set(Object.values(actions));
    const choiceIds = rows.flatMap(row => (row.choices ?? []).map(choice => choice.id));
    const inputIds = rows.flatMap(row => row.input ? [row.input.id] : []);

    findDuplicates(rowIds).forEach(id => {
        errors.push(`Duplicate CYOA row id: ${id}`);
    });

    findDuplicates(choiceIds).forEach(id => {
        errors.push(`Duplicate CYOA choice id: ${id}`);
    });

    findDuplicates(inputIds).forEach(id => {
        errors.push(`Duplicate CYOA input id: ${id}`);
    });

    rows.forEach(row => {
        if (row.requiredMode && !['always', 'visible', 'never'].includes(row.requiredMode)) {
            errors.push(`Unknown CYOA required mode: ${row.id} -> ${row.requiredMode}`);
        }
        if (row.input && (row.choices?.length ?? 0) > 0) {
            errors.push(`CYOA row cannot mix input and choices: ${row.id}`);
        }

        (row.choices ?? []).forEach(choice => {
            if (choice.imagePath && !isKnownImagePath(choice.imagePath)) {
                errors.push(`Unknown CYOA image path: ${choice.id} -> ${choice.imagePath}`);
            }
            if (choice.width && !isValidChoiceWidth(choice.width)) {
                errors.push(`Invalid CYOA choice width: ${choice.id} -> ${choice.width}`);
            }

            choice.actions?.forEach(action => {
                if (!actionSet.has(action.func)) {
                    errors.push(`Unknown CYOA action: ${choice.id} -> ${action.func}`);
                }
                if (action.target_id && !rowIdSet.has(action.target_id)) {
                    errors.push(`Unknown CYOA action target: ${choice.id} -> ${action.target_id}`);
                }
            });
        });
    });

    return result(errors);
}
