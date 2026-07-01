import {
    type MagicNode,
} from '../../../../systems/graph/magicGraphTypes';

export function openNodeDetailsFromContextMenu(
    node: MagicNode,
    event: MouseEvent,
    onOpenNodeDetails: (nodeId: string) => void
): void {
    event.preventDefault();
    onOpenNodeDetails(node.id);
}
