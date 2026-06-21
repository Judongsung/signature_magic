<script lang="ts">
    import veraChibiImageSrc from '../../assets/images/vera_chibi.png';
    import type { AppPhase } from '../../constants/gameConfigs';
    import {
        APP_PHASE_NAVIGATION_TEXT,
        CYOA_GUIDE_SPEECH_TEXT,
        UI_BUTTON_TEXT,
    } from '../../constants/uiText';
    import { appStore } from '../../stores/appStore.svelte';
    import {
        APP_PHASE_NAVIGATION_NEXT_ACTIONS,
        resolveAppPhaseNavigationPolicy,
        resolveRegistrationReviewAccess,
    } from '../../systems/app/appPhaseNavigationPolicy';
    import type { DirectAppPhaseTransitionRequest } from '../../systems/app/appPhaseTransition';
    import RegistrationResultDetails from '../registration/RegistrationResultDetails.svelte';
    import RegistrationSummaryDialog from '../registration/RegistrationSummaryDialog.svelte';
    import CharacterSpeechBubble from '../shared/CharacterSpeechBubble.svelte';

    const nextDisabledTooltipId = 'app-phase-next-disabled-tooltip';
    const nextPhaseLabels: Partial<Record<AppPhase, string>> = APP_PHASE_NAVIGATION_TEXT.NEXT_LABELS;
    const REGISTRATION_DIALOG_MODES = {
        REVIEW: 'review',
        SUBMIT: 'submit',
    } as const;
    type RegistrationDialogMode =
        (typeof REGISTRATION_DIALOG_MODES)[keyof typeof REGISTRATION_DIALOG_MODES];

    let {
        canSubmitRegistration = false,
        onDirectNextPhaseRequest,
    }: {
        canSubmitRegistration?: boolean;
        onDirectNextPhaseRequest?: (request: DirectAppPhaseTransitionRequest) => boolean;
    } = $props();

    let registrationDialogMode = $state<RegistrationDialogMode | undefined>();
    let hasEnteredRegistrationReviewPhase = $state(
        resolveRegistrationReviewAccess(appStore.phase, false)
    );

    const navigationPolicy = $derived(resolveAppPhaseNavigationPolicy({
        phase: appStore.phase,
        canSubmitRegistration,
        hasEnteredRegistrationReviewPhase,
        nodeCompositionOnlyBuild: __NODE_COMPOSITION_ONLY_BUILD__,
    }));
    const nextLabel = $derived(
        navigationPolicy.nextPhase ? nextPhaseLabels[appStore.phase] : undefined
    );

    $effect(() => {
        if (resolveRegistrationReviewAccess(appStore.phase, false)) {
            hasEnteredRegistrationReviewPhase = true;
        }
    });

    function moveToPreviousPhase() {
        appStore.moveToPreviousPhase();
    }

    function openRegistrationReviewDialog() {
        registrationDialogMode = REGISTRATION_DIALOG_MODES.REVIEW;
    }

    function openRegistrationSubmitDialog() {
        registrationDialogMode = REGISTRATION_DIALOG_MODES.SUBMIT;
    }

    function moveToNextPhase() {
        if (navigationPolicy.nextAction === APP_PHASE_NAVIGATION_NEXT_ACTIONS.OPEN_REGISTRATION_SUBMIT_DIALOG) {
            openRegistrationSubmitDialog();
            return;
        }

        if (navigationPolicy.nextAction === APP_PHASE_NAVIGATION_NEXT_ACTIONS.MOVE_TO_NEXT_PHASE) {
            if (!navigationPolicy.nextPhase) return;

            const handled = onDirectNextPhaseRequest?.({
                currentPhase: appStore.phase,
                nextPhase: navigationPolicy.nextPhase,
            });
            if (handled) return;

            appStore.moveToNextPhase();
        }
    }

    function closeRegistrationDialog() {
        registrationDialogMode = undefined;
    }

    function submitRegistrationDialog() {
        registrationDialogMode = undefined;
        appStore.moveToNextPhase();
    }
</script>

{#snippet registrationResultDetails()}
    <RegistrationResultDetails />
{/snippet}

{#if navigationPolicy.shouldRenderNavigation}
    <nav
        class="app-phase-navigation-tabs"
        aria-label={APP_PHASE_NAVIGATION_TEXT.ARIA_LABEL}
    >
        {#if navigationPolicy.previousPhase}
            <button
                type="button"
                class="phase-tab previous-tab"
                aria-label={APP_PHASE_NAVIGATION_TEXT.PREVIOUS_ARIA_LABEL}
                onclick={moveToPreviousPhase}
            >
                {APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL}
            </button>
        {/if}

        {#if navigationPolicy.canReviewRegistration || (navigationPolicy.nextPhase && nextLabel)}
            <div class="phase-actions">
                {#if navigationPolicy.canReviewRegistration}
                    <button
                        type="button"
                        class="phase-tab review-tab"
                        onclick={openRegistrationReviewDialog}
                    >
                        {UI_BUTTON_TEXT.REVIEW_REGISTRATION}
                    </button>
                {/if}

                {#if navigationPolicy.nextPhase && nextLabel}
                    <span
                        class="next-tab-host"
                        class:tooltip-host={navigationPolicy.isNextDisabled}
                    >
                        <button
                            type="button"
                            class="phase-tab next-tab"
                            disabled={navigationPolicy.isNextDisabled}
                            aria-label={APP_PHASE_NAVIGATION_TEXT.NEXT_ARIA_LABEL}
                            aria-describedby={navigationPolicy.isNextDisabled ? nextDisabledTooltipId : undefined}
                            onclick={moveToNextPhase}
                        >
                            {nextLabel}
                        </button>
                        {#if navigationPolicy.isNextDisabled}
                            <span
                                id={nextDisabledTooltipId}
                                class="next-disabled-speech-tooltip"
                                role="tooltip"
                            >
                                <CharacterSpeechBubble
                                    imageSrc={veraChibiImageSrc}
                                    imageAlt={CYOA_GUIDE_SPEECH_TEXT.IMAGE_ALT}
                                    message={UI_BUTTON_TEXT.COMPLETE_REQUIRED_FIELDS_TOOLTIP}
                                />
                            </span>
                        {/if}
                    </span>
                {/if}
            </div>
        {/if}
    </nav>
{/if}

{#if registrationDialogMode}
    <RegistrationSummaryDialog
        onClose={closeRegistrationDialog}
        onSubmit={registrationDialogMode === REGISTRATION_DIALOG_MODES.SUBMIT
            ? submitRegistrationDialog
            : undefined}
        showSubmitGuidance={registrationDialogMode === REGISTRATION_DIALOG_MODES.SUBMIT}
        enableExport={registrationDialogMode === REGISTRATION_DIALOG_MODES.REVIEW}
        supplementalContent={registrationDialogMode === REGISTRATION_DIALOG_MODES.REVIEW
            ? registrationResultDetails
            : undefined}
    />
{/if}

<style>
    .app-phase-navigation-tabs {
        position: fixed;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 90;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 24px calc(12px + env(safe-area-inset-bottom));
        border-top: 1px solid rgba(141, 115, 74, 0.42);
        background:
            linear-gradient(180deg, rgba(30, 24, 18, 0.94), rgba(16, 12, 9, 0.98));
        box-shadow:
            0 -14px 28px rgba(28, 18, 10, 0.22),
            inset 0 1px 0 rgba(255, 248, 232, 0.08);
        box-sizing: border-box;
        backdrop-filter: blur(8px);
    }

    .phase-actions {
        margin-left: auto;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        pointer-events: auto;
    }

    .next-tab-host {
        position: relative;
        display: inline-flex;
        pointer-events: auto;
    }

    .next-disabled-speech-tooltip {
        position: absolute;
        right: 0;
        bottom: calc(100% + 14px);
        width: max-content;
        max-width: min(430px, calc(100vw - 32px));
        opacity: 0;
        pointer-events: none;
        transform: translateY(6px);
        transition:
            opacity 0.14s ease,
            transform 0.14s ease;
        z-index: 100;
    }

    .phase-tab {
        min-width: 116px;
        min-height: 42px;
        padding: 0 16px;
        border: 1px solid rgba(103, 77, 48, 0.36);
        border-radius: 4px;
        background: linear-gradient(180deg, #6f4d32, #4d3320);
        color: #fff8ec;
        font-family: var(--font-title);
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 10px 22px rgba(46, 31, 18, 0.28);
        transition:
            background 0.16s ease,
            border-color 0.16s ease,
            box-shadow 0.16s ease,
            opacity 0.16s ease,
            transform 0.16s ease;
        box-sizing: border-box;
        pointer-events: auto;
    }

    .phase-tab:hover:not(:disabled) {
        background: linear-gradient(180deg, #805a3a, #5a3b25);
        border-color: rgba(103, 77, 48, 0.58);
        box-shadow: 0 14px 28px rgba(46, 31, 18, 0.34);
        transform: translateY(-1px);
    }

    .phase-tab:active:not(:disabled) {
        transform: translateY(1px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    }

    .phase-tab:focus-visible,
    .next-tab-host:focus-visible {
        outline: 2px solid #8a5a32;
        outline-offset: 2px;
    }

    .phase-tab:disabled {
        cursor: not-allowed;
        opacity: 0.42;
        filter: grayscale(0.65);
        box-shadow: none;
        transform: none;
    }

    .next-tab-host.tooltip-host .phase-tab:disabled {
        pointer-events: none;
    }

    .next-tab-host.tooltip-host:hover .next-disabled-speech-tooltip,
    .next-tab-host.tooltip-host:focus-within .next-disabled-speech-tooltip {
        opacity: 1;
        transform: translateY(0);
    }

    @media (max-width: 720px) {
        .app-phase-navigation-tabs {
            gap: 8px;
            padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
        }

        .phase-actions {
            flex: 1;
            gap: 8px;
        }

        .next-tab-host,
        .phase-tab {
            min-height: 40px;
        }

        .phase-tab {
            min-width: 0;
            padding: 0 10px;
            font-size: 12px;
        }

        .previous-tab {
            flex: 0 0 72px;
        }

        .phase-actions .phase-tab {
            width: 100%;
        }

        .next-tab-host {
            flex: 1;
        }

        .next-disabled-speech-tooltip {
            right: 50%;
            max-width: calc(100vw - 24px);
            transform: translate(50%, 6px);
        }

        .next-tab-host.tooltip-host:hover .next-disabled-speech-tooltip,
        .next-tab-host.tooltip-host:focus-within .next-disabled-speech-tooltip {
            transform: translate(50%, 0);
        }

        .review-tab {
            flex: 1;
        }
    }
</style>
