// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { graphStore } from '../../../../stores/graphStore.svelte';
import { resetGraphStoreFixture } from '../../../../test-utils/graphFixtures';
import { getMagicCircleNodes } from '../../../../systems/graph/model/magicCircleGraph';
import MagicCircleNode from './MagicCircleNode.svelte';

const xyflowMocks = vi.hoisted(() => ({
    updateNodeInternals: vi.fn<(nodeId?: string | string[]) => void>(),
    resizeEnd: undefined as ((
        event: unknown,
        size: { width: number; height: number }
    ) => void) | undefined,
}));
const detailsMocks = vi.hoisted(() => ({
    openDetails: vi.fn<(nodeId: string) => void>(),
    resizeCircle: vi.fn<(
        circleId: string,
        size: { width: number; height: number }
    ) => void>(),
}));

vi.mock('@xyflow/svelte', () => ({
    Handle: () => undefined,
    NodeResizer: (_anchor: unknown, props: {
        onResizeEnd?: (
            event: unknown,
            size: { width: number; height: number }
        ) => void;
    }) => {
        xyflowMocks.resizeEnd = props.onResizeEnd;
        return undefined;
    },
    Position: {
        Top: 'top',
        Bottom: 'bottom',
    },
    useUpdateNodeInternals: () => xyflowMocks.updateNodeInternals,
}));
vi.mock('../details/nodeDetailsContext', () => ({
    useNodeEditorDetails: () => detailsMocks.openDetails,
}));
vi.mock('../../rendering/magicGraphRenderContext', () => ({
    resolveMagicCircleRenderTitle: (
        circle: { data: { name?: string } },
        state: { displayOrder: number } | undefined
    ) => circle.data.name || `서클 ${state?.displayOrder ?? '—'}`,
    useMagicGraphRenderContext: () => ({
        getCircleChildren: () => [],
        getCircleState: () => undefined,
        activeCircleId: undefined,
        sequenceDropPreview: undefined,
        nodeStatEffects: [],
    }),
    useMagicGraphEditorActions: () => ({
        resizeCircle: detailsMocks.resizeCircle,
    }),
}));

const mountedCircles: Record<string, unknown>[] = [];

async function flushInternalsRefresh(): Promise<void> {
    await tick();
    await Promise.resolve();
    await tick();
}

beforeEach(() => {
    resetGraphStoreFixture();
    xyflowMocks.updateNodeInternals.mockReset();
    xyflowMocks.resizeEnd = undefined;
    detailsMocks.openDetails.mockReset();
    detailsMocks.resizeCircle.mockReset();
});

afterEach(async () => {
    await Promise.all(mountedCircles.splice(0).map(component => unmount(component)));
    document.body.replaceChildren();
    resetGraphStoreFixture();
});

describe('MagicCircleNode interaction', () => {
    it('lets the empty circle surface fall through to pane selection', () => {
        const [circle] = getMagicCircleNodes(graphStore.nodes);
        const target = document.createElement('div');
        document.body.append(target);
        mountedCircles.push(mount(MagicCircleNode, {
            target,
            props: {
                id: circle.id,
                data: circle.data,
                width: circle.width,
                height: circle.height,
            },
        }));

        const circleSurface = target.querySelector<HTMLElement>(
            '.magic-circle-node'
        );

        expect(getComputedStyle(circleSurface!).pointerEvents).toBe('none');
        expect(getComputedStyle(circleSurface!).cursor).toBe('default');
    });

    it('opens the circle details from the title bar action', async () => {
        const [circle] = getMagicCircleNodes(graphStore.nodes);
        const target = document.createElement('div');
        document.body.append(target);
        mountedCircles.push(mount(MagicCircleNode, {
            target,
            props: {
                id: circle.id,
                data: circle.data,
                width: circle.width,
                height: circle.height,
            },
        }));

        const detailsButton = target.querySelector<HTMLButtonElement>(
            '.circle-details-trigger'
        );
        detailsButton?.click();
        await tick();

        expect(detailsMocks.openDetails).toHaveBeenCalledOnce();
        expect(detailsMocks.openDetails).toHaveBeenCalledWith(circle.id);
    });

    it('opens circle details by right-clicking the title bar', async () => {
        const [circle] = getMagicCircleNodes(graphStore.nodes);
        const target = document.createElement('div');
        document.body.append(target);
        mountedCircles.push(mount(MagicCircleNode, {
            target,
            props: {
                id: circle.id,
                data: circle.data,
                width: circle.width,
                height: circle.height,
            },
        }));
        const contextMenuEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
        });

        target.querySelector<HTMLElement>('.circle-title')
            ?.dispatchEvent(contextMenuEvent);
        await tick();

        expect(contextMenuEvent.defaultPrevented).toBe(true);
        expect(detailsMocks.openDetails).toHaveBeenCalledWith(circle.id);
    });

    it('routes resize completion through the editor action context', () => {
        const [circle] = getMagicCircleNodes(graphStore.nodes);
        const target = document.createElement('div');
        document.body.append(target);
        mountedCircles.push(mount(MagicCircleNode, {
            target,
            props: {
                id: circle.id,
                data: circle.data,
                width: circle.width,
                height: circle.height,
                selected: true,
            },
        }));

        xyflowMocks.resizeEnd?.(
            {},
            { width: 640, height: 680 }
        );

        expect(detailsMocks.resizeCircle).toHaveBeenCalledWith(
            circle.id,
            { width: 640, height: 680 }
        );
    });

    it('does not create a feedback loop when two circles write measured nodes back to the store', async () => {
        graphStore.addCircle({ x: 520, y: -320 });
        const circles = getMagicCircleNodes(graphStore.nodes);
        xyflowMocks.updateNodeInternals.mockImplementation(() => {
            graphStore.acceptFlowNodes([...graphStore.nodes]);
        });

        circles.forEach(circle => {
            const target = document.createElement('div');
            document.body.append(target);
            mountedCircles.push(mount(MagicCircleNode, {
                target,
                props: {
                    id: circle.id,
                    data: circle.data,
                    width: circle.width,
                    height: circle.height,
                },
            }));
        });
        await flushInternalsRefresh();
        await flushInternalsRefresh();

        expect(xyflowMocks.updateNodeInternals).toHaveBeenCalledTimes(2);
        expect(new Set(
            xyflowMocks.updateNodeInternals.mock.calls.map(([nodeId]) => nodeId)
        )).toEqual(new Set(circles.map(circle => circle.id)));
    });
});
