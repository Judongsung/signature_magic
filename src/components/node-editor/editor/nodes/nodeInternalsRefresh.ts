import { tick } from 'svelte';

type UpdateNodeInternals = (
    nodeId?: string | string[]
) => void;
type NodeHandleLayoutPart = string | number | boolean | null;

export function createNodeHandleLayoutKey(
    parts: readonly NodeHandleLayoutPart[]
): string {
    return JSON.stringify(parts);
}

export function createNodeInternalsRefresh(
    getNodeId: () => string,
    updateNodeInternals: UpdateNodeInternals
): (layoutKey: string) => void {
    let appliedLayoutKey: string | undefined;
    let pendingLayoutKey: string | undefined;
    let requestRevision = 0;

    return (layoutKey: string) => {
        if (layoutKey === pendingLayoutKey) return;
        if (layoutKey === appliedLayoutKey) {
            if (pendingLayoutKey !== undefined) {
                pendingLayoutKey = undefined;
                requestRevision += 1;
            }
            return;
        }

        pendingLayoutKey = layoutKey;
        const revision = ++requestRevision;
        void tick().then(() => {
            if (revision !== requestRevision) return;

            const nextLayoutKey = pendingLayoutKey;
            pendingLayoutKey = undefined;
            if (
                nextLayoutKey === undefined ||
                nextLayoutKey === appliedLayoutKey
            ) {
                return;
            }

            appliedLayoutKey = nextLayoutKey;
            updateNodeInternals(getNodeId());
        });
    };
}
