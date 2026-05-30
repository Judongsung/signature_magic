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
            <p class="eyebrow">SIGNATURE MAGIC</p>
            <h1 id="cyoa-title">출발 조건을 선택하세요</h1>
            <p class="description">
                지역과 촉매는 이후 마법 노드 조합의 출발점이 됩니다.
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
                    DEV: 노드 파트
                </button>
            {/if}
            <button
                type="button"
                class="continue-button"
                disabled={!choiceStore.canContinue}
                onclick={continueToNodeComposition}
            >
                조합 시작
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
        padding: 36px;
        box-sizing: border-box;
        background:
            linear-gradient(rgba(6, 10, 8, 0.76), rgba(9, 7, 5, 0.88)),
            repeating-linear-gradient(90deg, rgba(198, 145, 73, 0.05) 0 1px, transparent 1px 13px),
            repeating-linear-gradient(0deg, rgba(52, 83, 65, 0.08) 0 1px, transparent 1px 17px),
            #070907;
        overflow-y: auto;
    }

    .intro-panel {
        width: min(1040px, 100%);
        display: flex;
        flex-direction: column;
        gap: 26px;
        padding-bottom: 36px;
    }

    .intro-copy {
        max-width: 680px;
        padding-top: 10px;
    }

    .eyebrow {
        margin: 0 0 10px;
        color: #c89b54;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 3px;
    }

    h1 {
        margin: 0;
        color: #f2dfb0;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 44px;
        line-height: 1.1;
        font-weight: 800;
        text-shadow: 0 2px 0 #1c1208, 0 0 18px rgba(198, 155, 84, 0.22);
    }

    .description {
        margin: 14px 0 0;
        color: #c8b991;
        font-size: 16px;
        line-height: 1.6;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }

    .continue-button,
    .dev-skip-button {
        min-width: 148px;
        height: 44px;
        border: 1px solid #8d682d;
        border-radius: 8px;
        background:
            linear-gradient(180deg, rgba(157, 113, 44, 0.95), rgba(83, 47, 20, 0.98));
        color: #fff4d2;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        transition:
            background 0.16s ease,
            border-color 0.16s ease,
            box-shadow 0.16s ease,
            transform 0.16s ease;
    }

    .dev-skip-button {
        border-color: #3f6d63;
        background:
            linear-gradient(180deg, rgba(54, 105, 95, 0.95), rgba(20, 54, 49, 0.98));
        color: #d9fff4;
    }

    .continue-button:hover:not(:disabled) {
        transform: translateY(-1px);
        border-color: #c9a45a;
        background:
            linear-gradient(180deg, rgba(184, 136, 52, 0.98), rgba(100, 55, 22, 0.98));
        box-shadow: 0 10px 24px rgba(38, 22, 8, 0.44);
    }

    .dev-skip-button:hover {
        transform: translateY(-1px);
        border-color: #74c7b4;
        background:
            linear-gradient(180deg, rgba(71, 125, 113, 0.98), rgba(24, 65, 58, 0.98));
        box-shadow: 0 10px 24px rgba(8, 38, 31, 0.36);
    }

    .continue-button:focus-visible,
    .dev-skip-button:focus-visible {
        outline: 2px solid #e6c873;
        outline-offset: 3px;
    }

    .continue-button:disabled {
        cursor: not-allowed;
        opacity: 0.45;
    }

    @media (max-width: 720px) {
        .cyoa-screen {
            padding: 24px;
        }

        h1 {
            font-size: 32px;
        }

        .actions {
            justify-content: stretch;
            flex-direction: column;
        }

        .continue-button,
        .dev-skip-button {
            width: 100%;
        }
    }
</style>
