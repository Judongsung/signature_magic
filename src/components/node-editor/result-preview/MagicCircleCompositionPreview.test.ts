import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { EMPTY_MAGIC_STATS, type CirclePath, type MagicType } from '../../../types/magic';
import MagicCircleCompositionPreview from './MagicCircleCompositionPreview.svelte';

function circle(id: string, magicType: MagicType): CirclePath {
    return {
        id,
        stats: { ...EMPTY_MAGIC_STATS },
        statAdjustments: { ...EMPTY_MAGIC_STATS },
        nodes: [
            {
                id: `${id}-node`,
                type: 'magicNode',
                position: { x: 0, y: 0 },
                data: { magicType },
            },
        ],
    };
}

describe('MagicCircleCompositionPreview', () => {
    it('renders the transition-style circle composition as a static preview', () => {
        const { html } = render(MagicCircleCompositionPreview, {
            props: {
                circles: [
                    circle('circle-1', 'ignition'),
                    circle('circle-2', 'stream'),
                ],
            },
        });

        expect(html).toContain('composition-central-circle');
        expect(html).toContain('composition-stage-frame');
        expect(html).toContain('composition-polygon-vertex');
        expect(html).toContain('--composition-stage-size:');
        expect(html.match(/data-animation-mode="static"/g)).toHaveLength(2);
        expect(html).not.toContain('data-animation-mode="loop"');
        expect(html).not.toContain('data-animation-mode="burst"');
    });

    it('renders an empty state before circles exist', () => {
        const { html } = render(MagicCircleCompositionPreview, {
            props: { circles: [] },
        });

        expect(html).toContain('composition-empty');
    });
});
