<script lang="ts">
    import { getAppModeConfig } from '../../constants/appModeConfigs';
    import { DEV_PHASE_NAVIGATION_TEXT } from '../../constants/uiText';
    import { appStore } from '../../stores/appStore.svelte';
    import type { AppPhase } from '../../constants/appPhaseConfigs';

    function moveToPhase(phase: AppPhase) {
        appStore.setPhase(phase);
    }

    const phaseOrder = $derived(
        appStore.mode
            ? getAppModeConfig(appStore.mode).phaseOrder
            : []
    );
</script>

{#if import.meta.env.DEV && appStore.mode}
    <nav
        class="dev-phase-navigation"
        aria-label={DEV_PHASE_NAVIGATION_TEXT.ARIA_LABEL}
    >
        {#each phaseOrder as phase}
            <button
                type="button"
                class:active={appStore.phase === phase}
                disabled={appStore.phase === phase}
                onclick={() => moveToPhase(phase)}
            >
                {DEV_PHASE_NAVIGATION_TEXT.PHASE_LABELS[phase]}
            </button>
        {/each}
    </nav>
{/if}

<style>
    .dev-phase-navigation {
        width: min(1080px, 100%);
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        position: relative;
        z-index: 10;
        box-sizing: border-box;
    }

    .dev-phase-navigation button {
        min-width: 104px;
        height: 36px;
        border: 1px solid rgba(43, 94, 84, 0.36);
        border-radius: 4px;
        background: linear-gradient(180deg, #3e6f67, #284c46);
        color: #f1fffb;
        font-family: var(--font-title);
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 8px 18px rgba(35, 73, 67, 0.18);
        transition:
            background 0.16s ease,
            border-color 0.16s ease,
            box-shadow 0.16s ease,
            transform 0.16s ease,
            opacity 0.16s ease;
        box-sizing: border-box;
    }

    .dev-phase-navigation button:hover:not(:disabled) {
        background: linear-gradient(180deg, #4a8278, #315b54);
        border-color: rgba(43, 94, 84, 0.58);
        box-shadow: 0 12px 24px rgba(35, 73, 67, 0.24);
        transform: translateY(-1px);
    }

    .dev-phase-navigation button:active:not(:disabled) {
        transform: translateY(1px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    }

    .dev-phase-navigation button:disabled {
        cursor: default;
        opacity: 0.62;
    }

    .dev-phase-navigation button:focus-visible {
        outline: 2px solid #8a5a32;
        outline-offset: 2px;
    }

    .dev-phase-navigation button.active {
        border-color: rgba(138, 90, 50, 0.58);
    }

    @media (max-width: 720px) {
        .dev-phase-navigation {
            justify-content: stretch;
            flex-direction: column;
            gap: 8px;
        }

        .dev-phase-navigation button {
            width: 100%;
        }
    }
</style>
