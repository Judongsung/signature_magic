import { describe, expect, it, vi } from 'vitest';
import type { MagicNode } from '../../../../types/magic';
import { openNodeDetailsFromContextMenu } from './nodeDetailsInteraction';

const node: MagicNode = {
    id: 'node-custom',
    type: 'magicNode',
    position: { x: 0, y: 0 },
    data: { magicType: 'custom' },
};

describe('nodeDetailsInteraction', () => {
    it('prevents the browser menu and opens details for the target node', () => {
        const preventDefault = vi.fn();
        const onOpenNodeDetails = vi.fn();

        openNodeDetailsFromContextMenu(
            node,
            { preventDefault } as unknown as MouseEvent,
            onOpenNodeDetails
        );

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(onOpenNodeDetails).toHaveBeenCalledWith(node.id);
    });
});
