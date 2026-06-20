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

    it('omits editor-only tooltip and badge DOM for result preview nodes', () => {
        const { html } = renderNode({
            magicType: 'detect',
            settings: { caption: '대상이 움직일 때' },
            showTooltip: false,
            showBadges: false,
        });

        expect(html).not.toContain('tooltip-host');
        expect(html).not.toContain('aria-describedby="canvas-node-tooltip-node-1"');
        expect(html).not.toContain('description-tooltip');
        expect(html).not.toContain('class="badge ');
        expect(html).toContain('대상이 움직일 때');
    });

    it('uses an instance label without replacing the type description', () => {
        const { html } = renderNode({
            magicType: 'custom',
            settings: { displayName: '별빛 핵' },
        });

        expect(html).toContain('별빛 핵');
        expect(html).toContain('정해진 분류에 없는 속성이나 개념을 대신하는 범용 기초 노드입니다.');
    });

    it('renders the default caption field for a regular node', () => {
        const { html } = renderNode({
            magicType: 'ignition',
            settings: { caption: '불꽃을 일으킨다' },
        });

        expect(html).toContain('class="caption ');
        expect(html).toContain('불꽃을 일으킨다');
    });

    it('omits the node caption when its setting is empty', () => {
        const { html } = renderNode({
            magicType: 'branch',
            settings: { caption: '   ' },
        });

        expect(html).not.toContain('class="caption ');
    });
});
