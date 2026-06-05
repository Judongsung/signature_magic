import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { graphStore } from '../../stores/graphStore.svelte';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../constants/systemMagicNodeConfigs';
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
        const userNode = graphStore.nodes.find(node => node.data.magicType === 'ignition')!;
        const sourceEdge = graphStore.prepareEdge({
            source: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
            target: userNode.id,
            sourceHandle: 'output-0',
            targetHandle: 'input-0',
        });
        const outputEdge = graphStore.prepareEdge({
            source: userNode.id,
            target: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
            sourceHandle: 'output-0',
            targetHandle: 'input-0',
        });
        graphStore.edges = [
            ...(sourceEdge ? [sourceEdge] : []),
            ...(outputEdge ? [outputEdge] : []),
        ];

        const { html } = render(MagicCircleGenerator);

        expect(html).toContain('count-number');
        expect(html).toContain('total-stats');
        expect(html).toContain('circle-card');
    });
});
