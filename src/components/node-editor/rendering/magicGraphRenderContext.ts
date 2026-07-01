import { getContext, setContext } from 'svelte';
import type {
    MagicCircleState,
    MagicNode,
    MagicStatEffectConfig,
} from '../../../types/magic';
import type {
    MagicNodeSequenceDrop,
} from '../../../systems/graph/editor/magicCircleEditorInteraction';

const MAGIC_GRAPH_RENDER_CONTEXT_KEY = Symbol('magic-graph-render');
const MAGIC_GRAPH_EDITOR_ACTIONS_KEY = Symbol('magic-graph-editor-actions');
const MISSING_RENDER_CONTEXT_ERROR =
    'Magic graph renderer requires a render context.';

export interface MagicGraphRenderContext {
    getCircleChildren(circleId: string): readonly MagicNode[];
    getCircleState(circleId: string): MagicCircleState | undefined;
    readonly activeCircleId: string | undefined;
    readonly sequenceDropPreview: MagicNodeSequenceDrop | undefined;
    readonly nodeStatEffects: readonly MagicStatEffectConfig[];
}

export interface MagicGraphEditorActions {
    resizeCircle(
        circleId: string,
        size: { width: number; height: number }
    ): void;
}

export function provideMagicGraphRenderContext(
    context: MagicGraphRenderContext
): void {
    setContext(MAGIC_GRAPH_RENDER_CONTEXT_KEY, context);
}

export function useMagicGraphRenderContext(): MagicGraphRenderContext {
    const context = getContext<MagicGraphRenderContext | undefined>(
        MAGIC_GRAPH_RENDER_CONTEXT_KEY
    );
    if (!context) throw new Error(MISSING_RENDER_CONTEXT_ERROR);
    return context;
}

export function provideMagicGraphEditorActions(
    actions: MagicGraphEditorActions
): void {
    setContext(MAGIC_GRAPH_EDITOR_ACTIONS_KEY, actions);
}

export function useMagicGraphEditorActions():
    MagicGraphEditorActions | undefined {
    return getContext<MagicGraphEditorActions | undefined>(
        MAGIC_GRAPH_EDITOR_ACTIONS_KEY
    );
}
