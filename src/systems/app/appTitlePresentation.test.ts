import { describe, expect, it } from 'vitest';
import {
    APP_TITLE_MAGIC_TYPE_SEQUENCE,
    APP_TITLE_PRESENTATION_CONFIG,
    buildAppTitleMagicCircle,
} from './appTitlePresentation';

describe('appTitlePresentation', () => {
    it('builds the decorative title circle from the configured sequence', () => {
        const circle = buildAppTitleMagicCircle();
        const ringTypes = circle.rings.map(ring => ring.node.data.magicType);
        const bandTypes = circle.bands.map(band => band.node.data.magicType);

        expect(circle.id).toBe(APP_TITLE_PRESENTATION_CONFIG.CIRCLE_ID);
        expect(ringTypes).toEqual(APP_TITLE_MAGIC_TYPE_SEQUENCE);
        expect(bandTypes).toEqual(APP_TITLE_MAGIC_TYPE_SEQUENCE);
        expect(circle.rings).toHaveLength(6);
        expect(circle.bands).toHaveLength(6);
        expect(circle.bands.map(band => band.spinDuration)).toEqual([
            36,
            46,
            56,
            66,
            76,
            86,
        ]);
    });
});
