import {
    type MagicCircleNode,
    type MagicEditorNode,
    type MagicNode,
} from '../magicGraphTypes';
import {
    compareMagicCircleSequenceNodes,
    isMagicCircleNode,
} from './magicCircleGraph';

export interface MagicCircleGraphIndex {
    nodeById: ReadonlyMap<string, MagicEditorNode>;
    circles: readonly MagicCircleNode[];
    unitNodes: readonly MagicNode[];
    childrenByCircleId: ReadonlyMap<string, readonly MagicNode[]>;
}

export function createMagicCircleGraphIndex(
    nodes: readonly MagicEditorNode[]
): MagicCircleGraphIndex {
    const nodeById = new Map<string, MagicEditorNode>();
    const circles: MagicCircleNode[] = [];
    const unitNodes: MagicNode[] = [];
    const childrenByCircleId = new Map<string, MagicNode[]>();

    nodes.forEach(node => {
        nodeById.set(node.id, node);
        if (isMagicCircleNode(node)) {
            circles.push(node);
            return;
        }

        unitNodes.push(node);
        if (!node.parentId) return;

        const children = childrenByCircleId.get(node.parentId) ?? [];
        children.push(node);
        childrenByCircleId.set(node.parentId, children);
    });

    childrenByCircleId.forEach(children => {
        children.sort(compareMagicCircleSequenceNodes);
    });

    return {
        nodeById,
        circles,
        unitNodes,
        childrenByCircleId,
    };
}
