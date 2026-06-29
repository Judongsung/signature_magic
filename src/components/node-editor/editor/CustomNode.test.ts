import { render } from 'svelte/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { graphStore } from '../../../stores/graphStore.svelte';
import { getMagicTypeConfig } from '../../../systems/graph/registry/magicTypeRegistry';
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
vi.mock('./nodeDetailsContext', () => ({
    useNodeEditorDetails: () => undefined,
}));

afterEach(() => {
    graphStore.setExternalStatEffects({ nodeEffects: [], finalEffects: [] });
    graphStore.setSequenceDropPreview(undefined);
});

function renderNode(
    data: Partial<MagicNodeData> = {},
    parentId?: string
) {
    return render(CustomNode, {
        props: {
            id: 'node-1',
            data: {
                magicType: 'ignition',
                ...data,
            },
            parentId,
            isConnectable: false,
        },
    });
}

describe('CustomNode', () => {
    it('renders user nodes as horizontal sequence cards', () => {
        const { html } = renderNode({ nodeKind: 'user', sequenceIndex: 0 });

        expect(html).toContain('sequence-node');
        expect(html).not.toContain('root-badge');
        expect(html).not.toContain('leaf-badge');
    });

    it('keeps system nodes in the original node variant', () => {
        const { html } = renderNode({
            nodeKind: 'system',
            isRoot: true,
            isLeaf: false,
        });

        expect(html).not.toContain('sequence-node');
        expect(html).toContain('root-badge');
    });

    it('renders insertion feedback on the adjacent sequence card', () => {
        graphStore.setSequenceDropPreview({
            circleId: 'circle-a',
            y: 136,
            beforeNodeId: 'node-1',
        });

        expect(renderNode(
            { nodeKind: 'user', sequenceIndex: 1 },
            'circle-a'
        ).html).toContain('sequence-insertion-before');
    });

    it('renders node tooltip by default', () => {
        const { html } = renderNode();

        expect(html).toContain('tooltip-host');
        expect(html).toContain('aria-describedby="canvas-node-tooltip-node-1"');
        expect(html).toContain('description-tooltip');
    });

    it('shows active node stat effects in canvas tooltips', () => {
        graphStore.setExternalStatEffects({
            nodeEffects: [
                { phase: 'node', operation: 'add', stat: 'power', value: 1 },
                {
                    phase: 'node',
                    operation: 'add',
                    stat: 'power',
                    value: 10,
                    nodeTarget: { categories: ['action'] },
                },
            ],
            finalEffects: [
                { phase: 'final', operation: 'add', stat: 'power', value: 10 },
            ],
        });

        const { html } = renderNode();

        expect(html).toContain('5');
        expect(html).toContain('(+1)');
        expect(html).not.toContain('(+11)');
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
        expect(html).toContain(getMagicTypeConfig('custom')!.description);
    });

    it('renders the default caption field for a regular node', () => {
        const { html } = renderNode({
            magicType: 'ignition',
            settings: { caption: '불꽃을 일으킨다' },
        });

        expect(html).toContain('class="caption ');
        expect(html).toContain('불꽃을 일으킨다');
    });

    it('renders repeat count in the node name while preserving its caption', () => {
        const finite = renderNode({
            magicType: 'repeat',
            settings: { repeatCount: '3', caption: '되풀이' },
        }).html;
        const infinite = renderNode({ magicType: 'repeat' }).html;

        expect(finite).toContain('반복 ×3');
        expect(finite).toContain('되풀이');
        expect(infinite).toContain('반복 ∞');
    });

    it('omits the node caption when its setting is empty', () => {
        const { html } = renderNode({
            magicType: 'branch',
            settings: { caption: '   ' },
        });

        expect(html).not.toContain('class="caption ');
    });
});
