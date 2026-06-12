<script lang="ts">
    import veraChibiImageSrc from '../../../assets/images/vera_chibi.png';
    import {
        CYOA_GUIDE_SPEECH_TEXT,
        CYOA_REGISTRATION_SUMMARY_TEXT,
    } from '../../../constants/uiText';
    import { choiceStore } from '../../../stores/choiceStore.svelte';
    import CharacterSpeechBubble from '../../shared/CharacterSpeechBubble.svelte';
    import {
        getDialogFocusTarget,
        restoreDialogTriggerFocus,
        trapDialogFocus,
    } from '../../shared/dialogFocus';
    import CyoaRegistrationSummary from './CyoaRegistrationSummary.svelte';

    const dialogId = $props.id();
    const dialogTitleId = `${dialogId}-registration-summary-title`;

    let {
        onClose,
        onSubmit,
        showSubmitGuidance = false,
    }: {
        onClose: () => void;
        onSubmit?: () => void;
        showSubmitGuidance?: boolean;
    } = $props();

    let dialogElement: HTMLElement;
    let triggerElement: Element | null = null;

    $effect(() => {
        if (!dialogElement) return;

        triggerElement = document.activeElement;
        getDialogFocusTarget(dialogElement).focus();

        return () => {
            restoreDialogTriggerFocus(triggerElement);
        };
    });

    function handleWindowKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape') return;

        event.preventDefault();
        onClose();
    }

    function handleDialogKeydown(event: KeyboardEvent) {
        trapDialogFocus(event, dialogElement);
    }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="summary-dialog-overlay">
    <button
        type="button"
        class="summary-dialog-backdrop"
        aria-label={CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_CLOSE_ARIA_LABEL}
        onclick={onClose}
    ></button>
    <div
        class="summary-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabindex="-1"
        bind:this={dialogElement}
        onkeydown={handleDialogKeydown}
    >
        {#if showSubmitGuidance}
            <div class="dialog-speech dialog-speech-top">
                <CharacterSpeechBubble
                    imageSrc={veraChibiImageSrc}
                    imageAlt={CYOA_GUIDE_SPEECH_TEXT.IMAGE_ALT}
                    message={CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_TOP_MESSAGE}
                />
            </div>
        {/if}

        <CyoaRegistrationSummary
            titleId={dialogTitleId}
            onBack={onClose}
            onSubmit={showSubmitGuidance ? onSubmit : undefined}
            backLabel={showSubmitGuidance
                ? CYOA_REGISTRATION_SUMMARY_TEXT.DEFAULT_BACK_LABEL
                : CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_CLOSE_LABEL}
            submitDisabled={!choiceStore.canContinue}
        >
            {#snippet actionLeadIn()}
                {#if showSubmitGuidance}
                    <div class="dialog-speech dialog-speech-bottom">
                        <CharacterSpeechBubble
                            imageSrc={veraChibiImageSrc}
                            imageAlt={CYOA_GUIDE_SPEECH_TEXT.IMAGE_ALT}
                            message={CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_BOTTOM_MESSAGE}
                        />
                    </div>
                {/if}
            {/snippet}
        </CyoaRegistrationSummary>
    </div>
</div>

<style>
    .summary-dialog-overlay {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 36px 18px 42px;
        overflow: auto;
        box-sizing: border-box;
    }

    .summary-dialog-backdrop {
        position: fixed;
        inset: 0;
        padding: 0;
        border: 0;
        background: rgba(26, 18, 11, 0.72);
        cursor: default;
        backdrop-filter: blur(4px);
    }

    .summary-dialog {
        position: relative;
        z-index: 1;
        width: min(900px, 100%);
        display: flex;
        flex-direction: column;
        gap: 14px;
        outline: none;
    }

    .dialog-speech {
        display: flex;
        width: 100%;
    }

    .dialog-speech-top {
        justify-content: flex-start;
    }

    .dialog-speech-bottom {
        justify-content: flex-end;
    }

    @media (max-width: 720px) {
        .summary-dialog-overlay {
            padding: 18px 10px 24px;
        }

        .dialog-speech,
        .dialog-speech-top,
        .dialog-speech-bottom {
            justify-content: center;
        }
    }
</style>
