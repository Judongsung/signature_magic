<script lang="ts">
    import { onDestroy, onMount, type Snippet } from 'svelte';
    import { NODE_EDITOR_TEXT } from '../../constants/uiText';
    import {
        NODE_COMPOSITION_PANE_RESIZE_CONFIG,
        resolvePanePercentFromKey,
        resolvePanePercentFromPointer,
    } from '../../systems/graph/editor/paneResize';

    let {
        interactionBlocked = false,
        editor,
        preview,
    }: {
        interactionBlocked?: boolean;
        editor: Snippet;
        preview: Snippet;
    } = $props();

    let containerElement = $state<HTMLDivElement | undefined>();
    let editorPanePercent = $state<number>(NODE_COMPOSITION_PANE_RESIZE_CONFIG.DEFAULT_PERCENT);
    let isResizing = $state(false);
    let isCompactLayout = $state(false);

    const editorPaneSize = $derived(`${editorPanePercent}%`);
    const resizerOrientation = $derived(isCompactLayout ? 'horizontal' : 'vertical');
    const resizerTabIndex = $derived(interactionBlocked ? -1 : 0);

    function updatePanePercentFromPointer(event: PointerEvent) {
        const containerRect = containerElement?.getBoundingClientRect();
        if (!containerRect) return;

        const nextPanePercent = resolvePanePercentFromPointer(
            event,
            containerRect,
            isCompactLayout
        );
        if (nextPanePercent === undefined) return;

        editorPanePercent = nextPanePercent;
    }

    function stopPaneResize() {
        if (!isResizing) return;

        isResizing = false;
        window.removeEventListener('pointermove', updatePanePercentFromPointer);
        window.removeEventListener('pointerup', stopPaneResize);
        window.removeEventListener('pointercancel', stopPaneResize);
    }

    function startPaneResize(event: PointerEvent) {
        if (interactionBlocked) return;
        if (event.button !== NODE_COMPOSITION_PANE_RESIZE_CONFIG.PRIMARY_POINTER_BUTTON) return;

        event.preventDefault();
        isResizing = true;
        updatePanePercentFromPointer(event);
        window.addEventListener('pointermove', updatePanePercentFromPointer);
        window.addEventListener('pointerup', stopPaneResize);
        window.addEventListener('pointercancel', stopPaneResize);
    }

    function handlePaneResizeKeydown(event: KeyboardEvent) {
        if (interactionBlocked) return;

        const nextPanePercent = resolvePanePercentFromKey(editorPanePercent, event.key);
        if (nextPanePercent === undefined) return;

        event.preventDefault();
        editorPanePercent = nextPanePercent;
    }

    $effect(() => {
        if (interactionBlocked) {
            stopPaneResize();
        }
    });

    onMount(() => {
        if (typeof window.matchMedia !== 'function') return;

        const mediaQuery = window.matchMedia(
            NODE_COMPOSITION_PANE_RESIZE_CONFIG.COMPACT_LAYOUT_MEDIA_QUERY
        );

        function syncCompactLayout(event: MediaQueryList | MediaQueryListEvent) {
            isCompactLayout = event.matches;
        }

        syncCompactLayout(mediaQuery);
        mediaQuery.addEventListener('change', syncCompactLayout);

        return () => mediaQuery.removeEventListener('change', syncCompactLayout);
    });

    onDestroy(stopPaneResize);
</script>

<div
    bind:this={containerElement}
    class="app-container"
    class:is-resizing={isResizing}
    class:dialog-open={interactionBlocked}
    style:--editor-pane-size={editorPaneSize}
>
    <div class="editor-pane">
        {@render editor()}
    </div>
    <div
        class="pane-resizer"
        role="slider"
        aria-disabled={interactionBlocked}
        aria-label={NODE_EDITOR_TEXT.PANE_RESIZER_ARIA_LABEL}
        aria-orientation={resizerOrientation}
        aria-valuemin={NODE_COMPOSITION_PANE_RESIZE_CONFIG.MIN_PERCENT}
        aria-valuemax={NODE_COMPOSITION_PANE_RESIZE_CONFIG.MAX_PERCENT}
        aria-valuenow={Math.round(editorPanePercent)}
        tabindex={resizerTabIndex}
        onpointerdown={startPaneResize}
        onkeydown={handlePaneResizeKeydown}
    >
        <span class="resizer-line"></span>
    </div>
    <div class="preview-pane">
        {@render preview()}
    </div>
</div>

<style>
    .app-container {
        --editor-pane-size: 50%;
        display: flex;
        width: 100%;
        flex: 1;
        min-height: 0;
        overflow: hidden;
    }

    .editor-pane {
        flex: 0 0 var(--editor-pane-size);
        min-width: 0;
        box-shadow: var(--node-editor-panel-shadow);
        z-index: 2;
    }

    .pane-resizer {
        position: relative;
        flex: 0 0 var(--node-editor-pane-resizer-size);
        border: 0;
        padding: 0;
        background: transparent;
        cursor: col-resize;
        touch-action: none;
        z-index: 4;
    }

    .app-container.dialog-open .pane-resizer {
        pointer-events: none;
    }

    .pane-resizer::before {
        content: '';
        position: absolute;
        inset: 0 -4px;
    }

    .resizer-line {
        position: absolute;
        inset: 0 auto;
        left: 50%;
        width: 1px;
        transform: translateX(-50%);
        background:
            linear-gradient(
                180deg,
                transparent,
                var(--node-editor-pane-resizer-line),
                var(--node-editor-divider-glow),
                var(--node-editor-pane-resizer-line),
                transparent
            );
        box-shadow: 0 0 14px rgba(110, 214, 209, 0.12);
        transition:
            background var(--node-editor-transition-fast),
            box-shadow var(--node-editor-transition-fast),
            width var(--node-editor-transition-fast);
    }

    .pane-resizer:hover .resizer-line,
    .pane-resizer:focus-visible .resizer-line,
    .app-container.is-resizing .resizer-line {
        width: 2px;
        background: var(--node-editor-pane-resizer-line-active);
        box-shadow: 0 0 18px rgba(110, 214, 209, 0.34);
    }

    .pane-resizer:focus-visible {
        outline: none;
        box-shadow: var(--node-editor-pane-resizer-focus-shadow);
        background: var(--node-editor-pane-resizer-bg-active);
    }

    .preview-pane {
        flex: 1 1 0;
        min-width: 0;
        background: var(--node-editor-panel-bg);
        min-height: 0;
    }

    @media (max-width: 900px) {
        .app-container {
            flex-direction: column;
        }

        .editor-pane {
            min-width: 100%;
            min-height: 0;
            flex-basis: var(--editor-pane-size);
        }

        .pane-resizer {
            flex-basis: var(--node-editor-pane-resizer-size);
            cursor: row-resize;
        }

        .pane-resizer::before {
            inset: -4px 0;
        }

        .resizer-line {
            inset: auto 0;
            top: 50%;
            width: auto;
            height: 1px;
            transform: translateY(-50%);
            background:
                linear-gradient(
                    90deg,
                    transparent,
                    var(--node-editor-pane-resizer-line),
                    var(--node-editor-divider-glow),
                    var(--node-editor-pane-resizer-line),
                    transparent
                );
        }

        .pane-resizer:hover .resizer-line,
        .pane-resizer:focus-visible .resizer-line,
        .app-container.is-resizing .resizer-line {
            width: auto;
            height: 2px;
        }
    }
</style>
