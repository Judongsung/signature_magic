<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { SvelteFlowProvider } from '@xyflow/svelte';
    import magicGraphPresetsData from '../../data/magicGraphPresets.json';
    import { NODE_EDITOR_TEXT } from '../../constants/uiText';
    import { MAGIC_CIRCLE_ANIMATION_MODES } from '../../constants/magicCircleConfigs';
    import { graphStore } from '../../stores/graphStore.svelte';
    import {
        createMagicGraphPresetOption,
        createMagicGraphPresetOptionValue,
        MAGIC_GRAPH_PRESET_SOURCES,
    } from '../../systems/graph/presets/magicGraphPresets';
    import {
        deleteStoredMagicGraphPreset,
        loadStoredMagicGraphPresets,
        saveStoredMagicGraphPreset,
    } from '../../systems/graph/presets/magicGraphPresetStorage';
    import type { MagicGraphPresetConfig } from '../../types/magic';
    import DevPhaseNavigation from '../dev/DevPhaseNavigation.svelte';
    import MagicCircleGenerator from './MagicCircleGenerator.svelte';
    import MagicNodeEditor from './MagicNodeEditor.svelte';
    import MagicNodePresetDialog from './MagicNodePresetDialog.svelte';

    const DEFAULT_EDITOR_PANE_PERCENT = 50;
    const MIN_EDITOR_PANE_PERCENT = 30;
    const MAX_EDITOR_PANE_PERCENT = 75;
    const PANE_RESIZER_KEY_STEP_PERCENT = 5;
    const COMPACT_LAYOUT_MEDIA_QUERY = '(max-width: 900px)';
    const PRIMARY_POINTER_BUTTON = 0;
    const builtInPresets = magicGraphPresetsData as MagicGraphPresetConfig[];
    const initialPresetValue = builtInPresets[0]
        ? createMagicGraphPresetOptionValue(MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN, builtInPresets[0].id)
        : '';

    let appContainerElement: HTMLDivElement | undefined;
    let editorPanePercent = $state(DEFAULT_EDITOR_PANE_PERCENT);
    let isResizing = $state(false);
    let isCompactLayout = $state(false);
    let userPresets = $state<MagicGraphPresetConfig[]>(loadStoredMagicGraphPresets());
    let selectedPresetValue = $state(initialPresetValue);
    let isPresetDialogOpen = $state(false);

    const editorPaneSize = $derived(`${editorPanePercent}%`);
    const resizerOrientation = $derived(isCompactLayout ? 'horizontal' : 'vertical');
    const presetOptions = $derived([
        ...builtInPresets.map(preset =>
            createMagicGraphPresetOption(preset, MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN)
        ),
        ...userPresets.map(preset =>
            createMagicGraphPresetOption(preset, MAGIC_GRAPH_PRESET_SOURCES.USER)
        ),
    ]);
    const selectedPresetOption = $derived(
        presetOptions.find(option => option.value === selectedPresetValue)
    );
    const selectedPresetIsUser = $derived(
        selectedPresetOption?.source === MAGIC_GRAPH_PRESET_SOURCES.USER
    );
    const resizerTabIndex = $derived(isPresetDialogOpen ? -1 : 0);

    function clampPanePercent(value: number): number {
        return Math.min(MAX_EDITOR_PANE_PERCENT, Math.max(MIN_EDITOR_PANE_PERCENT, value));
    }

    function updatePanePercentFromPointer(event: PointerEvent) {
        const containerRect = appContainerElement?.getBoundingClientRect();
        if (!containerRect) return;

        const pointerOffset = isCompactLayout
            ? event.clientY - containerRect.top
            : event.clientX - containerRect.left;
        const containerSize = isCompactLayout ? containerRect.height : containerRect.width;
        if (containerSize <= 0) return;

        editorPanePercent = clampPanePercent((pointerOffset / containerSize) * 100);
    }

    function stopPaneResize() {
        if (!isResizing) return;

        isResizing = false;
        window.removeEventListener('pointermove', updatePanePercentFromPointer);
        window.removeEventListener('pointerup', stopPaneResize);
        window.removeEventListener('pointercancel', stopPaneResize);
    }

    function startPaneResize(event: PointerEvent) {
        if (isPresetDialogOpen) return;
        if (event.button !== PRIMARY_POINTER_BUTTON) return;

        event.preventDefault();
        isResizing = true;
        updatePanePercentFromPointer(event);
        window.addEventListener('pointermove', updatePanePercentFromPointer);
        window.addEventListener('pointerup', stopPaneResize);
        window.addEventListener('pointercancel', stopPaneResize);
    }

    function handlePaneResizeKeydown(event: KeyboardEvent) {
        if (isPresetDialogOpen) return;

        const keyActions: Record<string, () => void> = {
            ArrowLeft: () => editorPanePercent = clampPanePercent(editorPanePercent - PANE_RESIZER_KEY_STEP_PERCENT),
            ArrowUp: () => editorPanePercent = clampPanePercent(editorPanePercent - PANE_RESIZER_KEY_STEP_PERCENT),
            ArrowRight: () => editorPanePercent = clampPanePercent(editorPanePercent + PANE_RESIZER_KEY_STEP_PERCENT),
            ArrowDown: () => editorPanePercent = clampPanePercent(editorPanePercent + PANE_RESIZER_KEY_STEP_PERCENT),
            Home: () => editorPanePercent = MIN_EDITOR_PANE_PERCENT,
            End: () => editorPanePercent = MAX_EDITOR_PANE_PERCENT,
            Enter: () => editorPanePercent = DEFAULT_EDITOR_PANE_PERCENT,
        };
        const action = keyActions[event.key];
        if (!action) return;

        event.preventDefault();
        action();
    }

    function openPresetDialog() {
        stopPaneResize();
        isPresetDialogOpen = true;
    }

    function selectPreset(value: string) {
        selectedPresetValue = value;
    }

    function loadSelectedPreset(): boolean {
        if (!selectedPresetOption) return false;

        graphStore.loadPreset(selectedPresetOption.preset);
        return true;
    }

    function saveCurrentPreset(label: string) {
        if (!graphStore.hasUserContent) return;
        if (!label?.trim()) return;

        const preset = graphStore.createPresetSnapshot(label);
        if (!preset) return;

        userPresets = saveStoredMagicGraphPreset(preset);
        selectedPresetValue = createMagicGraphPresetOptionValue(MAGIC_GRAPH_PRESET_SOURCES.USER, preset.id);
    }

    function deleteSelectedPreset() {
        if (!selectedPresetOption || !selectedPresetIsUser) return;

        userPresets = deleteStoredMagicGraphPreset(selectedPresetOption.preset.id);
        selectedPresetValue = initialPresetValue;
    }

    onMount(() => {
        const mediaQuery = window.matchMedia(COMPACT_LAYOUT_MEDIA_QUERY);

        function syncCompactLayout(event: MediaQueryList | MediaQueryListEvent) {
            isCompactLayout = event.matches;
        }

        syncCompactLayout(mediaQuery);
        mediaQuery.addEventListener('change', syncCompactLayout);

        return () => mediaQuery.removeEventListener('change', syncCompactLayout);
    });

    onDestroy(stopPaneResize);
</script>

<main class="node-composition-screen">
    <DevPhaseNavigation />

    <div
        bind:this={appContainerElement}
        class="app-container"
        class:is-resizing={isResizing}
        class:preset-dialog-open={isPresetDialogOpen}
        style:--editor-pane-size={editorPaneSize}
    >
        <div class="editor-pane">
            <SvelteFlowProvider>
                <MagicNodeEditor onOpenPresetDialog={openPresetDialog} />
            </SvelteFlowProvider>
        </div>
        <div
            class="pane-resizer"
            role="slider"
            aria-disabled={isPresetDialogOpen}
            aria-label={NODE_EDITOR_TEXT.PANE_RESIZER_ARIA_LABEL}
            aria-orientation={resizerOrientation}
            aria-valuemin={MIN_EDITOR_PANE_PERCENT}
            aria-valuemax={MAX_EDITOR_PANE_PERCENT}
            aria-valuenow={Math.round(editorPanePercent)}
            tabindex={resizerTabIndex}
            onpointerdown={startPaneResize}
            onkeydown={handlePaneResizeKeydown}
        >
            <span class="resizer-line"></span>
        </div>
        <div class="preview-pane">
            <MagicCircleGenerator animationMode={MAGIC_CIRCLE_ANIMATION_MODES.STATIC} />
        </div>
    </div>

    {#if isPresetDialogOpen}
        <MagicNodePresetDialog
            {presetOptions}
            {selectedPresetValue}
            canLoadPreset={Boolean(selectedPresetOption)}
            canSavePreset={graphStore.hasUserContent}
            canDeletePreset={selectedPresetIsUser}
            onSelectPreset={selectPreset}
            onLoadPreset={loadSelectedPreset}
            onSavePreset={saveCurrentPreset}
            onDeletePreset={deleteSelectedPreset}
            onClose={() => isPresetDialogOpen = false}
        />
    {/if}
</main>

<style>
    .node-composition-screen {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-bottom: 68px;
        overflow: hidden;
        background: var(--node-editor-screen-bg);
        box-sizing: border-box;
    }

    .node-composition-screen :global(.dev-phase-navigation) {
        width: 100%;
        max-width: none;
        padding: 8px 12px;
        background: var(--node-editor-panel-bg);
        border-bottom: 1px solid var(--node-editor-border);
        box-shadow: var(--node-editor-toolbar-shadow);
    }
    
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

    .app-container.preset-dialog-open .pane-resizer {
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
