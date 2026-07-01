import {
    GRAPH_NODE_TYPES,
    MAGIC_NODE_ID_PREFIX,
} from '../../../constants/graphConfigs';
import type { MagicNode, MagicType } from '../../../types/magic';
import type { MagicGraphEdge } from '../magicGraphTypes';
import { createUserMagicNodeData } from './magicNodeData';

export type IdFactory = () => string;

export function createUniqueId(): string {
    return crypto.randomUUID();
}

export function createNode(
    magicType: MagicType,
    position: { x: number; y: number },
    createId: IdFactory = createUniqueId
): MagicNode {
    return {
        id: `${MAGIC_NODE_ID_PREFIX}-${createId()}`,
        type: GRAPH_NODE_TYPES.MAGIC_NODE,
        position,
        data: createUserMagicNodeData(magicType),
    };
}

export function filterEdgesForDeletedNodes(
    deletedIds: Set<string>,
    edges: MagicGraphEdge[]
): MagicGraphEdge[] {
    return edges.filter(e => !deletedIds.has(e.source) && !deletedIds.has(e.target));
}
