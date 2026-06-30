import { describe, expect, it } from 'vitest';
import { MAGIC_CIRCLE_PORT_CONFIG } from '../../../constants/graphConfigs';
import { resolveCirclePortLeft } from './magicHandlePresentation';

describe('magicHandlePresentation', () => {
    it('centers circle ports with a fixed interval regardless of count', () => {
        expect(resolveCirclePortLeft(0, 1)).toBe('50%');
        expect(resolveCirclePortLeft(0, 3))
            .toBe(`calc(50% - ${MAGIC_CIRCLE_PORT_CONFIG.SPACING_PX}px)`);
        expect(resolveCirclePortLeft(1, 3)).toBe('50%');
        expect(resolveCirclePortLeft(2, 3))
            .toBe(`calc(50% + ${MAGIC_CIRCLE_PORT_CONFIG.SPACING_PX}px)`);
        expect(resolveCirclePortLeft(0, 2))
            .toBe(`calc(50% - ${MAGIC_CIRCLE_PORT_CONFIG.SPACING_PX / 2}px)`);
    });
});
