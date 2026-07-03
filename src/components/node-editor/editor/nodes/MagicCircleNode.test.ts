import { render } from 'svelte/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAGIC_CIRCLE_NODE_CONFIG } from '../../../../constants/graphConfigs';
import { graphStore } from '../../../../stores/graphStore.svelte';
import {
    getCircleChildNodes,
    getMagicCircleNodes,
} from '../../../../systems/graph/model/magicCircleGraph';
import {
    type MagicCircleState,
} from '../../../../systems/graph/calculation/magicCalculationTypes';
import {
    type MagicNode,
} from '../../../../systems/graph/magicGraphTypes';
import type {
    MagicNodeSequenceDrop,
} from '../../../../systems/graph/editor/magicCircleEditorInteraction';
import MagicCircleNode from './MagicCircleNode.svelte';

const renderContextMocks = vi.hoisted(() => ({
    children: [] as MagicNode[],
    circleState: undefined as MagicCircleState | undefined,
    activeCircleId: undefined as string | undefined,
    sequenceDropPreview: undefined as MagicNodeSequenceDrop | undefined,
    resizeCircle: vi.fn(),
}));

vi.mock('@xyflow/svelte', () => ({
    Handle: () => '',
    NodeResizer: () => '',
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
    resolveMagicCircleRenderTitle: (
        circle: { data: { name?: string } },
        state: { displayOrder: number } | undefined
    ) => circle.data.name || `서클 ${state?.displayOrder ?? '—'}`,
    useMagicGraphRenderContext: () => ({
        getCircleChildren: () => renderContextMocks.children,
        getCircleState: () => renderContextMocks.circleState,
        get activeCircleId() {
            return renderContextMocks.activeCircleId;
        },
        get sequenceDropPreview() {
            return renderContextMocks.sequenceDropPreview;
        },
        nodeStatEffects: [],
    }),
    useMagicGraphEditorActions: () => ({
        resizeCircle: renderContextMocks.resizeCircle,
    }),
}));

afterEach(() => {
    graphStore.clear();
    renderContextMocks.resizeCircle.mockReset();
    renderContextMocks.sequenceDropPreview = undefined;
});

function renderCircle(selected = false, draggable = true) {
    const circle = getMagicCircleNodes(graphStore.nodes)[0];
    renderContextMocks.children = getCircleChildNodes(
        graphStore.nodes,
        circle.id
    );
    renderContextMocks.circleState = graphStore.circleStates.find(state =>
        state.circleId === circle.id
    );
    renderContextMocks.activeCircleId = graphStore.activeCircleId;
    renderContextMocks.sequenceDropPreview =
        graphStore.sequenceDropPreview;
    return render(MagicCircleNode, {
        props: {
            id: circle.id,
            data: circle.data,
            width: circle.width,
            height: circle.height,
            selected,
            draggable,
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
        expect(html).toContain('입력');
        expect(html).toContain('출력');
        expect(html).not.toContain('START');
        expect(html).not.toContain('END');
        expect(html).not.toContain('circle-status');
    });

    it('does not render internal automatic connection graphics', () => {
        graphStore.addNode('ignition');
        graphStore.addNode('stream');
        const [first, second] = graphStore.nodes.filter(node =>
            node.parentId === getMagicCircleNodes(graphStore.nodes)[0].id
        );
        graphStore.acceptFlowEdges([
            {
                id: 'stale-internal',
                source: first.id,
                target: second.id,
                sourceHandle: 'output-0',
                targetHandle: 'input-0',
            },
        ]);

        const { html } = renderCircle();

        expect(html).not.toContain('<line');
        expect(html).not.toContain('automatic-link-fan');
    });

    it('renders a valid status for a non-empty disconnected circle', () => {
        graphStore.addNode('ignition');

        expect(renderCircle().html).toContain('data-status="valid"');
    });

    it('renders the active insertion indicator only for its circle', () => {
        const circle = getMagicCircleNodes(graphStore.nodes)[0];
        graphStore.setSequenceDropPreview({
            targetCircleId: circle.id,
            insertionIndex: 0,
            indicatorY: 120,
            beforeNodeId: undefined,
            afterNodeId: undefined,
        });

        expect(renderCircle().html).toContain('sequence-insertion-indicator');
    });

    it('renders only presentation branch connectors', () => {
        graphStore.addNode('repeat');
        graphStore.addNode('branch');

        const { html } = renderCircle();

        expect(html).toContain('control-pair-overlay');
        expect(html).not.toContain('repeat-connector');
        expect(html).toContain('branch-connector');
        expect(graphStore.edges).toEqual([]);
    });

    it('rejects moving a branch target above its condition marker', () => {
        graphStore.addNode('branch');
        const circle = getMagicCircleNodes(graphStore.nodes)[0];
        const branchEnd = getCircleChildNodes(graphStore.nodes, circle.id)
            .find(node => node.data.controlPair?.role === 'end')!;

        expect(graphStore.moveNodeGroup([{
            nodeId: branchEnd.id,
            circleId: circle.id,
            sequenceIndex: branchEnd.data.sequenceIndex ?? 0,
        }], circle.id, 0)).toBe(false);

        const { html } = renderCircle();

        expect(html).toContain('branch-connector');
        expect(getCircleChildNodes(graphStore.nodes, circle.id)
            .map(node => node.data.controlPair?.role)
        ).toEqual(['start', 'end', undefined]);
    });

    it('keeps a visible horizontal hook without repeat indentation', () => {
        graphStore.addNode('branch');

        const { html } = renderCircle();

        expect(html).toContain(
            'M 412 100 H 424 Q 430 100 430 106'
        );
        expect(html).toContain(
            'Q 430 140 424 140 H 412'
        );
    });

    it('anchors a repeated branch beyond the indented cards', () => {
        const circle = getMagicCircleNodes(graphStore.nodes)[0];
        graphStore.addNode('repeat', circle.id);
        graphStore.addNode('branch', circle.id, 1);

        const { html } = renderCircle();

        expect(html).toContain('M 412 140');
        expect(html).toContain('Q 430 140 430 146');
        expect(html).not.toContain('M 392 140');
    });

    it('keeps control-pair connectors in the read-only renderer', () => {
        graphStore.addNode('branch');

        const { html } = renderCircle(false, false);

        expect(html).toContain('read-only');
        expect(html).toContain('branch-connector');
        expect(html).not.toContain('circle-details-trigger');
    });

    it('renders the circle caption beside its name', () => {
        const circle = getMagicCircleNodes(graphStore.nodes)[0];
        graphStore.updateCircleMetadata(circle.id, {
            name: '점화 서클',
            caption: '불꽃을 연속 발현',
        });

        const { html } = renderCircle();

        expect(html).toContain('circle-title-content');
        expect(html).toContain('circle-title-name');
        expect(html).toContain('점화 서클');
        expect(html).toContain('circle-title-caption');
        expect(html).toContain('불꽃을 연속 발현');
    });
});
