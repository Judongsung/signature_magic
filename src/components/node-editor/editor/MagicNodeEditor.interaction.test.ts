// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { graphStore } from '../../../stores/graphStore.svelte';
import { resetGraphStoreFixture } from '../../../test-utils/graphFixtures';
import { getMagicCircleNodes } from '../../../systems/graph/model/magicCircleGraph';
import MagicNodeEditor from './MagicNodeEditor.svelte';

const flowMocks = vi.hoisted(() => ({
    props: undefined as Record<string, unknown> | undefined,
    setViewport: vi.fn(),
}));

vi.mock('@xyflow/svelte', () => ({
    SvelteFlow: (_anchor: unknown, props: Record<string, unknown>) => {
        flowMocks.props = props;
    },
    Controls: () => undefined,
    ViewportPortal: () => undefined,
    ConnectionMode: { Strict: 'strict' },
    SelectionMode: { Partial: 'partial' },
    useSvelteFlow: () => ({
        screenToFlowPosition: (point: { x: number; y: number }) => point,
        setViewport: flowMocks.setViewport,
    }),
}));

let mountedEditor: Record<string, unknown> | undefined;

beforeEach(() => {
    resetGraphStoreFixture();
    flowMocks.props = undefined;
    flowMocks.setViewport.mockReset();
});

afterEach(async () => {
    if (mountedEditor) {
        await unmount(mountedEditor);
        mountedEditor = undefined;
    }
    document.body.replaceChildren();
    resetGraphStoreFixture();
});

describe('MagicNodeEditor interaction', () => {
    it('commits blank-circle pane selection after the flow deselect pass', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        mountedEditor = mount(MagicNodeEditor, {
            target,
            props: {
                onOpenPresetDialog: vi.fn(),
                onOpenNodeDetails: vi.fn(),
                onConfirmCircleDelete: vi.fn(async () => true),
            },
        });
        await tick();

        const circle = getMagicCircleNodes(graphStore.nodes)[0];
        const onPaneClick = flowMocks.props?.onpaneclick as
            | ((payload: { event: MouseEvent }) => Promise<void>)
            | undefined;
        expect(onPaneClick).toBeTypeOf('function');

        const selection = onPaneClick!({
            event: new MouseEvent('click', {
                clientX: 0,
                clientY: 0,
            }),
        });
        graphStore.nodes = graphStore.nodes.map(node => ({
            ...node,
            selected: false,
        }));
        await selection;
        await tick();

        expect(getMagicCircleNodes(graphStore.nodes)[0].selected).toBe(true);
        expect(graphStore.activeCircleId).toBe(circle.id);
    });

    it('delegates circle deletion confirmation to the custom dialog flow', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        const onConfirmCircleDelete = vi.fn(async () => false);
        mountedEditor = mount(MagicNodeEditor, {
            target,
            props: {
                onOpenPresetDialog: vi.fn(),
                onOpenNodeDetails: vi.fn(),
                onConfirmCircleDelete,
            },
        });
        await tick();

        const onBeforeDelete = flowMocks.props?.onbeforedelete as
            | ((payload: {
                nodes: ReturnType<typeof getMagicCircleNodes>;
                edges: [];
            }) => Promise<boolean>)
            | undefined;
        const allowed = await onBeforeDelete!({
            nodes: getMagicCircleNodes(graphStore.nodes),
            edges: [],
        });

        expect(allowed).toBe(false);
        expect(onConfirmCircleDelete).toHaveBeenCalledOnce();
    });
});
