import type {
    MagicNodeSettings,
    MagicType,
} from '../../types/magicTypeConfig';

export type MagicNodeKind = 'user' | 'system';
export type MagicEditorNodeKind = MagicNodeKind | 'circle';
export type MagicCircleStatus = 'empty' | 'valid';
export type MagicCirclePortDirection = 'input' | 'output';
export type MagicControlPairRole = 'start' | 'end';

export interface MagicControlPairRef {
    id: string;
    role: MagicControlPairRole;
}

export interface MagicCircleConnectionJoinRef {
    edgeId: string;
    sourceCircleId: string;
}

interface MagicNodeDataBase extends Record<string, unknown> {
    magicType: MagicType;
    settings?: MagicNodeSettings;
    showTooltip?: boolean;
    excludeFromStatScaling?: boolean;
    sequenceIndex?: number;
}

export interface MagicUserNodeData extends MagicNodeDataBase {
    nodeKind: 'user';
    controlPair?: MagicControlPairRef;
}

export interface MagicCircleSystemNodeData extends MagicNodeDataBase {
    nodeKind: 'system';
    controlPair?: never;
    connectionJoin?: MagicCircleConnectionJoinRef;
}

export type MagicNodeData =
    | MagicUserNodeData
    | MagicCircleSystemNodeData;

export interface MagicGraphNode<Data extends Record<string, unknown>> {
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: Data;
    parentId?: string;
    width?: number;
    height?: number;
    dragHandle?: string;
    draggable?: boolean;
    selectable?: boolean;
    connectable?: boolean;
    deletable?: boolean;
    extent?: 'parent' | [[number, number], [number, number]] | null;
    style?: string;
    selected?: boolean;
    dragging?: boolean;
    measured?: {
        width?: number;
        height?: number;
    };
    zIndex?: number;
}

export type MagicUserNode = MagicGraphNode<MagicUserNodeData>;
export type MagicCircleSystemNode =
    MagicGraphNode<MagicCircleSystemNodeData>;
export type MagicNode = MagicUserNode | MagicCircleSystemNode;

export interface MagicCircleMetadata {
    name?: string;
    caption?: string;
}

export interface MagicCircleNodeData
    extends MagicCircleMetadata, Record<string, unknown> {
    nodeKind: Extract<MagicEditorNodeKind, 'circle'>;
    inputHandleCount: number;
    outputHandleCount: number;
}

export type MagicCircleNode = MagicGraphNode<MagicCircleNodeData> & {
    type: 'magicCircle';
    width: number;
    height: number;
};

export type MagicEditorNode = MagicNode | MagicCircleNode;

export interface MagicGraphEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type?: string;
    selected?: boolean;
}

export interface MagicGraphConnection {
    source: string;
    target: string;
    sourceHandle: string | null;
    targetHandle: string | null;
}
