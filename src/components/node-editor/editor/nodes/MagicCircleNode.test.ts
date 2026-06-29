import { render } from 'svelte/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAGIC_CIRCLE_NODE_CONFIG } from '../../../../constants/graphConfigs';
import { graphStore } from '../../../../stores/graphStore.svelte';
import {
    getCircleChildNodes,
    getMagicCircleNodes,
} from '../../../../systems/graph/model/magicCircleGraph';
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
vi.mock('../details/nodeDetailsContext', () => ({
    useNodeEditorDetails: () => undefined,
}));

afterEach(() => {
    graphStore.clear();
});

function renderCircle(selected = false, draggable = true) {
    const circle = getMagicCircleNodes(graphStore.nodes)[0];
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
        expect(html).toContain('INPUT');
        expect(html).toContain('OUTPUT');
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
        graphStore.edges = [
            {
                id: 'stale-internal',
                source: first.id,
                target: second.id,
                sourceHandle: 'output-0',
                targetHandle: 'input-0',
            },
        ];

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
        graphStore.setSequenceDropPreview({ circleId: circle.id, y: 120 });

        expect(renderCircle().html).toContain('sequence-insertion-indicator');
    });

    it('renders presentation-only repeat and branch connectors', () => {
        graphStore.addNode('repeat');
        graphStore.addNode('branch');

        const { html } = renderCircle();

        expect(html).toContain('control-pair-overlay');
        expect(html).toContain('repeat-connector');
        expect(html).toContain('branch-connector');
        expect(graphStore.edges).toEqual([]);
    });

    it('renders an upward branch connector when the target is above the condition marker', () => {
        graphStore.addNode('branch');
        const circle = getMagicCircleNodes(graphStore.nodes)[0];
        const branchEnd = getCircleChildNodes(graphStore.nodes, circle.id)
            .find(node => node.data.controlPair?.role === 'end')!;

        expect(graphStore.moveNodeGroup([{
            nodeId: branchEnd.id,
            circleId: circle.id,
            sequenceIndex: branchEnd.data.sequenceIndex ?? 0,
        }], circle.id, 0)).toBe(true);

        const { html } = renderCircle();

        expect(html).toContain('branch-connector');
        expect(html).toContain('V 100');
    });

    it('keeps control-pair connectors in the read-only renderer', () => {
        graphStore.addNode('repeat');

        const { html } = renderCircle(false, false);

        expect(html).toContain('read-only');
        expect(html).toContain('repeat-connector');
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
