import { describe, expect, it } from 'vitest';
import {
    isKnownCyoaImagePath,
    resolveCyoaImagePath,
} from './cyoaImageRegistry';

describe('cyoaImageRegistry', () => {
    it('resolves image paths under the CYOA image directory', () => {
        [
            '../assets/images/vera.webp',
            '../assets/images/age/youngage.jpg',
            '../assets/images/catalyst/staff.webp',
            '../assets/images/luarn_chibi.png',
            '../assets/images/race/elf.webp',
            '../assets/images/catalyst/tattoo_bak.webp',
        ].forEach(imagePath => {
            expect(isKnownCyoaImagePath(imagePath)).toBe(true);
            expect(resolveCyoaImagePath(imagePath)).toBeTypeOf('string');
        });
    });

    it('allows image-less choices and rejects unregistered assets', () => {
        expect(resolveCyoaImagePath()).toBeUndefined();
        expect(isKnownCyoaImagePath('../assets/images/missing.webp')).toBe(false);
    });
});
