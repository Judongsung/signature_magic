<script lang="ts">
    import { MAGIC_NODE_EDITOR_CONTROLS, MAGIC_REPEAT_CONFIG } from '../../../../constants/nodeEditorConfigs';
import { untrack } from 'svelte';
    import { MAGIC_NODE_EDITOR_BEHAVIORS } from '../../../../constants/nodeEditorConfigs';
    import { MAGIC_NODE_CATEGORY_LABELS, NODE_EDITOR_TEXT } from '../../../../constants/uiText';
    import { MAGIC_NODE_KINDS } from '../../../../constants/graphConfigs';
    import {
        getMagicNodeEditorFields,
        getMagicNodeEditorFieldDraftValue,
        normalizeMagicNodeSettings,
        resolveMagicNodeLabel,
    } from '../../../../systems/graph/model/magicNodeData';
    import {
        type MagicNode,
    } from '../../../../systems/graph/magicGraphTypes';
    import {
        type MagicNodeSettings,
        type MagicNodeStepperEditorFieldConfig,
        type MagicTypeConfig,
    } from '../../../../types/magicTypeConfig';
    import {
        type MagicStatEffectConfig,
    } from '../../../../types/magicStatEffects';
    import { dialogFocus } from '../../../shared/dialogFocus';
    import MagicNodeTooltipStats from '../MagicNodeTooltipStats.svelte';

    const dialogId = $props.id();
    const dialogTitleId = `${dialogId}-node-details-title`;
    const dialogDescriptionId = `${dialogId}-node-details-description`;
    const formId = `${dialogId}-node-details-form`;

    let {
        node,
        config,
        nodeStatEffects = [],
        onSave,
        onDelete,
        onClose,
    }: {
        node: MagicNode;
        config: MagicTypeConfig;
        nodeStatEffects?: readonly MagicStatEffectConfig[];
        onSave: (settings: MagicNodeSettings | undefined) => void;
        onDelete?: () => void;
        onClose: () => void;
    } = $props();

    const fields = $derived(getMagicNodeEditorFields(config));
    const isEditable = $derived(fields.length > 0);
    const displayLabel = $derived(resolveMagicNodeLabel(node.data, config));
    const applicableNodeStatEffects = $derived(
        node.data.nodeKind === MAGIC_NODE_KINDS.SYSTEM ? [] : nodeStatEffects
    );
    let draftSettings = $state<MagicNodeSettings>(untrack(() => Object.fromEntries(
        fields.map(field => [field.key, getMagicNodeEditorFieldDraftValue(field, node.data.settings)])
    )));
    const draftNodeData = $derived({
        settings: draftSettings,
        nodeKind: node.data.nodeKind,
    });

    function saveSettings(event: SubmitEvent) {
        event.preventDefault();
        if (!isEditable) return;

        onSave(normalizeMagicNodeSettings(config, draftSettings));
    }

    function readStepperValue(field: MagicNodeStepperEditorFieldConfig): number {
        const value = Number(draftSettings[field.key]);
        return Number.isFinite(value) ? value : field.defaultValue;
    }

    function adjustStepperValue(field: MagicNodeStepperEditorFieldConfig, direction: -1 | 1): void {
        const nextValue = readStepperValue(field) + field.step * direction;
        draftSettings[field.key] = String(Math.min(field.max, Math.max(field.min, nextValue)));
    }

    function formatStepperValue(field: MagicNodeStepperEditorFieldConfig): string {
        const value = readStepperValue(field);
        return field.behavior === MAGIC_NODE_EDITOR_BEHAVIORS.REPEAT_COUNT &&
            value === MAGIC_REPEAT_CONFIG.INFINITE_COUNT
            ? MAGIC_REPEAT_CONFIG.INFINITE_LABEL
            : String(value);
    }

    function getStepperValueAriaLabel(field: MagicNodeStepperEditorFieldConfig): string {
        return formatStepperValue(field) === MAGIC_REPEAT_CONFIG.INFINITE_LABEL
            ? NODE_EDITOR_TEXT.NODE_DETAILS_STEPPER_INFINITE_VALUE
            : `${field.label} ${formatStepperValue(field)}`;
    }
</script>

<div class="node-details-overlay">
    <button
        type="button"
        class="node-details-backdrop"
        aria-label={NODE_EDITOR_TEXT.NODE_DETAILS_DIALOG_CLOSE_ARIA_LABEL}
        onclick={onClose}
    ></button>

    <div
        class="node-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
        tabindex="-1"
        use:dialogFocus={{ onClose }}
    >
        <header class="node-details-header" style:--node-color={config.color}>
            <span class="node-details-icon" aria-hidden="true">{config.icon}</span>
            <div>
                <p class="node-details-eyebrow">{NODE_EDITOR_TEXT.NODE_DETAILS_DIALOG_TITLE}</p>
                <h2 id={dialogTitleId}>{displayLabel}</h2>
            </div>
        </header>

        <form id={formId} class="node-details-form" onsubmit={saveSettings}>
            <dl class="node-details-info">
                <div>
                    <dt>{NODE_EDITOR_TEXT.NODE_DETAILS_CATEGORY_LABEL}</dt>
                    <dd>{MAGIC_NODE_CATEGORY_LABELS[config.category]}</dd>
                </div>
                <div>
                    <dt>{NODE_EDITOR_TEXT.NODE_DETAILS_DESCRIPTION_LABEL}</dt>
                    <dd id={dialogDescriptionId}>{config.description}</dd>
                </div>
            </dl>

            <section class="node-details-stats" aria-label={NODE_EDITOR_TEXT.NODE_DETAILS_STATS_LABEL}>
                <h3>{NODE_EDITOR_TEXT.NODE_DETAILS_STATS_LABEL}</h3>
                <MagicNodeTooltipStats
                    stats={config.stats}
                    nodeStatEffects={applicableNodeStatEffects}
                    magicType={config.type}
                    nodeCategory={config.category}
                    nodeStatBounds={config.statBounds}
                    nodeData={draftNodeData}
                />
            </section>

            {#if isEditable}
                <section class="node-details-settings">
                    {#each fields as field}
                        {#if field.control === MAGIC_NODE_EDITOR_CONTROLS.TEXT}
                            <label class="node-details-setting">
                                <span>{field.label}</span>
                                <input
                                    type="text"
                                    maxlength={field.maxLength}
                                    placeholder={field.placeholder}
                                    bind:value={draftSettings[field.key]}
                                />
                                {#if field.helpText}<small>{field.helpText}</small>{/if}
                            </label>
                        {:else if field.control === MAGIC_NODE_EDITOR_CONTROLS.STEPPER}
                            <div class="node-details-setting">
                                <span id={`${dialogId}-${field.key}-label`}>{field.label}</span>
                                <div
                                    class="node-details-stepper"
                                    role="group"
                                    aria-labelledby={`${dialogId}-${field.key}-label`}
                                >
                                    <button
                                        type="button"
                                        aria-label={`${field.label} ${NODE_EDITOR_TEXT.NODE_DETAILS_STEPPER_DECREASE}`}
                                        disabled={readStepperValue(field) <= field.min}
                                        onclick={() => adjustStepperValue(field, -1)}
                                    >−</button>
                                    <output
                                        aria-live="polite"
                                        aria-label={getStepperValueAriaLabel(field)}
                                    >{formatStepperValue(field)}</output>
                                    <button
                                        type="button"
                                        aria-label={`${field.label} ${NODE_EDITOR_TEXT.NODE_DETAILS_STEPPER_INCREASE}`}
                                        disabled={readStepperValue(field) >= field.max}
                                        onclick={() => adjustStepperValue(field, 1)}
                                    >+</button>
                                </div>
                                {#if field.helpText}<small>{field.helpText}</small>{/if}
                            </div>
                        {/if}
                    {/each}
                </section>
            {/if}
        </form>

        <footer class="node-details-actions">
            {#if onDelete}
                <button
                    type="button"
                    class="node-details-delete node-editor-action-btn node-editor-action-btn--danger"
                    onclick={onDelete}
                >
                    {NODE_EDITOR_TEXT.DETAILS_DELETE}
                </button>
            {/if}
            {#if isEditable}
                <button
                    type="button"
                    class="node-editor-action-btn node-editor-action-btn--secondary"
                    onclick={onClose}
                >
                    {NODE_EDITOR_TEXT.NODE_DETAILS_CANCEL}
                </button>
                <button
                    type="submit"
                    form={formId}
                    class="node-editor-action-btn node-editor-action-btn--primary"
                >
                    {NODE_EDITOR_TEXT.NODE_DETAILS_SAVE}
                </button>
            {:else}
                <button
                    type="button"
                    class="node-editor-action-btn node-editor-action-btn--secondary"
                    onclick={onClose}
                >
                    {NODE_EDITOR_TEXT.NODE_DETAILS_CLOSE}
                </button>
            {/if}
        </footer>
    </div>
</div>

<style>
    .node-details-overlay {
        position: fixed;
        inset: 0;
        z-index: 140;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        box-sizing: border-box;
    }

    .node-details-backdrop {
        position: fixed;
        inset: 0;
        border: 0;
        padding: 0;
        background: rgba(2, 3, 10, 0.78);
        backdrop-filter: blur(5px);
        cursor: default;
    }

    .node-details-dialog {
        position: relative;
        z-index: 1;
        width: min(460px, 100%);
        max-height: calc(100vh - 36px);
        overflow-y: auto;
        border: 1px solid var(--node-editor-border);
        border-radius: var(--node-editor-radius-md);
        background: var(--node-editor-panel-bg);
        color: var(--node-editor-text);
        box-shadow: var(--node-editor-panel-shadow);
        outline: none;
    }

    .node-details-header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px 20px;
        border-bottom: 1px solid var(--node-editor-divider);
    }

    .node-details-icon {
        color: var(--node-color);
        font-size: 32px;
        filter: drop-shadow(0 0 8px color-mix(in srgb, var(--node-color) 70%, transparent));
    }

    .node-details-eyebrow,
    .node-details-header h2,
    .node-details-stats h3,
    .node-details-info,
    .node-details-info dd {
        margin: 0;
    }

    .node-details-eyebrow {
        color: var(--node-editor-preview-section-label);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .node-details-header h2 {
        margin-top: 4px;
        color: var(--node-editor-text-strong);
        font-family: var(--font-title);
        font-size: 20px;
    }

    .node-details-form {
        display: grid;
        gap: 16px;
        padding: 18px 20px;
    }

    .node-details-info {
        display: grid;
        gap: 12px;
    }

    .node-details-info div,
    .node-details-setting {
        display: grid;
        gap: 6px;
    }

    .node-details-info dt,
    .node-details-settings span,
    .node-details-stats h3 {
        color: var(--node-editor-stats-label);
        font-size: 11px;
        font-weight: 800;
    }

    .node-details-info dd {
        color: var(--node-editor-text);
        font-size: 13px;
        line-height: 1.5;
    }

    .node-details-stats,
    .node-details-settings {
        display: grid;
        gap: 9px;
    }

    .node-details-stats :global(.node-tooltip-stats) {
        width: 100%;
        min-width: 0;
    }

    .node-details-settings input {
        width: 100%;
        min-width: 0;
        padding: 9px 10px;
        border: 1px solid var(--node-editor-button-border);
        border-radius: var(--node-editor-radius-sm);
        background: var(--node-editor-button-bg);
        color: var(--node-editor-text-strong);
        font: inherit;
        box-sizing: border-box;
    }

    .node-details-settings input:focus-visible {
        outline: 2px solid var(--node-editor-starlight);
        outline-offset: 2px;
    }

    .node-details-stepper {
        display: grid;
        grid-template-columns: 42px minmax(64px, 1fr) 42px;
        align-items: stretch;
        gap: 6px;
    }

    .node-details-stepper button,
    .node-details-stepper output {
        min-height: 38px;
        border: 1px solid var(--node-editor-button-border);
        border-radius: var(--node-editor-radius-sm);
        background: var(--node-editor-button-bg);
        color: var(--node-editor-text-strong);
        font: inherit;
        box-sizing: border-box;
    }

    .node-details-stepper button {
        cursor: pointer;
        font-size: 18px;
    }

    .node-details-stepper button:disabled {
        cursor: default;
        opacity: 0.4;
    }

    .node-details-stepper button:focus-visible {
        outline: 2px solid var(--node-editor-starlight);
        outline-offset: 2px;
    }

    .node-details-stepper output {
        display: grid;
        place-items: center;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
    }

    .node-details-setting small {
        color: var(--node-editor-muted-strong);
        font-size: 11px;
        line-height: 1.4;
    }

    .node-details-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 14px 20px 18px;
        border-top: 1px solid var(--node-editor-divider);
    }

    .node-details-actions button {
        min-width: 76px;
        min-height: 38px;
        padding: 8px 14px;
    }

    .node-details-delete {
        margin-right: auto;
    }
</style>
