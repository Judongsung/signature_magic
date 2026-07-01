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
