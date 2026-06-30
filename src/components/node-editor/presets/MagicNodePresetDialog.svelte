<script lang="ts">
    import {
        MAGIC_GRAPH_PRESET_SOURCES,
        type MagicGraphPresetOption,
    } from '../../../systems/graph/presets/magicGraphPresets';
    import { NODE_EDITOR_TEXT } from '../../../constants/uiText';
    import { dialogFocus } from '../../shared/dialogFocus';
    import DescriptionTooltip from '../../shared/DescriptionTooltip.svelte';
    import {
        NODE_COMPOSITION_PRESET_STORAGE_OPERATIONS,
        type NodeCompositionPresetStorageNotice,
    } from './nodeCompositionPresetController.svelte';

    const dialogId = $props.id();
    const dialogTitleId = `${dialogId}-preset-dialog-title`;
    const presetNameInputId = `${dialogId}-preset-name`;
    const loadTooltipId = `${dialogId}-preset-load-tooltip`;
    const deleteTooltipId = `${dialogId}-preset-delete-tooltip`;

    let {
        presetOptions,
        selectedPresetValue,
        canLoadPreset,
        canSavePreset,
        canDeletePreset,
        storageNotice,
        onSelectPreset,
        onLoadPreset,
        onSavePreset,
        onDeletePreset,
        onClose,
    }: {
        presetOptions: MagicGraphPresetOption[];
        selectedPresetValue: string;
        canLoadPreset: boolean;
        canSavePreset: boolean;
        canDeletePreset: boolean;
        storageNotice?: NodeCompositionPresetStorageNotice;
        onSelectPreset: (value: string) => void;
        onLoadPreset: () => boolean;
        onSavePreset: (label: string) => void;
        onDeletePreset: () => void;
        onClose: () => void;
    } = $props();

    let presetName = $state(NODE_EDITOR_TEXT.PRESET_DEFAULT_NAME);
    const builtInPresetOptions = $derived(
        presetOptions.filter(option => option.source === MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN)
    );
    const userPresetOptions = $derived(
        presetOptions.filter(option => option.source === MAGIC_GRAPH_PRESET_SOURCES.USER)
    );
    const canSubmitSave = $derived(canSavePreset && presetName.trim().length > 0);
    const storageNoticeMessage = $derived(
        resolveStorageNoticeMessage(storageNotice)
    );

    function loadPreset() {
        if (!canLoadPreset) return;

        if (onLoadPreset()) onClose();
    }

    function savePreset(event: SubmitEvent) {
        event.preventDefault();
        if (!canSubmitSave) return;

        onSavePreset(presetName);
    }

    function deletePreset() {
        if (!canDeletePreset) return;

        onDeletePreset();
    }

    function resolveStorageNoticeMessage(
        notice: NodeCompositionPresetStorageNotice | undefined
    ): string | undefined {
        if (!notice) return undefined;
        if (notice.level === 'warning') {
            return NODE_EDITOR_TEXT.PRESET_STORAGE_WARNING;
        }
        if (
            notice.operation ===
            NODE_COMPOSITION_PRESET_STORAGE_OPERATIONS.SAVE
        ) {
            return NODE_EDITOR_TEXT.PRESET_STORAGE_SAVE_ERROR;
        }
        if (
            notice.operation ===
            NODE_COMPOSITION_PRESET_STORAGE_OPERATIONS.DELETE
        ) {
            return NODE_EDITOR_TEXT.PRESET_STORAGE_DELETE_ERROR;
        }
        return NODE_EDITOR_TEXT.PRESET_STORAGE_LOAD_ERROR;
    }
</script>

<div class="preset-dialog-overlay">
    <button
        type="button"
        class="preset-dialog-backdrop"
        aria-label={NODE_EDITOR_TEXT.PRESET_DIALOG_CLOSE_ARIA_LABEL}
        onclick={onClose}
    ></button>
    <div
        class="preset-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabindex="-1"
        use:dialogFocus={{ onClose }}
    >
        <header class="preset-dialog-header">
            <div>
                <p class="preset-dialog-eyebrow">{NODE_EDITOR_TEXT.PRESET_LABEL}</p>
                <h2 id={dialogTitleId}>{NODE_EDITOR_TEXT.PRESET_DIALOG_TITLE}</h2>
                <p class="preset-dialog-description">{NODE_EDITOR_TEXT.PRESET_DIALOG_DESCRIPTION}</p>
            </div>
            <button
                type="button"
                class="icon-close-btn"
                aria-label={NODE_EDITOR_TEXT.PRESET_DIALOG_CLOSE_ARIA_LABEL}
                onclick={onClose}
            >
                x
            </button>
        </header>

        <div class="preset-dialog-body">
            {#if storageNotice && storageNoticeMessage}
                <p
                    class:warning={storageNotice.level === 'warning'}
                    class="preset-storage-notice"
                    role={storageNotice.level === 'error' ? 'alert' : 'status'}
                >
                    {storageNoticeMessage}
                </p>
            {/if}
            <section class="preset-list-section" aria-labelledby={`${dialogId}-built-in-presets`}>
                <h3 id={`${dialogId}-built-in-presets`}>{NODE_EDITOR_TEXT.PRESET_BUILT_IN_GROUP_LABEL}</h3>
                <div class="preset-list">
                    {#each builtInPresetOptions as option}
                        {@const isSelected = option.value === selectedPresetValue}
                        <button
                            type="button"
                            class="preset-list-item"
                            class:active={isSelected}
                            aria-pressed={isSelected}
                            onclick={() => onSelectPreset(option.value)}
                        >
                            {option.label}
                        </button>
                    {/each}
                </div>
            </section>

            <section class="preset-list-section" aria-labelledby={`${dialogId}-user-presets`}>
                <h3 id={`${dialogId}-user-presets`}>{NODE_EDITOR_TEXT.PRESET_USER_GROUP_LABEL}</h3>
                {#if userPresetOptions.length > 0}
                    <div class="preset-list">
                        {#each userPresetOptions as option}
                            {@const isSelected = option.value === selectedPresetValue}
                            <button
                                type="button"
                                class="preset-list-item"
                                class:active={isSelected}
                                aria-pressed={isSelected}
                                onclick={() => onSelectPreset(option.value)}
                            >
                                {option.label}
                            </button>
                        {/each}
                    </div>
                {:else}
                    <p class="preset-empty">{NODE_EDITOR_TEXT.PRESET_USER_EMPTY}</p>
                {/if}
            </section>

            <form class="preset-save-form" onsubmit={savePreset}>
                <label for={presetNameInputId}>{NODE_EDITOR_TEXT.PRESET_NAME_LABEL}</label>
                <div class="preset-save-row">
                    <input
                        id={presetNameInputId}
                        type="text"
                        bind:value={presetName}
                        placeholder={NODE_EDITOR_TEXT.PRESET_NAME_PLACEHOLDER}
                    />
                    <button
                        class="node-editor-action-btn node-editor-action-btn--primary action-btn"
                        type="submit"
                        disabled={!canSubmitSave}
                    >
                        {NODE_EDITOR_TEXT.PRESET_SAVE}
                    </button>
                </div>
            </form>
        </div>

        <footer class="preset-dialog-actions">
            <span class="tooltip-host action-tooltip-host">
                <button
                    class="node-editor-action-btn node-editor-action-btn--primary action-btn"
                    type="button"
                    onclick={loadPreset}
                    disabled={!canLoadPreset}
                    aria-describedby={loadTooltipId}
                >
                    {NODE_EDITOR_TEXT.PRESET_LOAD}
                </button>
                <DescriptionTooltip
                    id={loadTooltipId}
                    description={NODE_EDITOR_TEXT.PRESET_LOAD_TOOLTIP}
                />
            </span>
            <span class="tooltip-host action-tooltip-host">
                <button
                    class="node-editor-action-btn node-editor-action-btn--danger action-btn"
                    type="button"
                    onclick={deletePreset}
                    disabled={!canDeletePreset}
                    aria-describedby={deleteTooltipId}
                >
                    {NODE_EDITOR_TEXT.PRESET_DELETE}
                </button>
                <DescriptionTooltip
                    id={deleteTooltipId}
                    description={NODE_EDITOR_TEXT.PRESET_DELETE_TOOLTIP}
                />
            </span>
            <button
                class="node-editor-action-btn node-editor-action-btn--secondary action-btn"
                type="button"
                onclick={onClose}
            >
                {NODE_EDITOR_TEXT.PRESET_CLOSE}
            </button>
        </footer>
    </div>
</div>

<style>
    .preset-dialog-overlay {
        position: fixed;
        inset: 0;
        z-index: 130;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 22px;
        box-sizing: border-box;
    }

    .preset-dialog-backdrop {
        position: fixed;
        inset: 0;
        padding: 0;
        border: 0;
        background: rgba(2, 3, 10, 0.58);
        backdrop-filter: blur(5px);
        cursor: default;
    }

    .preset-dialog {
        position: relative;
        z-index: 1;
        width: min(620px, 100%);
        max-height: min(760px, 100%);
        overflow: auto;
        border: 1px solid var(--node-editor-border);
        border-radius: var(--node-editor-radius-md);
        background:
            linear-gradient(180deg, var(--node-editor-ink), var(--node-editor-obsidian));
        box-shadow: var(--node-editor-panel-shadow);
        color: var(--node-editor-text);
        outline: none;
    }

    .preset-dialog-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 20px 16px;
        border-bottom: 1px solid var(--node-editor-divider);
        background: var(--node-editor-ink);
    }

    .preset-dialog-eyebrow {
        margin: 0 0 5px;
        color: var(--node-editor-muted);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
    }

    .preset-dialog h2 {
        margin: 0;
        color: var(--node-editor-text-strong);
        font-size: 20px;
        line-height: 1.2;
    }

    .preset-dialog-description {
        margin: 8px 0 0;
        color: var(--node-editor-muted-strong);
        font-size: 13px;
        line-height: 1.45;
    }

    .icon-close-btn {
        flex: 0 0 auto;
        width: 32px;
        height: 32px;
        border: 1px solid var(--node-editor-button-border);
        border-radius: var(--node-editor-radius-md);
        background: var(--node-editor-obsidian);
        color: var(--node-editor-button-text);
        cursor: pointer;
        font-size: 16px;
        font-weight: 800;
        line-height: 1;
    }

    .icon-close-btn:hover {
        color: var(--node-editor-button-hover-text);
        border-color: var(--node-editor-button-hover-border);
        box-shadow: var(--node-editor-button-hover-shadow);
    }

    .preset-dialog-body {
        display: grid;
        gap: 16px;
        padding: 18px 20px;
    }

    .preset-storage-notice {
        margin: 0;
        padding: 10px 12px;
        border: 1px solid rgba(231, 104, 118, 0.52);
        border-radius: var(--node-editor-radius-md);
        background: rgba(111, 31, 43, 0.22);
        color: #ffd4da;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.5;
    }

    .preset-storage-notice.warning {
        border-color: rgba(230, 184, 89, 0.48);
        background: rgba(112, 78, 24, 0.2);
        color: #ffe8b0;
    }

    .preset-list-section {
        display: grid;
        gap: 10px;
    }

    .preset-list-section h3,
    .preset-save-form label {
        margin: 0;
        color: var(--node-editor-preview-section-label);
        font-size: 12px;
        font-weight: 800;
    }

    .preset-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
    }

    .preset-list-item {
        min-height: 38px;
        padding: 8px 10px;
        border: 1px solid var(--node-editor-button-border);
        border-radius: var(--node-editor-radius-md);
        background: var(--node-editor-obsidian);
        color: var(--node-editor-button-text);
        cursor: pointer;
        font-size: 13px;
        font-weight: 700;
        text-align: left;
        overflow-wrap: anywhere;
        transition:
            background var(--node-editor-transition-fast),
            border-color var(--node-editor-transition-fast),
            box-shadow var(--node-editor-transition-fast),
            color var(--node-editor-transition-fast);
    }

    .preset-list-item:hover,
    .preset-list-item.active {
        color: var(--node-editor-button-active-text);
        border-color: var(--node-editor-button-active-border);
        background: var(--node-editor-button-active-bg);
        box-shadow: var(--node-editor-button-active-shadow);
    }

    .preset-empty {
        margin: 0;
        color: var(--node-editor-muted-soft);
        font-size: 13px;
    }

    .preset-save-form {
        display: grid;
        gap: 9px;
    }

    .preset-save-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) max-content;
        gap: 8px;
    }

    .preset-save-row input {
        min-width: 0;
        border: 1px solid var(--node-editor-button-border);
        border-radius: var(--node-editor-radius-md);
        padding: 8px 10px;
        background: var(--node-editor-obsidian);
        color: var(--node-editor-text);
        font-size: 13px;
        font-weight: 700;
    }

    .preset-save-row input::placeholder {
        color: var(--node-editor-muted-soft);
    }

    .preset-dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 14px 20px 18px;
        border-top: 1px solid var(--node-editor-divider);
    }

    .action-tooltip-host {
        position: relative;
        display: inline-flex;
    }

    .action-btn {
        padding: 7px 13px;
    }

    .icon-close-btn:focus-visible,
    .preset-list-item:focus-visible,
    .preset-save-row input:focus-visible {
        outline: 2px solid var(--node-editor-starlight);
        outline-offset: 2px;
    }

    @media (max-width: 620px) {
        .preset-dialog-overlay {
            align-items: stretch;
            padding: 12px;
        }

        .preset-dialog-actions,
        .preset-save-row {
            grid-template-columns: 1fr;
            flex-direction: column;
        }

        .preset-dialog-actions .node-editor-action-btn {
            width: 100%;
        }

        .action-tooltip-host {
            width: 100%;
        }
    }
</style>
