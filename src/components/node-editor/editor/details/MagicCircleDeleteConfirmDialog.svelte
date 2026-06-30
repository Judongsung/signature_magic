<script lang="ts">
    import { NODE_EDITOR_TEXT } from '../../../../constants/uiText';
    import { dialogFocus } from '../../../shared/dialogFocus';

    const dialogId = $props.id();
    const titleId = `${dialogId}-title`;
    const descriptionId = `${dialogId}-description`;

    let {
        onConfirm,
        onClose,
    }: {
        onConfirm: () => void;
        onClose: () => void;
    } = $props();
</script>

<div class="circle-delete-overlay">
    <button
        type="button"
        class="circle-delete-backdrop"
        aria-label={NODE_EDITOR_TEXT.CIRCLE_DELETE_DIALOG_CANCEL}
        onclick={onClose}
    ></button>

    <div
        class="circle-delete-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabindex="-1"
        use:dialogFocus={{ onClose }}
    >
        <header>
            <h2 id={titleId}>
                {NODE_EDITOR_TEXT.CIRCLE_DELETE_DIALOG_TITLE}
            </h2>
        </header>

        <p id={descriptionId} class="circle-delete-description">
            {NODE_EDITOR_TEXT.CIRCLE_DELETE_CONFIRM}
        </p>

        <footer>
            <button
                type="button"
                class="node-editor-action-btn node-editor-action-btn--secondary"
                onclick={onClose}
            >
                {NODE_EDITOR_TEXT.CIRCLE_DELETE_DIALOG_CANCEL}
            </button>
            <button
                type="button"
                class="node-editor-action-btn node-editor-action-btn--danger"
                onclick={onConfirm}
            >
                {NODE_EDITOR_TEXT.CIRCLE_DELETE_DIALOG_CONFIRM}
            </button>
        </footer>
    </div>
</div>

<style>
    .circle-delete-overlay {
        position: fixed;
        inset: 0;
        z-index: 160;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        box-sizing: border-box;
    }

    .circle-delete-backdrop {
        position: fixed;
        inset: 0;
        padding: 0;
        border: 0;
        background: rgba(2, 3, 10, 0.82);
        backdrop-filter: blur(5px);
        cursor: default;
    }

    .circle-delete-dialog {
        position: relative;
        z-index: 1;
        width: min(400px, 100%);
        border: 1px solid var(--node-editor-danger-border);
        border-radius: var(--node-editor-radius-md);
        background: var(--node-editor-panel-bg);
        color: var(--node-editor-text);
        box-shadow: var(--node-editor-panel-shadow);
        outline: none;
    }

    .circle-delete-dialog header {
        padding: 18px 20px;
        border-bottom: 1px solid var(--node-editor-divider);
    }

    .circle-delete-dialog header h2,
    .circle-delete-description {
        margin: 0;
    }

    .circle-delete-dialog header h2 {
        color: var(--node-editor-danger-text);
        font-family: var(--font-title);
        font-size: 20px;
    }

    .circle-delete-description {
        padding: 20px;
        font-size: 13px;
        line-height: 1.6;
    }

    .circle-delete-dialog footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 14px 20px 18px;
        border-top: 1px solid var(--node-editor-divider);
    }

    .circle-delete-dialog footer button {
        min-width: 76px;
        min-height: 38px;
        padding: 8px 14px;
    }
</style>
