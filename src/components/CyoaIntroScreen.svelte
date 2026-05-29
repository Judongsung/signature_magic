<script lang="ts">
    import heroImage from '../assets/hero.png';
    import svelteImage from '../assets/svelte.svg';
    import viteImage from '../assets/vite.svg';
    import { APP_PHASES } from '../constants/gameConfigs';
    import cyoaRowsData from '../data/cyoaRows.json';
    import { appStore } from '../stores/appStore.svelte';
    import type {
        CyoaChoiceImageKey,
        CyoaChoiceRowConfig,
        CyoaChoiceRowData,
    } from '../types/cyoa';
    import {
        applyCyoaChoiceActions,
        canContinueCyoa,
        createInitialRowVisibility,
        mapCyoaRows,
        toggleCyoaChoiceSelection,
    } from '../systems/cyoaActions';
    import CyoaChoiceSection from './CyoaChoiceSection.svelte';

    const imageSources: Record<CyoaChoiceImageKey, string> = {
        hero: heroImage,
        svelte: svelteImage,
        vite: viteImage,
    };

    const choiceRows: CyoaChoiceRowData[] = mapCyoaRows(
        cyoaRowsData as CyoaChoiceRowConfig[],
        imageSources
    );

    let visibleRowIds = $state<Record<string, boolean>>(
        createInitialRowVisibility(choiceRows)
    );
    let selectedChoiceIds = $state<Record<string, string[]>>({});

    const canContinue = $derived(
        canContinueCyoa(choiceRows, visibleRowIds, selectedChoiceIds)
    );

    function handleChoiceSelect(row: CyoaChoiceRowData, choiceId: string) {
        const choice = row.choices.find(item => item.id === choiceId);
        if (!choice) return;

        const nextSelectedChoiceIds = toggleCyoaChoiceSelection(row, selectedChoiceIds, choiceId);
        const isSelected = nextSelectedChoiceIds[row.id]?.includes(choiceId) ?? false;
        const nextVisibleRowIds = applyCyoaChoiceActions(choice, visibleRowIds, isSelected);

        visibleRowIds = nextVisibleRowIds;
        selectedChoiceIds = nextSelectedChoiceIds;
    }

    function continueToNodeComposition() {
        if (!canContinue) return;
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

        {#each choiceRows as row (row.id)}
            {#if visibleRowIds[row.id]}
                <CyoaChoiceSection
                    {row}
                    selectedChoiceIds={selectedChoiceIds[row.id]}
                    onSelect={(choiceId) => handleChoiceSelect(row, choiceId)}
                />
            {/if}
        {/each}

        <div class="actions">
            <button
                type="button"
                class="continue-button"
                disabled={!canContinue}
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
            radial-gradient(circle at 50% 0%, rgba(155, 89, 182, 0.18), transparent 34%),
            #050508;
        overflow-y: auto;
    }

    .intro-panel {
        width: min(1040px, 100%);
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .intro-copy {
        max-width: 680px;
    }

    .eyebrow {
        margin: 0 0 10px;
        color: #8d82ff;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 2px;
    }

    h1 {
        margin: 0;
        color: #f6f2ff;
        font-size: 42px;
        line-height: 1.1;
        font-weight: 850;
    }

    .description {
        margin: 14px 0 0;
        color: #b8b5c8;
        font-size: 16px;
        line-height: 1.6;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
    }

    .continue-button {
        min-width: 148px;
        height: 44px;
        border: 1px solid #8d5cff;
        border-radius: 8px;
        background: #7c3cff;
        color: #fff;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        transition:
            background 0.16s ease,
            border-color 0.16s ease,
            box-shadow 0.16s ease,
            transform 0.16s ease;
    }

    .continue-button:hover:not(:disabled) {
        transform: translateY(-1px);
        background: #8f55ff;
        box-shadow: 0 10px 26px rgba(124, 60, 255, 0.28);
    }

    .continue-button:focus-visible {
        outline: 2px solid #d8c6ff;
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
        }

        .continue-button {
            width: 100%;
        }
    }
</style>
