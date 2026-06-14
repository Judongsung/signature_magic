<script lang="ts">
    import {
        MAGIC_NODE_CATEGORIES,
        type MagicNodeCategory,
    } from '../../constants/gameConfigs';
    import {
        MAGIC_NODE_CATEGORY_LABELS,
        NODE_EDITOR_TEXT,
    } from '../../constants/uiText';
    import type { MagicType, MagicTypeConfig } from '../../types/magic';
    import DescriptionTooltip from '../shared/DescriptionTooltip.svelte';

    let {
        activeCategoryIds,
        visibleMagicTypes,
        onToggleCategory,
        onAddNode,
        onDragStart,
        onClear,
        onOpenPresetDialog,
    }: {
        activeCategoryIds: MagicNodeCategory[];
        visibleMagicTypes: MagicTypeConfig[];
        onToggleCategory: (categoryId: MagicNodeCategory) => void;
        onAddNode: (magicType: MagicType) => void;
        onDragStart: (event: DragEvent, magicType: MagicType) => void;
        onClear: () => void;
        onOpenPresetDialog: () => void;
    } = $props();
</script>

<div class="toolbar">
    <span class="toolbar-label">{NODE_EDITOR_TEXT.TOOLBAR_LABEL}</span>
    <div class="category-tabs" aria-label={NODE_EDITOR_TEXT.CATEGORY_ARIA_LABEL}>
        {#each MAGIC_NODE_CATEGORIES as categoryId}
            {@const isActive = activeCategoryIds.includes(categoryId)}
            <button
                type="button"
                class="category-tab"
                class:active={isActive}
                aria-pressed={isActive}
                onclick={() => onToggleCategory(categoryId)}
            >
                {MAGIC_NODE_CATEGORY_LABELS[categoryId]}
            </button>
        {/each}
    </div>

    <div class="toolbar-divider"></div>

    {#each visibleMagicTypes as { type, label, icon, description }}
        <button
            class="drag-btn tooltip-host"
            type="button"
            draggable="true"
            aria-describedby={`magic-node-tooltip-${type}`}
            onclick={() => onAddNode(type)}
            ondragstart={(event) => onDragStart(event, type)}
        >
            <span>{icon} {label}</span>
            <DescriptionTooltip
                id={`magic-node-tooltip-${type}`}
                {description}
                placement="bottom"
            />
        </button>
    {/each}
    {#if visibleMagicTypes.length === 0}
        <span class="toolbar-empty">{NODE_EDITOR_TEXT.EMPTY_CATEGORY}</span>
    {/if}

    <div class="toolbar-divider"></div>

    <button class="action-btn preset-btn" type="button" onclick={onOpenPresetDialog}>
        {NODE_EDITOR_TEXT.PRESET_OPEN}
    </button>

    <div class="toolbar-divider"></div>

    <button class="action-btn clear-btn" type="button" onclick={onClear}>
        {NODE_EDITOR_TEXT.CLEAR_ALL}
    </button>

    <div class="toolbar-hint">
        {NODE_EDITOR_TEXT.TOOLBAR_HINT}
    </div>
</div>

<style>
    .toolbar {
        position: relative;
        padding: 11px 16px;
        background: var(--node-editor-toolbar-bg);
        border-bottom: 1px solid var(--node-editor-divider);
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        box-shadow: var(--node-editor-toolbar-shadow);
        z-index: 10;
    }

    .toolbar::after {
        content: '';
        position: absolute;
        left: 16px;
        right: 16px;
        bottom: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--node-editor-divider-glow), transparent);
        pointer-events: none;
    }

    .toolbar-label {
        font-size: 10px;
        color: var(--node-editor-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        white-space: nowrap;
    }

    .category-tabs {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
    }

    .category-tab {
        background: var(--node-editor-button-bg);
        color: var(--node-editor-button-text);
        border: 1px solid var(--node-editor-button-border);
        border-radius: var(--node-editor-radius-md);
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
        transition:
            background var(--node-editor-transition-fast),
            color var(--node-editor-transition-fast),
            border-color var(--node-editor-transition-fast),
            box-shadow var(--node-editor-transition-fast);
    }

    .category-tab:hover {
        color: var(--node-editor-button-hover-text);
        border-color: var(--node-editor-button-hover-border);
        box-shadow: var(--node-editor-button-hover-shadow);
    }

    .category-tab.active {
        background: var(--node-editor-button-active-bg);
        color: var(--node-editor-button-active-text);
        border-color: var(--node-editor-button-active-border);
        box-shadow: var(--node-editor-button-active-shadow);
    }

    .drag-btn {
        position: relative;
        z-index: 1;
        background: var(--node-editor-action-bg);
        color: var(--node-editor-action-text);
        border: 1px solid var(--node-editor-action-border);
        padding: 6px 13px;
        border-radius: var(--node-editor-radius-md);
        cursor: grab;
        font-size: 13px;
        font-weight: 600;
        box-shadow: var(--node-editor-surface-inset-highlight);
        transition:
            background var(--node-editor-transition-fast),
            transform var(--node-editor-transition-fast),
            box-shadow var(--node-editor-transition-fast),
            border-color var(--node-editor-transition-fast);
        user-select: none;
    }

    .drag-btn:hover {
        z-index: 30;
        background: var(--node-editor-action-hover-bg);
        transform: translateY(-2px);
        box-shadow: var(--node-editor-accent-shadow);
        border-color: var(--node-editor-accent);
    }

    .drag-btn:focus-visible,
    .category-tab:focus-visible,
    .action-btn:focus-visible {
        outline: 2px solid var(--node-editor-starlight);
        outline-offset: 2px;
    }

    .drag-btn:focus-visible {
        z-index: 30;
    }

    .drag-btn:active {
        cursor: grabbing;
        transform: scale(0.96);
    }

    .toolbar-empty {
        color: var(--node-editor-muted-strong);
        font-size: 12px;
        font-weight: 600;
        padding: 6px 8px;
        white-space: nowrap;
    }

    .toolbar-divider {
        width: 1px;
        height: 24px;
        background: linear-gradient(180deg, transparent, var(--node-editor-divider), transparent);
        margin: 0 4px;
    }

    .action-btn {
        padding: 6px 13px;
        border-radius: var(--node-editor-radius-md);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid;
        transition:
            background var(--node-editor-transition-fast),
            border-color var(--node-editor-transition-fast),
            box-shadow var(--node-editor-transition-fast),
            color var(--node-editor-transition-fast);
    }

    .action-btn:disabled,
    .preset-btn:disabled {
        cursor: not-allowed;
        opacity: 0.52;
        box-shadow: none;
    }

    .preset-btn {
        background: var(--node-editor-button-bg);
        color: var(--node-editor-text-strong);
        border-color: var(--node-editor-button-hover-border);
        box-shadow: var(--node-editor-button-hover-shadow);
    }

    .preset-btn:not(:disabled):hover {
        color: var(--node-editor-button-active-text);
        border-color: var(--node-editor-button-active-border);
        background: var(--node-editor-button-active-bg);
        box-shadow: var(--node-editor-button-active-shadow);
    }

    .clear-btn {
        background: var(--node-editor-danger-bg);
        color: var(--node-editor-danger-text);
        border-color: var(--node-editor-danger-border);
    }

    .clear-btn:not(:disabled):hover {
        background: var(--node-editor-danger-hover-bg);
        border-color: var(--node-editor-danger-text);
        box-shadow: var(--node-editor-danger-shadow);
    }

    .toolbar-hint {
        margin-left: auto;
        color: var(--node-editor-muted-soft);
        font-size: 11px;
        white-space: nowrap;
    }

    @media (max-width: 720px) {
        .toolbar-hint {
            width: 100%;
            margin-left: 0;
            white-space: normal;
            line-height: 1.35;
        }
    }
</style>
