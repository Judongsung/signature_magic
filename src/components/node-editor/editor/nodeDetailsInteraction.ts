import type { MagicNode } from '../../../types/magic';

export function openNodeDetailsFromContextMenu(
    node: MagicNode,
    event: MouseEvent,
    onOpenNodeDetails: (nodeId: string) => void
): void {
    event.preventDefault();
    onOpenNodeDetails(node.id);
}
