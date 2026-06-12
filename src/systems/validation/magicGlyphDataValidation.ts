import type { MagicTypeConfig } from '../../types/magic';
import type { MagicGlyphConfig } from '../graph/presentation/magicGlyphRegistry';
import { isGlyphKind, type GlyphShape } from '../graph/presentation/magicGlyphShapes';
import {
    collectDuplicateErrors,
    isFiniteNumber,
    result,
    type DataValidationResult,
} from './commonValidation';

export function validateMagicGlyphs(
    glyphs: MagicGlyphConfig[],
    magicTypes: MagicTypeConfig[]
): DataValidationResult {
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
