import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { graphStore } from '../../stores/graphStore.svelte';
import MagicCircleGenerator from './MagicCircleGenerator.svelte';

const EMPTY_EFFECTS = {
    nodeEffects: [],
    finalEffects: [],
};

function resetGraphStore(): void {
    graphStore.clear();
    graphStore.setExternalStatEffects(EMPTY_EFFECTS);
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
        graphStore.addNode('ignition', { x: 0, y: 0 });

        const { html } = render(MagicCircleGenerator);

        expect(html).toContain('count-number');
        expect(html).toContain('total-stats');
        expect(html).toContain('circle-card');
    });
});
