// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MagicUnitNode from './MagicUnitNode.svelte';

const interactionMocks = vi.hoisted(() => ({
    openDetails: vi.fn<(nodeId: string) => void>(),
    updateNodeInternals: vi.fn<(nodeId?: string | string[]) => void>(),
}));

vi.mock('@xyflow/svelte', () => ({
    Handle: () => undefined,
    Position: {
        Top: 'top',
        Bottom: 'bottom',
    },
    useUpdateNodeInternals: () => interactionMocks.updateNodeInternals,
}));
vi.mock('../details/nodeDetailsContext', () => ({
    useNodeEditorDetails: () => interactionMocks.openDetails,
}));
vi.mock('../../rendering/magicGraphRenderContext', () => ({
    useMagicGraphRenderContext: () => ({
        getCircleChildren: () => [],
        getCircleState: () => undefined,
        activeCircleId: undefined,
        sequenceDropPreview: undefined,
        nodeStatEffects: [],
    }),
}));

let mountedNode: Record<string, unknown> | undefined;

beforeEach(() => {
    interactionMocks.openDetails.mockReset();
    interactionMocks.updateNodeInternals.mockReset();
});

afterEach(async () => {
    if (mountedNode) {
        await unmount(mountedNode);
        mountedNode = undefined;
    }
    document.body.replaceChildren();
});

describe('MagicUnitNode interaction', () => {
    it('opens node details from the card action', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        mountedNode = mount(MagicUnitNode, {
            target,
            props: {
                id: 'node-details-target',
                data: {
                    magicType: 'ignition',
                    nodeKind: 'user',
                    sequenceIndex: 0,
                },
                parentId: 'circle-1',
                draggable: true,
            },
        });

        const detailsButton = target.querySelector<HTMLButtonElement>(
            '.node-details-trigger'
        );
        detailsButton?.click();
        await tick();

        expect(interactionMocks.openDetails).toHaveBeenCalledOnce();
        expect(interactionMocks.openDetails).toHaveBeenCalledWith(
            'node-details-target'
        );
    });

    it('does not expose details from a pair end marker', () => {
        const target = document.createElement('div');
        document.body.append(target);
        mountedNode = mount(MagicUnitNode, {
            target,
            props: {
                id: 'repeat-end',
                data: {
                    magicType: 'repeat',
                    nodeKind: 'user',
                    sequenceIndex: 1,
                    controlPair: {
                        id: 'repeat-pair',
                        role: 'end',
                    },
                },
                parentId: 'circle-1',
                draggable: true,
            },
        });

        expect(target.querySelector('.node-details-trigger')).toBeNull();
        expect(target.querySelector('.description-tooltip')).toBeNull();
    });

    it('opens details for a circle-owned manifestation node', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        mountedNode = mount(MagicUnitNode, {
            target,
            props: {
                id: 'circle-1-manifestation',
                data: {
                    magicType: 'manifestation',
                    nodeKind: 'system',
                    showTooltip: true,
                    sequenceIndex: 0,
                },
                parentId: 'circle-1',
                draggable: true,
            },
        });

        target.querySelector<HTMLButtonElement>(
            '.node-details-trigger'
        )?.click();
        await tick();

        expect(interactionMocks.openDetails).toHaveBeenCalledWith(
            'circle-1-manifestation'
        );
        expect(target.querySelector('.description-tooltip')).not.toBeNull();
    });
});
