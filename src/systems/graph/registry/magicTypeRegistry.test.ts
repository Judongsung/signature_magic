import { describe, expect, it } from 'vitest';
import { getMagicTypesByCategory } from './magicTypeRegistry';

describe('magicTypeRegistry', () => {
    it('keeps only detection and control-pair nodes in the control-facing category', () => {
        expect(getMagicTypesByCategory(['extension']).map(type => type.type))
            .toEqual(['detect', 'repeat', 'branch']);
    });

    it('moves diffusion nodes into the adjustment category', () => {
        const adjustmentTypes = getMagicTypesByCategory(['control'])
            .map(type => type.type);

        expect(adjustmentTypes).toContain('diffuse');
        expect(adjustmentTypes).toContain('disperse');
    });
});
