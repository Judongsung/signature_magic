// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CustomNode from './CustomNode.svelte';

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
vi.mock('./nodeDetailsContext', () => ({
    useNodeEditorDetails: () => interactionMocks.openDetails,
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

describe('CustomNode interaction', () => {
    it('opens node details from the card action', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        mountedNode = mount(CustomNode, {
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
                isConnectable: false,
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
});
