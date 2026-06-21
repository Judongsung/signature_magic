<script lang="ts">
    import veraChibiImageSrc from '../../assets/images/vera_chibi.png';
    import {
        CYOA_GUIDE_SPEECH_TEXT,
        CYOA_SCREEN_TEXT,
    } from '../../constants/uiText';
    import { choiceStore } from '../../stores/choiceStore.svelte';
    import type {
        CyoaChoiceRowData,
        CyoaSubChoiceGroupData,
    } from '../../types/cyoa';
    import DevPhaseNavigation from '../dev/DevPhaseNavigation.svelte';
    import CharacterSpeechBubble from '../shared/CharacterSpeechBubble.svelte';
    import CyoaChoiceSection from './choices/CyoaChoiceSection.svelte';

    function handleChoiceSelect(row: CyoaChoiceRowData, choiceId: string) {
        choiceStore.selectChoice(row, choiceId);
    }

    function handleSubChoiceSelect(group: CyoaSubChoiceGroupData, choiceId: string) {
        choiceStore.selectChoice(group, choiceId);
    }

    function handleInputValueChange(inputId: string, value: string) {
        choiceStore.updateInputValue(inputId, value);
    }

</script>

<main class="cyoa-screen">
    <DevPhaseNavigation />

    <section class="registration-panel" aria-labelledby="cyoa-title">
        <div class="registration-copy">
            <p class="eyebrow">{CYOA_SCREEN_TEXT.EYEBROW}</p>
            <h1 id="cyoa-title">{CYOA_SCREEN_TEXT.TITLE}</h1>
        </div>

        <CharacterSpeechBubble
            imageSrc={veraChibiImageSrc}
            imageAlt={CYOA_GUIDE_SPEECH_TEXT.IMAGE_ALT}
            message={CYOA_SCREEN_TEXT.DESCRIPTION}
        />

        {#each choiceStore.rows as row (row.id)}
            {#if choiceStore.visibleRowIds[row.id]}
                <CyoaChoiceSection
                    {row}
                    selectedChoiceIds={choiceStore.selectedChoiceIds[row.id]}
                    allSelectedChoiceIds={choiceStore.selectedChoiceIds}
                    inputValues={choiceStore.inputValues}
                    onSelect={(choiceId) => handleChoiceSelect(row, choiceId)}
                    onSubChoiceSelect={handleSubChoiceSelect}
                    onInputValueChange={handleInputValueChange}
                />
            {/if}
        {/each}
    </section>
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
        padding: 48px 24px 112px;
        box-sizing: border-box;
        background:
            linear-gradient(180deg, rgba(255, 248, 232, 0.82), rgba(232, 218, 190, 0.88)),
            repeating-linear-gradient(90deg, rgba(116, 83, 48, 0.06) 0 1px, transparent 1px 140px),
            linear-gradient(90deg, #efe2c7, #f8efd9 42%, #dfcda8);
    }

    .registration-panel {
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

    .registration-panel::before {
        content: none;
    }

    .registration-copy {
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

    @media (max-width: 720px) {
        .cyoa-screen {
            padding: 16px 12px 96px;
            gap: 20px;
        }

        .registration-panel {
            padding: 24px 20px 20px;
        }

        .registration-panel::before {
            content: none;
        }

        h1 {
            font-size: 30px;
        }

    }
</style>
