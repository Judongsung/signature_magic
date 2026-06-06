<script lang="ts">
    import { APP_PHASES } from '../../../constants/gameConfigs';
    import { DIALOGUE_SCREEN_TEXT } from '../../../constants/uiText';
    import { appStore } from '../../../stores/appStore.svelte';
    import DevPhaseNavigation from '../../dev/DevPhaseNavigation.svelte';
    import CyoaDialogueScript from './CyoaDialogueScript.svelte';

    function continueToCyoa() {
        appStore.setPhase(APP_PHASES.CYOA);
    }
</script>

<main class="dialogue-screen">
    <DevPhaseNavigation />

    <CyoaDialogueScript />

    <div class="actions">
        <button
            type="button"
            class="continue-button"
            onclick={continueToCyoa}
        >
            {DIALOGUE_SCREEN_TEXT.CONTINUE_TO_CYOA}
        </button>
    </div>
</main>

<style>
    .dialogue-screen {
        width: 100%;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 24px;
        padding: 48px 24px;
        box-sizing: border-box;
        background:
            linear-gradient(180deg, rgba(255, 248, 232, 0.82), rgba(232, 218, 190, 0.88)),
            repeating-linear-gradient(90deg, rgba(116, 83, 48, 0.06) 0 1px, transparent 1px 140px),
            linear-gradient(90deg, #efe2c7, #f8efd9 42%, #dfcda8);
    }

    .actions {
        width: min(1080px, 100%);
        display: flex;
        justify-content: flex-end;
        box-sizing: border-box;
    }

    .continue-button {
        min-width: 168px;
        height: 46px;
        border: 1px solid rgba(103, 77, 48, 0.32);
        border-radius: 4px;
        background: linear-gradient(180deg, #6f4d32, #4d3320);
        color: #fff8ec;
        font-family: var(--font-title);
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 10px 22px rgba(86, 61, 35, 0.2);
        transition:
            background 0.16s ease,
            border-color 0.16s ease,
            box-shadow 0.16s ease,
            transform 0.16s ease;
        box-sizing: border-box;
    }

    .continue-button:hover {
        background: linear-gradient(180deg, #805a3a, #5a3b25);
        border-color: rgba(103, 77, 48, 0.56);
        box-shadow: 0 14px 28px rgba(86, 61, 35, 0.26);
        transform: translateY(-1px);
    }

    .continue-button:active {
        transform: translateY(1px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    }

    .continue-button:focus-visible {
        outline: 2px solid #8a5a32;
        outline-offset: 2px;
    }

    @media (max-width: 720px) {
        .dialogue-screen {
            padding: 16px 12px;
            gap: 20px;
        }

        .actions {
            justify-content: stretch;
        }

        .continue-button {
            width: 100%;
        }
    }
</style>
