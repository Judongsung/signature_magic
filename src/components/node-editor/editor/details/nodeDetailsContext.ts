import { getContext, setContext } from 'svelte';

export type OpenNodeEditorDetails = (
    nodeId: string
) => void;

const NODE_DETAILS_CONTEXT_KEY = Symbol('node-editor-details');

export function provideNodeEditorDetails(
    openDetails: OpenNodeEditorDetails
): void {
    setContext(NODE_DETAILS_CONTEXT_KEY, openDetails);
}

export function useNodeEditorDetails(): OpenNodeEditorDetails | undefined {
    return getContext<OpenNodeEditorDetails | undefined>(
        NODE_DETAILS_CONTEXT_KEY
    );
}
