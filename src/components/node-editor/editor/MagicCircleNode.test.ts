import { render } from 'svelte/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAGIC_CIRCLE_NODE_CONFIG } from '../../../constants/graphConfigs';
import { graphStore } from '../../../stores/graphStore.svelte';
import { getMagicCircleNodes } from '../../../systems/graph/model/magicCircleGraph';
import MagicCircleNode from './MagicCircleNode.svelte';

vi.mock('@xyflow/svelte', () => ({
    Handle: () => '',
    NodeResizer: () => '',
    Position: {
        Top: 'top',
        Bottom: 'bottom',
    },
    useUpdateNodeInternals: () => () => {},
}));
vi.mock('./nodeDetailsContext', () => ({
    useNodeEditorDetails: () => undefined,
}));

afterEach(() => {
    graphStore.clear();
});

function renderCircle(selected = false) {
    const circle = getMagicCircleNodes(graphStore.nodes)[0];
    return render(MagicCircleNode, {
        props: {
            id: circle.id,
            data: circle.data,
            width: circle.width,
            height: circle.height,
            selected,
            isConnectable: true,
        },
    });
}

describe('MagicCircleNode', () => {
    it('renders an empty circle with a dedicated title drag handle', () => {
        const { html } = renderCircle(true);

        expect(html).toContain('data-status="empty"');
        expect(html).toContain(MAGIC_CIRCLE_NODE_CONFIG.DRAG_HANDLE_CLASS);
        expect(html).toMatch(/class="magic-circle-node [^"]*selected"/);
        expect(html).toContain('INPUT');
        expect(html).toContain('OUTPUT');
        expect(html).not.toContain('START');
        expect(html).not.toContain('END');
    });

    it('does not render internal automatic connection graphics', () => {
        const circle = getMagicCircleNodes(graphStore.nodes)[0];
        graphStore.edges = [
            {
                id: 'input',
                source: 'system-mana-source',
                target: circle.id,
                sourceHandle: 'output-0',
                targetHandle: 'circle-input',
            },
            {
                id: 'output',
                source: circle.id,
                target: 'system-final-output',
                sourceHandle: 'circle-output',
                targetHandle: 'input-0',
            },
        ];

        const { html } = renderCircle();

        expect(html).not.toContain('<line');
        expect(html).not.toContain('automatic-link-fan');
    });

    it('renders an external-path status for a non-empty disconnected circle', () => {
        graphStore.addNode('ignition');

        expect(renderCircle().html).toContain('data-status="external"');
    });

    it('renders the active insertion indicator only for its circle', () => {
        const circle = getMagicCircleNodes(graphStore.nodes)[0];
        graphStore.setSequenceDropPreview({ circleId: circle.id, y: 120 });

        expect(renderCircle().html).toContain('sequence-insertion-indicator');
    });
});
