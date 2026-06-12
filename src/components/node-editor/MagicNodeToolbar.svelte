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
    }: {
        activeCategoryIds: MagicNodeCategory[];
        visibleMagicTypes: MagicTypeConfig[];
        onToggleCategory: (categoryId: MagicNodeCategory) => void;
        onAddNode: (magicType: MagicType) => void;
        onDragStart: (event: DragEvent, magicType: MagicType) => void;
        onClear: () => void;
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

    <button class="action-btn clear-btn" onclick={onClear}>
        {NODE_EDITOR_TEXT.CLEAR_ALL}
    </button>

    <div class="toolbar-hint">
        {NODE_EDITOR_TEXT.TOOLBAR_HINT}
    </div>
</div>

<style>
    .toolbar {
        padding: 10px 16px;
        background: var(--node-editor-toolbar-bg);
        border-bottom: 1px solid var(--node-editor-divider);
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        box-shadow: var(--node-editor-toolbar-shadow);
        z-index: 10;
    }

    .toolbar-label {
        font-size: 10px;
        color: var(--node-editor-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
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
        border-radius: 8px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
        transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
    }

    .category-tab:hover {
        color: var(--node-editor-button-hover-text);
        border-color: var(--node-editor-button-hover-border);
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
        border-radius: 8px;
        cursor: grab;
        font-size: 13px;
        font-weight: 600;
        transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
        user-select: none;
    }

    .drag-btn:hover {
        z-index: 30;
        background: var(--node-editor-action-hover-bg);
        transform: translateY(-2px);
        box-shadow: var(--node-editor-accent-shadow);
        border-color: var(--node-editor-accent);
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
        background: var(--node-editor-divider);
        margin: 0 4px;
    }

    .action-btn {
        padding: 6px 13px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid;
        transition: all 0.15s;
    }

    .clear-btn {
        background: var(--node-editor-danger-bg);
        color: var(--node-editor-danger-text);
        border-color: var(--node-editor-danger-border);
    }

    .clear-btn:hover {
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
</style>
