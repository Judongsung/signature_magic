import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { MAGIC_CIRCLE_ANIMATION_MODES } from '../../../constants/magicCircleConfigs';
import {
    buildMagicCircleRenderModels,
    type MagicCircleRenderModel,
} from '../../../systems/graph/presentation/magicCircleRenderer';
import {
    createSingleNodeCircleFixture,
    resetGraphStoreFixture,
} from '../../../test-utils/graphFixtures';
import MagicCircleSvg from './MagicCircleSvg.svelte';

function resetGraphStore(): void {
    resetGraphStoreFixture();
}

function createSingleNodeCircleModel(): MagicCircleRenderModel {
    return buildMagicCircleRenderModels(createSingleNodeCircleFixture())[0];
}

describe('MagicCircleSvg', () => {
    beforeEach(() => {
        resetGraphStore();
    });

    it('renders the reusable SVG with the requested animation mode', () => {
        const circle = createSingleNodeCircleModel();

        const { html } = render(MagicCircleSvg, {
            props: {
                circle,
                index: 0,
                animationMode: MAGIC_CIRCLE_ANIMATION_MODES.BURST,
            },
        });

        expect(html).toContain('<svg');
        expect(html).toContain('data-animation-mode="burst"');
        expect(html).toContain('mode-burst');
        expect(html).toContain('aria-label="Magic circle 1"');
    });
});
