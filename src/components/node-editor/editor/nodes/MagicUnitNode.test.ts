import { render } from 'svelte/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMagicTypeConfig } from '../../../../systems/graph/registry/magicTypeRegistry';
import {
    type MagicCircleSystemNodeData,
    type MagicNodeData,
    type MagicUserNodeData,
} from '../../../../systems/graph/magicGraphTypes';
import {
    type MagicStatEffectConfig,
} from '../../../../types/magicStatEffects';
import type {
    MagicNodeSequenceDrop,
} from '../../../../systems/graph/editor/magicCircleEditorInteraction';
import MagicUnitNode from './MagicUnitNode.svelte';

const renderContextMocks = vi.hoisted(() => ({
    sequenceDropPreview: undefined as MagicNodeSequenceDrop | undefined,
    nodeStatEffects: [] as MagicStatEffectConfig[],
    circleTitles: new Map<string, string>(),
}));

vi.mock('@xyflow/svelte', () => ({
    Handle: () => '',
    Position: {
        Top: 'top',
        Bottom: 'bottom',
    },
    useUpdateNodeInternals: () => () => {},
}));
vi.mock('../details/nodeDetailsContext', () => ({
    useNodeEditorDetails: () => undefined,
}));
vi.mock('../../rendering/magicGraphRenderContext', () => ({
    useMagicGraphRenderContext: () => ({
        getCircleChildren: () => [],
        getCircleState: () => undefined,
        getCircleTitle: (circleId: string) =>
            renderContextMocks.circleTitles.get(circleId),
        activeCircleId: undefined,
        get sequenceDropPreview() {
            return renderContextMocks.sequenceDropPreview;
        },
        get nodeStatEffects() {
            return renderContextMocks.nodeStatEffects;
        },
    }),
}));

afterEach(() => {
    renderContextMocks.sequenceDropPreview = undefined;
    renderContextMocks.nodeStatEffects = [];
    renderContextMocks.circleTitles.clear();
});

function renderNode(
    data:
        | (
            Partial<Omit<MagicUserNodeData, 'nodeKind'>> &
            { nodeKind?: 'user' }
        )
        | (
            Partial<Omit<MagicCircleSystemNodeData, 'nodeKind'>> &
            { nodeKind: 'system' }
        ) = {},
    parentId?: string
) {
    const magicType = typeof data.magicType === 'string'
        ? data.magicType
        : 'ignition';
    const nodeData: MagicNodeData = data.nodeKind === 'system'
        ? {
            ...data,
            magicType,
            nodeKind: 'system',
        }
        : {
            ...data,
            magicType,
            nodeKind: 'user',
        };

    return render(MagicUnitNode, {
        props: {
            id: 'node-1',
            data: nodeData,
            parentId,
        },
    });
}

describe('MagicUnitNode', () => {
    it('renders user nodes as horizontal sequence cards', () => {
        const { html } = renderNode({ nodeKind: 'user', sequenceIndex: 0 });

        expect(html).toContain('sequence-node');
        expect(html).not.toContain('root-badge');
        expect(html).not.toContain('leaf-badge');
    });

    it('renders circle system nodes with their dedicated style and tooltip', () => {
        const { html } = renderNode({
            magicType: 'manifestation',
            nodeKind: 'system',
            showTooltip: true,
            sequenceIndex: 0,
        }, 'circle-a');

        expect(html).toContain('sequence-node');
        expect(html).toContain('circle-system-node');
        expect(html).toContain('발현');
        expect(html).toContain('description-tooltip');
    });

    it('renders a connection join with its source circle title', () => {
        renderContextMocks.circleTitles.set(
            'circle-source',
            '수원 서클'
        );
        const { html } = renderNode({
            magicType: 'circleJoin',
            nodeKind: 'system',
            showTooltip: true,
            sequenceIndex: 0,
            connectionJoin: {
                edgeId: 'edge-join',
                sourceCircleId: 'circle-source',
            },
        }, 'circle-target');

        expect(html).toContain('connection-join-node');
        expect(html).toContain('수원 서클');
        expect(html).not.toContain('circle-system-node');
    });

    it('renders insertion feedback on the adjacent sequence card', () => {
        renderContextMocks.sequenceDropPreview = {
            targetCircleId: 'circle-a',
            insertionIndex: 1,
            indicatorY: 136,
            beforeNodeId: 'node-1',
            afterNodeId: undefined,
        };

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
        renderContextMocks.nodeStatEffects = [
            { phase: 'node', operation: 'add', stat: 'power', value: 1 },
            {
                phase: 'node',
                operation: 'add',
                stat: 'power',
                value: 10,
                nodeTarget: { categories: ['action'] },
            },
        ];

        const { html } = renderNode();

        expect(html).toContain('5');
        expect(html).toContain('(+1)');
        expect(html).not.toContain('(+11)');
    });

    it('omits editor-only tooltip DOM for result preview nodes', () => {
        const { html } = renderNode({
            magicType: 'detect',
            settings: { caption: '대상이 움직일 때' },
            showTooltip: false,
        });

        expect(html).not.toContain('tooltip-host');
        expect(html).not.toContain('aria-describedby="canvas-node-tooltip-node-1"');
        expect(html).not.toContain('description-tooltip');
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
            controlPair: { id: 'repeat-pair', role: 'start' },
            settings: { repeatCount: '3', caption: '되풀이' },
        }).html;
        const infinite = renderNode({
            magicType: 'repeat',
            controlPair: { id: 'infinite-pair', role: 'start' },
        }).html;

        expect(finite).toContain('반복 시작 ×3');
        expect(finite).toContain('되풀이');
        expect(infinite).toContain('반복 시작 ×1');
        expect(infinite).not.toContain('node-tooltip-stats');
    });

    it('renders control-pair end markers without caption or tooltip', () => {
        const { html } = renderNode({
            magicType: 'branch',
            controlPair: { id: 'branch-pair', role: 'end' },
            settings: { caption: '표시하지 않음' },
        });

        expect(html).toContain('분기 목적지');
        expect(html).not.toContain('표시하지 않음');
        expect(html).not.toContain('description-tooltip');
    });

    it('omits the node caption when its setting is empty', () => {
        const { html } = renderNode({
            magicType: 'branch',
            settings: { caption: '   ' },
        });

        expect(html).not.toContain('class="caption ');
    });
});
