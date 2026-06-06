import magicGlyphData from '../../../data/magicGlyphs.json';
import type { MagicType } from '../../../types/magic';
import type { GlyphKind } from './magicGlyphShapes';

export interface MagicGlyphConfig {
    magicType: MagicType;
    kind: GlyphKind;
    runeKinds?: GlyphKind[];
    baseCount: number;
}

export const magicGlyphs = magicGlyphData as MagicGlyphConfig[];

export const magicGlyphMap = new Map<MagicType, MagicGlyphConfig>(
    magicGlyphs.map(config => [config.magicType, config])
);
