import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { MAGIC_CIRCLE_ANIMATION_MODES } from '../../../constants/magicCircleConfigs';
import { MAGIC_STAT_CALCULATION_DESCRIPTIONS } from '../../../constants/uiText';
import {
    createSingleNodeCircleFixture,
    resetGraphStoreFixture,
} from '../../../test-utils/graphFixtures';
import MagicCircleGenerator from './MagicCircleGenerator.svelte';

function resetGraphStore(): void {
    resetGraphStoreFixture();
}

describe('MagicCircleGenerator', () => {
    beforeEach(() => {
        resetGraphStore();
    });

    it('renders an empty hint before graph nodes exist', () => {
        const { html } = render(MagicCircleGenerator);

        expect(html).toContain('hint');
        expect(html).not.toContain('total-stats');
    });

    it('renders total stats and a circle card from graph store state', () => {
        createSingleNodeCircleFixture();

        const { html } = render(MagicCircleGenerator);

        expect(html).toContain('count-number');
        expect(html).toContain('total-stats');
        expect(html).toContain('circle-card');
        expect(html).toContain('data-animation-mode="static"');
        expect(html).toContain(MAGIC_STAT_CALCULATION_DESCRIPTIONS.circle.castingTime);
        expect(html).toContain(MAGIC_STAT_CALCULATION_DESCRIPTIONS.total.castingTime);
        expect((html.match(/role="tooltip"/g) ?? [])).toHaveLength(12);
    });

    it('passes the requested animation mode to circle cards', () => {
        createSingleNodeCircleFixture();

        const { html } = render(MagicCircleGenerator, {
            props: { animationMode: MAGIC_CIRCLE_ANIMATION_MODES.LOOP },
        });

        expect(html).toContain('data-animation-mode="loop"');
        expect(html).toContain('mode-loop');
    });
});
