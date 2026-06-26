import magicGlyphData from '../../../data/magicGlyphs.json';
import type { MagicType } from '../../../types/magic';
import type { GlyphKind } from './magicGlyphShapes';

const DEFAULT_MAGIC_GLYPH_TYPE: MagicType = '__default__';
const DEFAULT_MAGIC_GLYPH_RUNE_KINDS = [
    'rune-star',
    'rune-orbit',
    'rune-lens',
    'rune-thread',
    'rune-mirror',
    'rune-spark',
    'rune-door',
    'rune-knot',
    'rune-bloom',
    'rune-crown',
    'rune-star',
    'rune-thread',
] satisfies GlyphKind[];

export interface MagicGlyphConfig {
    magicType: MagicType;
    runeKinds?: GlyphKind[];
    baseCount: number;
}

export const DEFAULT_MAGIC_GLYPH_CONFIG: MagicGlyphConfig & { runeKinds: GlyphKind[] } = {
    magicType: DEFAULT_MAGIC_GLYPH_TYPE,
    runeKinds: DEFAULT_MAGIC_GLYPH_RUNE_KINDS,
    baseCount: DEFAULT_MAGIC_GLYPH_RUNE_KINDS.length,
};

export const magicGlyphs = magicGlyphData as MagicGlyphConfig[];

export const magicGlyphMap = new Map<MagicType, MagicGlyphConfig>(
    magicGlyphs.map(config => [config.magicType, config])
);
