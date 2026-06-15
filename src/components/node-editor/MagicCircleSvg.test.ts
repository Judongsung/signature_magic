import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { MAGIC_CIRCLE_ANIMATION_MODES } from '../../constants/magicCircleConfigs';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../constants/systemMagicNodeConfigs';
import { graphStore } from '../../stores/graphStore.svelte';
import {
    buildMagicCircleRenderModels,
    type MagicCircleRenderModel,
} from '../../systems/graph/presentation/magicCircleRenderer';
import MagicCircleSvg from './MagicCircleSvg.svelte';

const EMPTY_EFFECTS = {
    nodeEffects: [],
    finalEffects: [],
};

function resetGraphStore(): void {
    graphStore.clear();
    graphStore.setExternalStatEffects(EMPTY_EFFECTS);
}

function createSingleNodeCircleModel(): MagicCircleRenderModel {
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

    return buildMagicCircleRenderModels(graphStore.circles)[0];
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
