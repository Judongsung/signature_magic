<script lang="ts">
    import luarnChibiImageSrc from '../../../assets/images/luarn_chibi.png';
    import { NODE_COMPOSITION_SIGNATURE_TEXT } from '../../../constants/uiText';
    import type { MagicSignatureMetadata } from '../../../types/magic';
    import {
        activateDialogFocus,
        closeDialogOnEscape,
        trapDialogFocus,
    } from '../../shared/dialogFocus';
    import CharacterSpeechBubble from '../../shared/CharacterSpeechBubble.svelte';

    const dialogId = $props.id();
    const dialogTitleId = `${dialogId}-signature-dialog-title`;
    const dialogDescriptionId = `${dialogId}-signature-dialog-description`;
    const signatureFormId = `${dialogId}-signature-form`;
    const signatureNameInputId = `${dialogId}-signature-name`;
    const signatureDescriptionInputId = `${dialogId}-signature-description`;

    let {
        onSubmit,
        onClose,
    }: {
        onSubmit: (metadata: MagicSignatureMetadata) => void;
        onClose: () => void;
    } = $props();

    let dialogElement: HTMLElement;
    let signatureName = $state('');
    let signatureDescription = $state('');
    const canSubmit = $derived(signatureName.trim().length > 0);

    $effect(() => {
        if (!dialogElement) return;

        return activateDialogFocus(dialogElement);
    });

    function handleWindowKeydown(event: KeyboardEvent) {
        closeDialogOnEscape(event, onClose);
    }

    function handleDialogKeydown(event: KeyboardEvent) {
        trapDialogFocus(event, dialogElement);
    }

    function submitSignature(event: SubmitEvent) {
        event.preventDefault();
        if (!canSubmit) return;

        onSubmit({
            name: signatureName.trim(),
            description: signatureDescription.trim(),
        });
    }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="signature-dialog-overlay">
    <button
        type="button"
        class="signature-dialog-backdrop"
        aria-label={NODE_COMPOSITION_SIGNATURE_TEXT.CLOSE_ARIA_LABEL}
        onclick={onClose}
    ></button>

    <div
        class="signature-dialog-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
        tabindex="-1"
        bind:this={dialogElement}
        onkeydown={handleDialogKeydown}
    >
        <div class="signature-dialog-speech signature-dialog-speech-top">
            <CharacterSpeechBubble
                imageSrc={luarnChibiImageSrc}
                imageAlt={NODE_COMPOSITION_SIGNATURE_TEXT.LUARN_IMAGE_ALT}
                message={NODE_COMPOSITION_SIGNATURE_TEXT.TOP_MESSAGE}
                speakerName={NODE_COMPOSITION_SIGNATURE_TEXT.SPEAKER_NAME}
                speakerTitle={NODE_COMPOSITION_SIGNATURE_TEXT.SPEAKER_TITLE}
            />
        </div>

        <div class="signature-dialog">
            <form
                id={signatureFormId}
                class="signature-dialog-form"
                onsubmit={submitSignature}
            >
                <header class="signature-dialog-header">
                    <div>
                        <p class="signature-dialog-eyebrow">{NODE_COMPOSITION_SIGNATURE_TEXT.EYEBROW}</p>
                        <h2 id={dialogTitleId}>{NODE_COMPOSITION_SIGNATURE_TEXT.TITLE}</h2>
                        <p id={dialogDescriptionId} class="signature-dialog-description">
                            {NODE_COMPOSITION_SIGNATURE_TEXT.DESCRIPTION}
                        </p>
                    </div>
                </header>

                <div class="signature-dialog-body">
                    <label class="signature-field">
                        <span>{NODE_COMPOSITION_SIGNATURE_TEXT.NAME_LABEL}</span>
                        <input
                            id={signatureNameInputId}
                            type="text"
                            required
                            bind:value={signatureName}
                            placeholder={NODE_COMPOSITION_SIGNATURE_TEXT.NAME_PLACEHOLDER}
                        />
                    </label>

                    <label class="signature-field">
                        <span>{NODE_COMPOSITION_SIGNATURE_TEXT.DESCRIPTION_LABEL}</span>
                        <textarea
                            id={signatureDescriptionInputId}
                            rows="5"
                            bind:value={signatureDescription}
                            placeholder={NODE_COMPOSITION_SIGNATURE_TEXT.DESCRIPTION_PLACEHOLDER}
                        ></textarea>
                    </label>
                </div>
            </form>
        </div>

        <div class="signature-dialog-speech signature-dialog-speech-bottom">
            <CharacterSpeechBubble
                imageSrc={luarnChibiImageSrc}
                imageAlt={NODE_COMPOSITION_SIGNATURE_TEXT.LUARN_IMAGE_ALT}
                message={NODE_COMPOSITION_SIGNATURE_TEXT.BOTTOM_MESSAGE}
                speakerName={NODE_COMPOSITION_SIGNATURE_TEXT.SPEAKER_NAME}
                speakerTitle={NODE_COMPOSITION_SIGNATURE_TEXT.SPEAKER_TITLE}
            />
        </div>

        <div class="signature-dialog-actions">
            <button
                class="signature-action signature-action--secondary"
                type="button"
                onclick={onClose}
            >
                {NODE_COMPOSITION_SIGNATURE_TEXT.CANCEL}
            </button>
            <button
                class="signature-action signature-action--primary"
                type="submit"
                form={signatureFormId}
                disabled={!canSubmit}
            >
                {NODE_COMPOSITION_SIGNATURE_TEXT.SUBMIT}
            </button>
        </div>
    </div>
</div>

<style>
    .signature-dialog-overlay {
        position: fixed;
        inset: 0;
        z-index: 135;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 28px 18px 34px;
        overflow-x: hidden;
        overflow-y: auto;
        box-sizing: border-box;
    }

    .signature-dialog-backdrop {
        position: fixed;
        inset: 0;
        padding: 0;
        border: 0;
        background: rgba(26, 18, 11, 0.72);
        backdrop-filter: blur(5px);
        cursor: default;
    }

    .signature-dialog-shell {
        position: relative;
        z-index: 1;
        width: min(680px, 100%);
        max-height: calc(100vh - 56px);
        display: flex;
        flex-direction: column;
        gap: 14px;
        overflow-x: hidden;
        overflow-y: auto;
        outline: none;
        box-sizing: border-box;
    }

    .signature-dialog-speech {
        display: flex;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        box-sizing: border-box;
    }

    .signature-dialog-speech-top {
        justify-content: flex-start;
    }

    .signature-dialog-speech-bottom {
        justify-content: flex-end;
    }

    .signature-dialog {
        width: 100%;
        max-height: min(680px, 100%);
        overflow-x: hidden;
        overflow-y: auto;
        border: 1px solid var(--guild-surface-border-subtle);
        border-radius: 8px;
        background:
            linear-gradient(180deg, rgba(255, 253, 247, 0.96), rgba(246, 239, 225, 0.98));
        box-shadow:
            0 18px 44px rgba(86, 61, 35, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
        color: var(--guild-text-primary);
        outline: none;
        box-sizing: border-box;
    }

    .signature-dialog-form {
        margin: 0;
    }

    .signature-dialog-header {
        display: flex;
        align-items: flex-start;
        padding: 18px 20px 16px;
        border-bottom: 1px solid rgba(103, 77, 48, 0.16);
        background:
            linear-gradient(180deg, rgba(255, 253, 247, 0.82), rgba(246, 239, 225, 0.68));
    }

    .signature-dialog-eyebrow {
        margin: 0 0 5px;
        color: #7d4d2d;
        font-family: var(--font-title);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 2px;
    }

    .signature-dialog h2 {
        margin: 0;
        color: var(--guild-text-title);
        font-family: var(--font-title);
        font-size: 20px;
        line-height: 1.2;
    }

    .signature-dialog-description {
        margin: 8px 0 0;
        color: var(--guild-text-muted);
        font-size: 13px;
        line-height: 1.45;
    }

    .signature-dialog-body {
        display: grid;
        gap: 14px;
        padding: 18px 20px;
        box-sizing: border-box;
    }

    .signature-field {
        display: grid;
        gap: 8px;
    }

    .signature-field span {
        color: var(--guild-text-label);
        font-size: 12px;
        font-weight: 800;
    }

    .signature-field input,
    .signature-field textarea {
        width: 100%;
        min-width: 0;
        border: 1px solid var(--guild-surface-border-control);
        border-radius: 6px;
        padding: 9px 11px;
        background: var(--guild-field-bg);
        color: var(--guild-text-primary);
        font-family: var(--font-body);
        font-size: 13px;
        font-weight: 700;
        box-sizing: border-box;
    }

    .signature-field textarea {
        resize: vertical;
        line-height: 1.5;
    }

    .signature-field input::placeholder,
    .signature-field textarea::placeholder {
        color: var(--guild-field-placeholder);
    }

    .signature-dialog-actions {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0;
        max-width: 100%;
        box-sizing: border-box;
    }

    .signature-action {
        min-height: 40px;
        padding: 7px 14px;
        border-radius: 4px;
        font-family: var(--font-title);
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        transition:
            background 0.16s ease,
            border-color 0.16s ease,
            box-shadow 0.16s ease,
            opacity 0.16s ease,
            transform 0.16s ease;
    }

    .signature-action--primary {
        border: 1px solid var(--guild-leather);
        background: var(--guild-action-primary-bg);
        color: var(--guild-action-text);
        box-shadow: var(--guild-action-primary-shadow);
    }

    .signature-action--secondary {
        border: 1px solid var(--guild-action-secondary-border);
        background: var(--guild-action-secondary-bg);
        color: var(--guild-action-secondary-text);
        box-shadow: var(--guild-action-secondary-shadow);
    }

    .signature-action:hover:not(:disabled) {
        transform: translateY(-1px);
    }

    .signature-action--primary:hover:not(:disabled) {
        background: var(--guild-action-primary-hover-bg);
        box-shadow: var(--guild-action-primary-hover-shadow);
    }

    .signature-action--secondary:hover:not(:disabled) {
        background: var(--guild-action-secondary-hover-bg);
        box-shadow: var(--guild-action-secondary-hover-shadow);
    }

    .signature-action:disabled {
        cursor: not-allowed;
        opacity: 0.42;
        filter: grayscale(0.65);
        box-shadow: none;
        transform: none;
    }

    .signature-field input:focus-visible,
    .signature-field textarea:focus-visible,
    .signature-action:focus-visible {
        outline: 2px solid var(--guild-brass);
        outline-offset: 2px;
    }

    .signature-dialog-speech :global(.character-speech-bubble) {
        max-width: 100%;
        min-width: 0;
        box-sizing: border-box;
    }

    .signature-dialog-speech :global(.speech-panel) {
        min-width: 0;
    }

    .signature-dialog-speech :global(.speech-message) {
        overflow-wrap: anywhere;
    }

    @media (max-width: 720px) {
        .signature-dialog-overlay {
            padding: 18px 10px 24px;
        }

        .signature-dialog-speech,
        .signature-dialog-speech-top,
        .signature-dialog-speech-bottom {
            justify-content: center;
        }

        .signature-dialog-actions {
            flex-direction: column-reverse;
        }

        .signature-dialog-actions .signature-action {
            width: 100%;
        }
    }
</style>
