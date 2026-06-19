import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import type { MagicNodeData } from '../../../types/magic';
import CustomNode from './CustomNode.svelte';

vi.mock('@xyflow/svelte', () => ({
    Handle: () => '',
    Position: {
        Top: 'top',
        Bottom: 'bottom',
    },
    useUpdateNodeInternals: () => () => {},
}));

function renderNode(data: Partial<MagicNodeData> = {}) {
    return render(CustomNode, {
        props: {
            id: 'node-1',
            data: {
                magicType: 'ignition',
                ...data,
            },
            isConnectable: false,
        },
    });
}

describe('CustomNode', () => {
    it('renders node tooltip by default', () => {
        const { html } = renderNode();

        expect(html).toContain('tooltip-host');
        expect(html).toContain('aria-describedby="canvas-node-tooltip-node-1"');
        expect(html).toContain('description-tooltip');
    });

    it('omits tooltip DOM for image capture preview nodes', () => {
        const { html } = renderNode({ showTooltip: false });

        expect(html).not.toContain('tooltip-host');
        expect(html).not.toContain('aria-describedby="canvas-node-tooltip-node-1"');
        expect(html).not.toContain('description-tooltip');
    });
});
