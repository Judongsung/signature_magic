import {
    GRAPH_NODE_TYPES,
    MAGIC_NODE_ID_PREFIX,
} from '../../../constants/graphConfigs';
import {
    type MagicUserNode,
} from '../magicGraphTypes';
import {
    type MagicType,
} from '../../../types/magicTypeConfig';
import type { MagicGraphEdge } from '../magicGraphTypes';
import { createUserMagicNodeData } from './magicNodeData';
import {
    createMagicGraphIdSegment,
    type MagicGraphIdFactory,
} from './magicGraphIds';

export type IdFactory = MagicGraphIdFactory;

export function createNode(
    magicType: MagicType,
    position: { x: number; y: number },
    createId: IdFactory = createMagicGraphIdSegment
): MagicUserNode {
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
