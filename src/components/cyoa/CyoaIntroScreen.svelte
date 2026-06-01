<script lang="ts">
    import { APP_PHASES } from '../../constants/gameConfigs';
    import { appStore } from '../../stores/appStore.svelte';
    import { choiceStore } from '../../stores/choiceStore.svelte';
    import type { CyoaChoiceRowData } from '../../types/cyoa';
    import CyoaChoiceSection from './CyoaChoiceSection.svelte';

    function handleChoiceSelect(row: CyoaChoiceRowData, choiceId: string) {
        choiceStore.selectChoice(row, choiceId);
    }

    function handleInputValueChange(inputId: string, value: string) {
        choiceStore.updateInputValue(inputId, value);
    }

    function continueToNodeComposition() {
        if (!choiceStore.canContinue) return;
        appStore.setPhase(APP_PHASES.NODE_COMPOSITION);
    }

    function skipToNodeComposition() {
        appStore.setPhase(APP_PHASES.NODE_COMPOSITION);
    }
</script>

<main class="cyoa-screen">
    <section class="intro-panel" aria-labelledby="cyoa-title">
        <div class="intro-copy">
            <p class="eyebrow">MAGE GUILD REGISTRY</p>
            <h1 id="cyoa-title">마법사 등록 지원서</h1>
            <p class="description">
                길드 입단을 성령으로 선서하기 위해 귀하의 출신 지역과 기틀이 될 비술 촉매를 명부에 작성하십시오.
            </p>
        </div>

        {#each choiceStore.rows as row (row.id)}
            {#if choiceStore.visibleRowIds[row.id]}
                <CyoaChoiceSection
                    {row}
                    selectedChoiceIds={choiceStore.selectedChoiceIds[row.id]}
                    inputValues={choiceStore.inputValues}
                    onSelect={(choiceId) => handleChoiceSelect(row, choiceId)}
                    onInputValueChange={handleInputValueChange}
                />
            {/if}
        {/each}

        <div class="actions">
            {#if import.meta.env.DEV}
                <button
                    type="button"
                    class="dev-skip-button"
                    onclick={skipToNodeComposition}
                >
                    DEV: 비술 조합실
                </button>
            {/if}
            <button
                type="button"
                class="continue-button"
                disabled={!choiceStore.canContinue}
                onclick={continueToNodeComposition}
            >
                등록 신청서 제출
            </button>
        </div>
    </section>
</main>

<style>
    .cyoa-screen {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 48px 24px;
        box-sizing: border-box;
        background: 
            /* Subtle dark wood desk wood ring simulation + vignette */
            radial-gradient(circle at center, rgba(35, 25, 20, 0.4) 0%, rgba(10, 8, 7, 0.98) 100%),
            /* Wood planks stripes */
            repeating-linear-gradient(90deg, rgba(15, 12, 10, 0.4) 0 160px, rgba(5, 4, 3, 0.6) 160px 162px),
            #090807;
        overflow-y: auto;
    }

    .intro-panel {
        width: min(960px, 100%);
        display: flex;
        flex-direction: column;
        gap: 32px;
        padding: 64px 48px;
        background: 
            /* Parchment paper texture simulation */
            radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.2) 0%, rgba(0, 0, 0, 0) 100%),
            linear-gradient(150deg, #fcf8ee 0%, #f5ecd8 60%, #eae0c6 100%);
        box-shadow: var(--paper-shadow);
        border: 1px solid #d6c6a2;
        border-radius: 3px;
        position: relative;
        box-sizing: border-box;
    }

    /* Elegant double brass frame on the guild ledger scroll */
    .intro-panel::before {
        content: '';
        position: absolute;
        top: 14px;
        bottom: 14px;
        left: 14px;
        right: 14px;
        border: 1px solid var(--guild-brass);
        outline: 3px double var(--guild-brass);
        outline-offset: -5px;
        pointer-events: none;
        opacity: 0.65;
    }

    .intro-copy {
        max-width: 720px;
        padding-top: 6px;
        position: relative;
        z-index: 2;
    }

    .eyebrow {
        margin: 0 0 10px;
        color: var(--guild-ink-seal);
        font-family: var(--font-title);
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 4px;
    }

    h1 {
        margin: 0;
        color: var(--guild-ink-black);
        font-family: var(--font-title);
        font-size: 38px;
        line-height: 1.2;
        font-weight: 800;
        letter-spacing: -0.5px;
        border-bottom: 2px solid #dfd1b3;
        padding-bottom: 14px;
        display: inline-block;
        width: 100%;
    }

    .description {
        margin: 16px 0 0;
        color: var(--guild-ink-muted);
        font-family: var(--font-body);
        font-size: 15px;
        line-height: 1.7;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 16px;
        position: relative;
        z-index: 2;
    }

    .continue-button,
    .dev-skip-button {
        min-width: 160px;
        height: 46px;
        border: 1px solid var(--guild-leather);
        border-radius: 2px;
        font-family: var(--font-title);
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.16s ease;
        letter-spacing: 0.5px;
        box-sizing: border-box;
    }

    /* Submit & Register Stamp Button - Dark Red Ink Seal */
    .continue-button {
        background: linear-gradient(180deg, #882222, #661616);
        color: #fcf8ee;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);
    }

    /* Dev Emerald Stamp Button */
    .dev-skip-button {
        background: linear-gradient(180deg, #274940, #172d27);
        color: #e5f5f1;
        border-color: #172d27;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);
    }

    .continue-button:hover:not(:disabled) {
        background: linear-gradient(180deg, #992c2c, #771c1c);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35);
        transform: translateY(-1px);
    }

    .dev-skip-button:hover {
        background: linear-gradient(180deg, #325d52, #203c34);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35);
        transform: translateY(-1px);
    }

    .continue-button:active:not(:disabled),
    .dev-skip-button:active {
        transform: translateY(1px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    }

    .continue-button:focus-visible,
    .dev-skip-button:focus-visible {
        outline: 2px solid var(--guild-brass);
        outline-offset: 2px;
    }

    .continue-button:disabled {
        cursor: not-allowed;
        opacity: 0.4;
        filter: grayscale(0.8);
        box-shadow: none;
    }

    @media (max-width: 720px) {
        .cyoa-screen {
            padding: 16px 12px;
        }

        .intro-panel {
            padding: 40px 24px;
        }

        .intro-panel::before {
            top: 8px;
            bottom: 8px;
            left: 8px;
            right: 8px;
        }

        h1 {
            font-size: 28px;
        }

        .actions {
            justify-content: stretch;
            flex-direction: column;
            gap: 12px;
        }

        .continue-button,
        .dev-skip-button {
            width: 100%;
        }
    }
</style>
