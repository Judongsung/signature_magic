<script lang="ts">
    import type { Snippet } from 'svelte';
    import veraChibiImageSrc from '../../assets/images/vera_chibi.png';
    import {
        CYOA_GUIDE_SPEECH_TEXT,
        CYOA_REGISTRATION_SUMMARY_TEXT,
    } from '../../constants/uiText';
    import { choiceStore } from '../../stores/choiceStore.svelte';
    import { graphStore } from '../../stores/graphStore.svelte';
    import { exportBuildResultImage } from '../../systems/export/buildResultImageExport';
    import { buildMagicGraphResultPreview } from '../../systems/graph/presentation/magicGraphResultPreview';
    import CharacterSpeechBubble from '../shared/CharacterSpeechBubble.svelte';
    import DialogShell from '../shared/DialogShell.svelte';
    import RegistrationSummary from './RegistrationSummary.svelte';

    const dialogId = $props.id();
    const dialogTitleId = `${dialogId}-registration-summary-title`;

    let {
        onClose,
        onSubmit,
        showSubmitGuidance = false,
        supplementalContent,
        enableExport = false,
    }: {
        onClose: () => void;
        onSubmit?: () => void;
        showSubmitGuidance?: boolean;
        supplementalContent?: Snippet;
        enableExport?: boolean;
    } = $props();

    async function exportRegistrationResult(element: HTMLElement) {
        const graphPreview = buildMagicGraphResultPreview(graphStore.nodes, graphStore.edges);
        await exportBuildResultImage(element, graphPreview);
    }
</script>

<DialogShell
    titleId={dialogTitleId}
    closeLabel={CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_CLOSE_ARIA_LABEL}
    {onClose}
    overlayClass="summary-dialog-overlay"
    backdropClass="summary-dialog-backdrop"
    surfaceClass="summary-dialog"
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

    <RegistrationSummary
        titleId={dialogTitleId}
        onBack={onClose}
        onSubmit={showSubmitGuidance ? onSubmit : undefined}
        onExport={enableExport ? exportRegistrationResult : undefined}
        backLabel={showSubmitGuidance
            ? CYOA_REGISTRATION_SUMMARY_TEXT.DEFAULT_BACK_LABEL
            : CYOA_REGISTRATION_SUMMARY_TEXT.DIALOG_CLOSE_LABEL}
        submitDisabled={!choiceStore.canSubmitRegistration}
        {supplementalContent}
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
    </RegistrationSummary>
</DialogShell>

<style>
    :global(.summary-dialog-overlay) {
        z-index: 120;
        align-items: flex-start;
        padding: 36px 18px 42px;
        overflow: auto;
    }

    :global(.summary-dialog-backdrop) {
        background: rgba(26, 18, 11, 0.72);
        backdrop-filter: blur(4px);
    }

    :global(.summary-dialog) {
        width: min(900px, 100%);
        display: flex;
        flex-direction: column;
        gap: 14px;
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
        :global(.summary-dialog-overlay) {
            padding: 18px 10px 24px;
        }

        .dialog-speech,
        .dialog-speech-top,
        .dialog-speech-bottom {
            justify-content: center;
        }
    }
</style>
