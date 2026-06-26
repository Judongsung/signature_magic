import type { MagicTypeConfig } from '../../types/magic';
import type { MagicGlyphConfig } from '../graph/presentation/magicGlyphRegistry';
import { isGlyphKind, type GlyphShape } from '../graph/presentation/magicGlyphShapes';
import {
    collectDuplicateErrors,
    isFiniteNumber,
    isNonEmptyString,
    isPlainObject,
    isPlainObjectArray,
    result,
    type DataValidationResult,
} from './commonValidation';

export function validateMagicGlyphs(
    glyphsInput: unknown,
    magicTypesInput: unknown
): DataValidationResult {
    if (!isMagicGlyphArray(glyphsInput)) {
        return result(['Invalid magic glyph configs']);
    }
    if (!isPlainObjectArray(magicTypesInput)) {
        return result(['Invalid magic type configs for glyphs']);
    }

    const glyphs = glyphsInput as unknown as MagicGlyphConfig[];
    const magicTypes = magicTypesInput as unknown as MagicTypeConfig[];
    const errors: string[] = [];
    const magicTypeIds = new Set(magicTypes.map(magicType => magicType.type));
    const glyphTypeIds = glyphs.map(glyph => glyph.magicType);
    const glyphTypeIdSet = new Set(glyphTypeIds);

    errors.push(...collectDuplicateErrors(glyphTypeIds, 'magic glyph config'));

    magicTypes.forEach(magicType => {
        if (!glyphTypeIdSet.has(magicType.type)) {
            errors.push(`Missing magic glyph config: ${magicType.type}`);
        }
    });

    glyphs.forEach(glyph => {
        if (!magicTypeIds.has(glyph.magicType)) {
            errors.push(`Unknown magic glyph type: ${glyph.magicType}`);
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
    shapesInput: unknown
): DataValidationResult {
    if (!isMagicGlyphShapeRecord(shapesInput)) {
        return result(['Invalid magic glyph shapes']);
    }

    const shapes = shapesInput as Record<string, GlyphShape>;
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
            if (!isNonEmptyString(path.d)) {
                errors.push(`Invalid magic glyph path: ${kind} -> ${index}`);
            }
        });

        circles.forEach((circle, index) => {
            if (!isFiniteNumber(circle.r) || circle.r <= 0) {
                errors.push(`Invalid magic glyph circle radius: ${kind} -> ${index}`);
            }
        });

        rects.forEach((rect, index) => {
            if (!isFiniteNumber(rect.width) || rect.width <= 0 || !isFiniteNumber(rect.height) || rect.height <= 0) {
                errors.push(`Invalid magic glyph rect size: ${kind} -> ${index}`);
            }
        });
    });

    return result(errors);
}

function isMagicGlyphArray(value: unknown): value is Record<string, unknown>[] {
    return isPlainObjectArray(value) && value.every(glyph =>
        glyph.runeKinds === undefined || Array.isArray(glyph.runeKinds)
    );
}

function isMagicGlyphShapeRecord(value: unknown): value is Record<string, GlyphShape> {
    if (!isPlainObject(value)) return false;

    return Object.values(value).every(shape =>
        isPlainObject(shape) &&
        (shape.paths === undefined || isPlainObjectArray(shape.paths)) &&
        (shape.circles === undefined || isPlainObjectArray(shape.circles)) &&
        (shape.rects === undefined || isPlainObjectArray(shape.rects))
    );
}
