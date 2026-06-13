import { describe, expect, it } from 'vitest';
import {
    isKnownCyoaImagePath,
    resolveCyoaImagePath,
} from './cyoaImageRegistry';

describe('cyoaImageRegistry', () => {
    it('resolves image paths that are explicitly registered for CYOA data', () => {
        expect(resolveCyoaImagePath('../assets/images/vera.webp')).toBeTypeOf('string');
        expect(resolveCyoaImagePath('../assets/images/age/youngage.jpg')).toBeTypeOf('string');
        expect(resolveCyoaImagePath('../assets/images/catalyst/staff.webp')).toBeTypeOf('string');
    });

    it('allows image-less choices and rejects unregistered assets', () => {
        expect(resolveCyoaImagePath()).toBeUndefined();
        expect(isKnownCyoaImagePath('../assets/images/luarn_chibi.png')).toBe(false);
        expect(isKnownCyoaImagePath('../assets/images/missing.webp')).toBe(false);
    });
});
