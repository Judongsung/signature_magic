<script lang="ts">
    import { APP_PHASES, type AppPhase } from '../../constants/gameConfigs';
    import {
        APP_PHASE_NAVIGATION_TEXT,
        UI_BUTTON_TEXT,
    } from '../../constants/uiText';
    import { appStore } from '../../stores/appStore.svelte';
    import { choiceStore } from '../../stores/choiceStore.svelte';
    import { getNextAppPhase, getPreviousAppPhase } from '../../systems/app/appPhaseNavigation';
    import DescriptionTooltip from '../shared/DescriptionTooltip.svelte';

    const nextDisabledTooltipId = 'app-phase-next-disabled-tooltip';
    const nextPhaseLabels: Partial<Record<AppPhase, string>> = APP_PHASE_NAVIGATION_TEXT.NEXT_LABELS;

    const previousPhase = $derived(getPreviousAppPhase(appStore.phase));
    const nextPhase = $derived(getNextAppPhase(appStore.phase));
    const isCyoaNextDisabled = $derived(
        appStore.phase === APP_PHASES.CYOA && !choiceStore.canContinue
    );
    const nextLabel = $derived(
        nextPhaseLabels[appStore.phase]
    );

    function moveToPreviousPhase() {
        appStore.moveToPreviousPhase();
    }

    function moveToNextPhase() {
        if (isCyoaNextDisabled) return;

        appStore.moveToNextPhase();
    }
</script>

{#if !__NODE_COMPOSITION_ONLY_BUILD__ && (previousPhase || nextPhase)}
    <nav
        class="app-phase-navigation-tabs"
        aria-label={APP_PHASE_NAVIGATION_TEXT.ARIA_LABEL}
    >
        {#if previousPhase}
            <button
                type="button"
                class="phase-tab previous-tab"
                aria-label={APP_PHASE_NAVIGATION_TEXT.PREVIOUS_ARIA_LABEL}
                onclick={moveToPreviousPhase}
            >
                {APP_PHASE_NAVIGATION_TEXT.PREVIOUS_LABEL}
            </button>
        {/if}

        {#if nextPhase && nextLabel}
            <span
                class="next-tab-host"
                class:tooltip-host={isCyoaNextDisabled}
            >
                <button
                    type="button"
                    class="phase-tab next-tab"
                    disabled={isCyoaNextDisabled}
                    aria-label={APP_PHASE_NAVIGATION_TEXT.NEXT_ARIA_LABEL}
                    aria-describedby={isCyoaNextDisabled ? nextDisabledTooltipId : undefined}
                    onclick={moveToNextPhase}
                >
                    {nextLabel}
                </button>
                {#if isCyoaNextDisabled}
                    <DescriptionTooltip
                        id={nextDisabledTooltipId}
                        description={UI_BUTTON_TEXT.COMPLETE_REQUIRED_FIELDS_TOOLTIP}
                    />
                {/if}
            </span>
        {/if}
    </nav>
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

    .next-tab-host {
        position: relative;
        display: inline-flex;
        margin-left: auto;
        pointer-events: auto;
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

    @media (max-width: 720px) {
        .app-phase-navigation-tabs {
            padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
        }

        .next-tab-host,
        .phase-tab {
            min-height: 40px;
        }

        .phase-tab {
            min-width: 104px;
            padding: 0 12px;
            font-size: 12px;
        }
    }
</style>
