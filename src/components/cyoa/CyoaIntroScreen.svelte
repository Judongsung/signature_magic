<script lang="ts">
    import { APP_PHASES } from '../../constants/gameConfigs';
    import { appStore } from '../../stores/appStore.svelte';
    import { choiceStore } from '../../stores/choiceStore.svelte';
    import type { CyoaChoiceRowData } from '../../types/cyoa';
    import CyoaDialogueScript from './CyoaDialogueScript.svelte';
    import CyoaChoiceSection from './CyoaChoiceSection.svelte';
    import CyoaRegistrationSummary from './CyoaRegistrationSummary.svelte';

    const REGISTRATION_PREVIEW_ROWS: CyoaChoiceRowData[] = [
        {
            id: 'preview-applicant',
            title: '신청자',
            visible: true,
            selectable: true,
            required: true,
            requiredMode: 'always',
            selectionMode: 'single',
            layoutColumns: 1,
            input: {
                id: 'preview-name',
                label: '성명',
            },
            choices: [],
        },
        {
            id: 'preview-origin',
            title: '출신 지역',
            visible: true,
            selectable: true,
            required: true,
            requiredMode: 'always',
            selectionMode: 'single',
            layoutColumns: 1,
            choices: [
                {
                    id: 'preview-frontier',
                    imageAlt: '',
                    title: '북방 변경',
                    description: '혹한과 긴 밤에 익숙한 변방 출신. 냉각과 생존술에 강한 적성을 보입니다.',
                    layoutSpan: 1,
                },
            ],
        },
        {
            id: 'preview-catalyst',
            title: '비술 촉매',
            visible: true,
            selectable: true,
            required: true,
            requiredMode: 'always',
            selectionMode: 'single',
            layoutColumns: 1,
            choices: [
                {
                    id: 'preview-crystal',
                    imageAlt: '',
                    title: '균열 수정',
                    description: '불안정하지만 높은 출력을 끌어내는 촉매. 반복과 방출 계열 의식에 적합합니다.',
                    layoutSpan: 1,
                },
            ],
        },
        {
            id: 'preview-oath',
            title: '입단 서약',
            visible: true,
            selectable: true,
            required: true,
            requiredMode: 'always',
            selectionMode: 'multi',
            layoutColumns: 1,
            choices: [
                {
                    id: 'preview-oath-study',
                    imageAlt: '',
                    title: '비술 연구 허가',
                    description: '길드의 감시 아래 신규 마법진 조합과 룬 실험을 수행할 수 있습니다.',
                    layoutSpan: 1,
                },
                {
                    id: 'preview-oath-field',
                    imageAlt: '',
                    title: '현장 파견 동의',
                    description: '의뢰와 탐사 임무에서 실전 마법 운용 기록을 제출합니다.',
                    layoutSpan: 1,
                },
            ],
        },
    ];
    const REGISTRATION_PREVIEW_VISIBLE_ROWS = Object.fromEntries(
        REGISTRATION_PREVIEW_ROWS.map(row => [row.id, true])
    );
    const REGISTRATION_PREVIEW_SELECTED_CHOICES = {
        'preview-origin': ['preview-frontier'],
        'preview-catalyst': ['preview-crystal'],
        'preview-oath': ['preview-oath-study', 'preview-oath-field'],
    };
    const REGISTRATION_PREVIEW_INPUT_VALUES = {
        'preview-name': '엘리안 베르딘',
    };

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
    <CyoaDialogueScript />

    <section class="intro-panel" aria-labelledby="cyoa-title">
        <div class="intro-copy">
            <p class="eyebrow">GUILD RECEPTION DESK</p>
            <h1 id="cyoa-title">길드 등록 접수</h1>
            <p class="description">
                업무 시간 내 접수 담당자가 확인할 기본 정보를 순서대로 작성하십시오.
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

    <CyoaRegistrationSummary
        rows={REGISTRATION_PREVIEW_ROWS}
        visibleRowIds={REGISTRATION_PREVIEW_VISIBLE_ROWS}
        selectedChoiceIds={REGISTRATION_PREVIEW_SELECTED_CHOICES}
        inputValues={REGISTRATION_PREVIEW_INPUT_VALUES}
    />
</main>

<style>
    .cyoa-screen {
        width: 100%;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 32px;
        padding: 48px 24px;
        box-sizing: border-box;
        background:
            linear-gradient(180deg, rgba(255, 248, 232, 0.82), rgba(232, 218, 190, 0.88)),
            repeating-linear-gradient(90deg, rgba(116, 83, 48, 0.06) 0 1px, transparent 1px 140px),
            linear-gradient(90deg, #efe2c7, #f8efd9 42%, #dfcda8);
    }

    .intro-panel {
        width: min(1080px, 100%);
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding: 30px;
        border: 1px solid rgba(111, 86, 50, 0.22);
        border-radius: 8px;
        background:
            linear-gradient(180deg, rgba(255, 253, 247, 0.84), rgba(246, 239, 225, 0.92));
        box-shadow:
            0 18px 44px rgba(86, 61, 35, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
        position: relative;
        box-sizing: border-box;
    }

    .intro-panel::before {
        content: none;
    }

    .intro-copy {
        max-width: 760px;
        padding: 0;
        position: relative;
        z-index: 2;
    }

    .eyebrow {
        margin: 0 0 10px;
        color: #7d4d2d;
        font-family: var(--font-title);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 3px;
    }

    h1 {
        margin: 0;
        color: #2f2418;
        font-family: var(--font-title);
        font-size: 38px;
        line-height: 1.2;
        font-weight: 800;
        border-bottom: 0;
        padding-bottom: 0;
    }

    .description {
        margin: 16px 0 0;
        color: #6a5944;
        font-family: var(--font-body);
        font-size: 15px;
        line-height: 1.7;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 4px;
        position: relative;
        z-index: 2;
    }

    .continue-button,
    .dev-skip-button {
        min-width: 160px;
        height: 46px;
        border: 1px solid rgba(103, 77, 48, 0.32);
        border-radius: 4px;
        font-family: var(--font-title);
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        transition:
            background 0.16s ease,
            border-color 0.16s ease,
            box-shadow 0.16s ease,
            transform 0.16s ease;
        letter-spacing: 0.5px;
        box-sizing: border-box;
    }

    .continue-button {
        background: linear-gradient(180deg, #8a5a32, #5f3b20);
        color: #fff7e6;
        box-shadow: 0 8px 18px rgba(80, 52, 27, 0.2);
    }

    .dev-skip-button {
        background: linear-gradient(180deg, #3e6f67, #284c46);
        color: #f1fffb;
        border-color: rgba(43, 94, 84, 0.36);
        box-shadow: 0 8px 18px rgba(35, 73, 67, 0.18);
    }

    .continue-button:hover:not(:disabled) {
        background: linear-gradient(180deg, #9c673a, #704726);
        border-color: rgba(103, 77, 48, 0.58);
        box-shadow: 0 12px 24px rgba(80, 52, 27, 0.28);
        transform: translateY(-1px);
    }

    .dev-skip-button:hover {
        background: linear-gradient(180deg, #4a8278, #315b54);
        border-color: rgba(43, 94, 84, 0.58);
        box-shadow: 0 12px 24px rgba(35, 73, 67, 0.24);
        transform: translateY(-1px);
    }

    .continue-button:active:not(:disabled),
    .dev-skip-button:active {
        transform: translateY(1px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    }

    .continue-button:focus-visible,
    .dev-skip-button:focus-visible {
        outline: 2px solid #8a5a32;
        outline-offset: 2px;
    }

    .continue-button:disabled {
        cursor: not-allowed;
        opacity: 0.4;
        filter: grayscale(0.7);
        box-shadow: none;
    }

    @media (max-width: 720px) {
        .cyoa-screen {
            padding: 16px 12px;
            gap: 20px;
        }

        .intro-panel {
            padding: 24px 20px 20px;
        }

        .intro-panel::before {
            content: none;
        }

        h1 {
            font-size: 30px;
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
