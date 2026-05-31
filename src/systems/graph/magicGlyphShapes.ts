import magicGlyphShapeData from '../../data/magicGlyphShapes.json';

interface PathShape {
    d: string;
    className?: string;
}

interface CircleShape {
    cx: number;
    cy: number;
    r: number;
    className?: string;
}

interface RectShape {
    x: number;
    y: number;
    width: number;
    height: number;
    className?: string;
}

export interface GlyphShape {
    paths?: readonly PathShape[];
    circles?: readonly CircleShape[];
    rects?: readonly RectShape[];
}

export type GlyphKind = keyof typeof magicGlyphShapeData;

export const MAGIC_GLYPH_SHAPES: Record<GlyphKind, GlyphShape> = magicGlyphShapeData;

export function isGlyphKind(kind: string): kind is GlyphKind {
    return kind in MAGIC_GLYPH_SHAPES;
}
