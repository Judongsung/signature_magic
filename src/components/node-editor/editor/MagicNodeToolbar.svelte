<script lang="ts">
    import {
        MAGIC_EDITOR_GUIDE_PATH,
        MAGIC_NODE_CATEGORIES,
        type MagicNodeCategory,
    } from '../../../constants/nodeEditorConfigs';
    import {
        MAGIC_NODE_CATEGORY_LABELS,
        NODE_EDITOR_TEXT,
    } from '../../../constants/uiText';
    import {
        type MagicStatEffectConfig,
    } from '../../../types/magicStatEffects';
    import {
        type MagicType,
        type MagicTypeConfig,
    } from '../../../types/magicTypeConfig';
    import DescriptionTooltip from '../../shared/DescriptionTooltip.svelte';
    import MagicNodeTooltipStats from './MagicNodeTooltipStats.svelte';

    const toolbarId = $props.id();
    const presetTooltipId = `${toolbarId}-preset-tooltip`;
    const circleTooltipId = `${toolbarId}-circle-tooltip`;
    const clearTooltipId = `${toolbarId}-clear-tooltip`;
    const guideTooltipId = `${toolbarId}-guide-tooltip`;

    let {
        activeCategoryIds,
        visibleMagicTypes,
        nodeStatEffects = [],
        canAddNode = true,
        onToggleCategory,
        onAddNode,
        onAddCircle = () => {},
        onDragStart,
        onDragEnd = () => {},
        onClear,
        onOpenPresetDialog,
    }: {
        activeCategoryIds: MagicNodeCategory[];
        visibleMagicTypes: MagicTypeConfig[];
        nodeStatEffects?: readonly MagicStatEffectConfig[];
        canAddNode?: boolean;
        onToggleCategory: (categoryId: MagicNodeCategory) => void;
        onAddNode: (magicType: MagicType) => void;
        onAddCircle?: () => void;
        onDragStart: (event: DragEvent, magicType: MagicType) => void;
        onDragEnd?: () => void;
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

    {#each visibleMagicTypes as { type, label, icon, description, category, stats, statBounds }}
        <button
            class="drag-btn tooltip-host"
            type="button"
            draggable="true"
            disabled={!canAddNode}
            title={!canAddNode ? NODE_EDITOR_TEXT.CIRCLE_REQUIRED_TOOLTIP : undefined}
            aria-describedby={`magic-node-tooltip-${type}`}
            onclick={() => onAddNode(type)}
            ondragstart={(event) => onDragStart(event, type)}
            ondragend={onDragEnd}
        >
            <span>{icon} {label}</span>
            <DescriptionTooltip
                id={`magic-node-tooltip-${type}`}
                {description}
                placement="bottom"
            >
                {#if stats}
                    <MagicNodeTooltipStats
                        {stats}
                        {nodeStatEffects}
                        magicType={type}
                        nodeCategory={category}
                        nodeStatBounds={statBounds}
                    />
                {/if}
            </DescriptionTooltip>
        </button>
    {/each}
    {#if visibleMagicTypes.length === 0}
        <span class="toolbar-empty">{NODE_EDITOR_TEXT.EMPTY_CATEGORY}</span>
    {/if}

    <div class="toolbar-divider"></div>

    <button
        class="node-editor-action-btn node-editor-action-btn--primary action-btn tooltip-host action-tooltip-host"
        type="button"
        aria-describedby={circleTooltipId}
        onclick={onAddCircle}
    >
        {NODE_EDITOR_TEXT.CIRCLE_ADD}
        <DescriptionTooltip
            id={circleTooltipId}
            description={NODE_EDITOR_TEXT.CIRCLE_ADD_TOOLTIP}
            placement="bottom"
        />
    </button>

    <div class="toolbar-divider"></div>

    <button
        class="node-editor-action-btn node-editor-action-btn--primary action-btn tooltip-host action-tooltip-host"
        type="button"
        aria-describedby={presetTooltipId}
        onclick={onOpenPresetDialog}
    >
        {NODE_EDITOR_TEXT.PRESET_OPEN}
        <DescriptionTooltip
            id={presetTooltipId}
            description={NODE_EDITOR_TEXT.PRESET_OPEN_TOOLTIP}
            placement="bottom"
        />
    </button>

    <div class="toolbar-divider"></div>

    <button
        class="node-editor-action-btn node-editor-action-btn--danger action-btn tooltip-host action-tooltip-host"
        type="button"
        aria-describedby={clearTooltipId}
        onclick={onClear}
    >
        {NODE_EDITOR_TEXT.CLEAR_ALL}
        <DescriptionTooltip
            id={clearTooltipId}
            description={NODE_EDITOR_TEXT.CLEAR_ALL_TOOLTIP}
            placement="bottom"
        />
    </button>

    <a
        class="node-editor-action-btn node-editor-action-btn--secondary action-btn guide-link tooltip-host action-tooltip-host"
        href={MAGIC_EDITOR_GUIDE_PATH}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={NODE_EDITOR_TEXT.GUIDE_OPEN_ARIA_LABEL}
        aria-describedby={guideTooltipId}
    >
        {NODE_EDITOR_TEXT.GUIDE_OPEN}
        <DescriptionTooltip
            id={guideTooltipId}
            description={NODE_EDITOR_TEXT.GUIDE_OPEN_TOOLTIP}
            placement="bottom"
        />
    </a>

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

    .drag-btn:disabled {
        cursor: not-allowed;
        opacity: 0.42;
        transform: none;
    }

    .drag-btn:focus-visible,
    .category-tab:focus-visible {
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
        font-weight: 600;
    }

    .action-tooltip-host {
        position: relative;
    }

    .guide-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        white-space: nowrap;
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
