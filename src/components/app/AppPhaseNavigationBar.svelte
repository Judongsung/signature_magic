<script lang="ts">
    import veraChibiImageSrc from '../../assets/images/vera_chibi.png';
    import {
        APP_PHASE_NAVIGATION_TEXT,
        CYOA_GUIDE_SPEECH_TEXT,
        getAppPhaseNextLabel,
        UI_BUTTON_TEXT,
    } from '../../constants/uiText';
    import { appStore } from '../../stores/appStore.svelte';
    import {
        APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS,
        APP_PHASE_NAVIGATION_NEXT_ACTIONS,
        resolveAppPhaseNavigationPolicy,
    } from '../../systems/app/appPhaseNavigationPolicy';
    import type { DirectAppPhaseTransitionRequest } from '../../systems/app/appPhaseTransition';
    import RegistrationResultDetails from '../registration/RegistrationResultDetails.svelte';
    import RegistrationSummaryDialog from '../registration/RegistrationSummaryDialog.svelte';
    import CharacterSpeechBubble from '../shared/CharacterSpeechBubble.svelte';
    import DescriptionTooltip from '../shared/DescriptionTooltip.svelte';
    import { formatMagicMana } from '../../systems/magic/magicMana';
    import type {
        MagicGraphCompletionIssue,
    } from '../../systems/graph/calculation/magicCalculationTypes';

    const nextDisabledTooltipId = 'app-phase-next-disabled-tooltip';
    const REGISTRATION_DIALOG_MODES = {
        REVIEW: 'review',
        SUBMIT: 'submit',
    } as const;
    type RegistrationDialogMode =
        (typeof REGISTRATION_DIALOG_MODES)[keyof typeof REGISTRATION_DIALOG_MODES];

    let {
        canSubmitRegistration = false,
        canCompleteNodeComposition = false,
        nodeCompositionCompletionIssue,
        showMaximumMana = false,
        maximumMana = 0,
        manaCost = 0,
        isWithinMaximumMana = true,
        onDirectNextPhaseRequest,
    }: {
        canSubmitRegistration?: boolean;
        canCompleteNodeComposition?: boolean;
        nodeCompositionCompletionIssue?: MagicGraphCompletionIssue;
        showMaximumMana?: boolean;
        maximumMana?: number;
        manaCost?: number;
        isWithinMaximumMana?: boolean;
        onDirectNextPhaseRequest?: (request: DirectAppPhaseTransitionRequest) => boolean;
    } = $props();

    let registrationDialogMode = $state<RegistrationDialogMode | undefined>();

    const navigationPolicy = $derived(
        appStore.mode && appStore.phase
            ? resolveAppPhaseNavigationPolicy({
                mode: appStore.mode,
                phase: appStore.phase,
                canSubmitRegistration,
                canCompleteNodeComposition,
                nodeCompositionCompletionIssue,
                isWithinMaximumMana,
            })
            : undefined
    );
    const nextLabel = $derived(
        navigationPolicy?.nextPhase && appStore.mode && appStore.phase
            ? getAppPhaseNextLabel(appStore.mode, appStore.phase)
            : undefined
    );

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
        if (!navigationPolicy || !appStore.phase) return;

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

{#if navigationPolicy?.shouldRenderNavigation}
    <nav
        class="app-phase-navigation-bar"
        class:shows-mana={showMaximumMana}
        aria-label={APP_PHASE_NAVIGATION_TEXT.ARIA_LABEL}
    >
        <button
            type="button"
            class="phase-tab previous-tab"
            aria-label={navigationPolicy.returnsToTitle
                ? APP_PHASE_NAVIGATION_TEXT.TITLE_ARIA_LABEL
                : APP_PHASE_NAVIGATION_TEXT.PREVIOUS_ARIA_LABEL}
            onclick={moveToPreviousPhase}
        >
            {navigationPolicy.returnsToTitle
                ? APP_PHASE_NAVIGATION_TEXT.TITLE_LABEL
                : APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL}
        </button>

        {#if showMaximumMana}
            <div
                class="mana-status"
                class:exceeded={!isWithinMaximumMana}
                role="status"
                aria-live="polite"
                aria-label={APP_PHASE_NAVIGATION_TEXT.MANA_STATUS_ARIA_LABEL}
            >
                <span>{APP_PHASE_NAVIGATION_TEXT.MANA_COST_LABEL} {formatMagicMana(manaCost)}</span>
                <span aria-hidden="true">/</span>
                <span>{APP_PHASE_NAVIGATION_TEXT.MAXIMUM_MANA_LABEL} {formatMagicMana(maximumMana)}</span>
            </div>
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
                        {#if navigationPolicy.nextDisabledFeedback?.presentation === APP_PHASE_NAVIGATION_DISABLED_PRESENTATIONS.CHARACTER_SPEECH}
                            <span
                                id={nextDisabledTooltipId}
                                class="next-disabled-speech-tooltip"
                                role="tooltip"
                            >
                                <CharacterSpeechBubble
                                    imageSrc={veraChibiImageSrc}
                                    imageAlt={CYOA_GUIDE_SPEECH_TEXT.IMAGE_ALT}
                                    message={navigationPolicy.nextDisabledFeedback.message}
                                />
                            </span>
                        {:else if navigationPolicy.nextDisabledFeedback}
                            <DescriptionTooltip
                                id={nextDisabledTooltipId}
                                description={navigationPolicy.nextDisabledFeedback.message}
                            />
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
    .app-phase-navigation-bar {
        position: fixed;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 90;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
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
        grid-column: 3;
        justify-self: end;
        margin-left: auto;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        pointer-events: auto;
    }

    .previous-tab {
        grid-column: 1;
        justify-self: start;
    }

    .mana-status {
        grid-column: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 34px;
        padding: 0 13px;
        border: 1px solid rgba(207, 174, 105, 0.42);
        border-radius: 999px;
        background: rgba(24, 18, 12, 0.72);
        color: #f5ddb0;
        font-size: 12px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
        box-sizing: border-box;
    }

    .mana-status.exceeded {
        border-color: rgba(226, 91, 91, 0.72);
        background: rgba(87, 24, 24, 0.76);
        color: #ffd6d6;
        box-shadow: 0 0 14px rgba(215, 69, 69, 0.22);
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
        border: 1px solid var(--guild-surface-border-hover);
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
        .app-phase-navigation-bar {
            grid-template-columns: auto minmax(0, 1fr);
            gap: 8px;
            padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
        }

        .phase-actions {
            grid-column: 2;
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
            grid-column: 1;
            flex: 0 0 72px;
        }

        .mana-status {
            grid-column: 1 / -1;
            grid-row: 1;
            justify-self: center;
        }

        .shows-mana .previous-tab,
        .shows-mana .phase-actions {
            grid-row: 2;
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
