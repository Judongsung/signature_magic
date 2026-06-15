import {
    MAGIC_NODE_HANDLE_CONFIG,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import type { MagicNode, MagicType } from '../../../types/magic';

export function createUserMagicNodeData(
    magicType: MagicType
): MagicNode['data'] {
    return {
        magicType,
        nodeKind: MAGIC_NODE_KINDS.USER,
        isRoot: true,
        isLeaf: true,
        inputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
        outputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
    };
}
