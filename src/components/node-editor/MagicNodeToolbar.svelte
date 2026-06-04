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
        background: #111118;
        border-bottom: 1px solid #2a2a3a;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
        z-index: 10;
    }

    .toolbar-label {
        font-size: 10px;
        color: #555;
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
        background: #16161f;
        color: #8e8ea8;
        border: 1px solid #2f2f44;
        border-radius: 8px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
        transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
    }

    .category-tab:hover {
        color: #e8e2ff;
        border-color: #6f5e9c;
    }

    .category-tab.active {
        background: #2a2140;
        color: #f1ecff;
        border-color: #9b7ad6;
        box-shadow: 0 0 0 1px rgba(155, 122, 214, 0.18);
    }

    .drag-btn {
        position: relative;
        z-index: 1;
        background: #1e1e2e;
        color: #ddd;
        border: 1px solid #3a3a5a;
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
        background: #2a2a40;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(155, 89, 182, 0.35);
        border-color: #9b59b6;
    }

    .drag-btn:focus-visible {
        z-index: 30;
    }

    .drag-btn:active {
        cursor: grabbing;
        transform: scale(0.96);
    }

    .toolbar-empty {
        color: #66667a;
        font-size: 12px;
        font-weight: 600;
        padding: 6px 8px;
        white-space: nowrap;
    }

    .toolbar-divider {
        width: 1px;
        height: 24px;
        background: #2a2a3a;
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
        background: #1e1010;
        color: #f87;
        border-color: #5a2a2a;
    }

    .clear-btn:hover {
        background: #2e1515;
        border-color: #f87;
        box-shadow: 0 2px 10px rgba(255, 100, 100, 0.25);
    }

    .toolbar-hint {
        margin-left: auto;
        color: #444;
        font-size: 11px;
        white-space: nowrap;
    }
</style>
