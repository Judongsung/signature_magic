<script lang="ts">
    import dialogueScriptsData from '../../../data/cyoaDialogueScripts.json';
    import { mapCyoaDialogueScripts } from '../../../systems/cyoa/cyoaDialogueScripts';
    import { resolveCyoaImagePath } from '../../../systems/cyoa/cyoaImageRegistry';
    import type { CyoaDialogueScriptConfig } from '../../../types/cyoa';
    import CyoaChoiceRow from '../choices/CyoaChoiceRow.svelte';

    const DIALOGUE_SCRIPT = mapCyoaDialogueScripts(
        dialogueScriptsData as CyoaDialogueScriptConfig[],
        resolveCyoaImagePath
    )[0];
    const DIALOGUE_CHOICES = DIALOGUE_SCRIPT.options.map(option => option.choice);

    let selectedOptionId = $state<string | undefined>();
    const selectedOption = $derived(
        DIALOGUE_SCRIPT.options.find(option => option.id === selectedOptionId)
    );
    const npcLine = $derived(
        selectedOption?.npcLine ?? DIALOGUE_SCRIPT.defaultNpcLine
    );

    function selectDialogueOption(choiceId: string) {
        selectedOptionId = selectedOptionId === choiceId ? undefined : choiceId;
    }
</script>

<section class="dialogue-script" aria-labelledby="dialogue-script-title">
    <div class="script-panel">
        <figure class="portrait-frame">
            {#if DIALOGUE_SCRIPT.imageSrc}
                <img src={DIALOGUE_SCRIPT.imageSrc} alt={DIALOGUE_SCRIPT.imageAlt} />
            {/if}
        </figure>

        <div class="script-copy">
            <div class="speaker-row">
                <p class="speaker-name">{DIALOGUE_SCRIPT.npcName}</p>
                <p class="speaker-title">{DIALOGUE_SCRIPT.npcTitle}</p>
            </div>
            <h2 id="dialogue-script-title">{DIALOGUE_SCRIPT.title}</h2>
            <p class="npc-line">{npcLine}</p>
        </div>
    </div>

    <CyoaChoiceRow
        choices={DIALOGUE_CHOICES}
        layoutColumns={3}
        selectedChoiceIds={selectedOptionId ? [selectedOptionId] : []}
        onSelect={selectDialogueOption}
    />
</section>

<style>
    .dialogue-script {
        width: min(1080px, 100%);
        display: flex;
        flex-direction: column;
        gap: 14px;
        box-sizing: border-box;
    }

    .script-panel {
        min-height: 300px;
        display: grid;
        grid-template-columns: minmax(220px, 340px) minmax(0, 1fr);
        gap: 28px;
        padding: 20px;
        border: 1px solid rgba(111, 86, 50, 0.26);
        border-radius: 8px;
        background:
            linear-gradient(180deg, rgba(255, 253, 247, 0.9), rgba(244, 236, 220, 0.96));
        box-shadow:
            0 16px 36px rgba(86, 61, 35, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
    }

    .portrait-frame {
        min-height: 320px;
        margin: 0;
        overflow: hidden;
        border: 1px solid rgba(103, 77, 48, 0.28);
        border-radius: 8px;
        background: rgba(230, 219, 198, 0.72);
        box-shadow: inset 0 0 18px rgba(93, 68, 38, 0.12);
    }

    .portrait-frame img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        filter: saturate(0.88) contrast(1.02) brightness(1.02);
    }

    .script-copy {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 10px 6px 8px 0;
    }

    .speaker-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
    }

    .speaker-name,
    .speaker-title,
    h2,
    .npc-line {
        margin: 0;
    }

    .speaker-name {
        color: #7d4d2d;
        font-family: var(--font-title);
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0.5px;
    }

    .speaker-title {
        color: #7a6a52;
        font-size: 12px;
        font-weight: 700;
    }

    h2 {
        color: #2f2418;
        font-family: var(--font-title);
        font-size: 26px;
        font-weight: 800;
        line-height: 1.25;
    }

    .npc-line {
        max-width: 680px;
        color: #4d3c28;
        font-family: var(--font-body);
        font-size: 18px;
        font-weight: 650;
        line-height: 1.75;
        word-break: keep-all;
    }

    @media (max-width: 720px) {
        .script-panel {
            grid-template-columns: 1fr;
            gap: 18px;
            min-height: 0;
            padding: 16px;
        }

        .portrait-frame {
            min-height: 260px;
        }

        .script-copy {
            padding: 0;
        }

        h2 {
            font-size: 22px;
        }

        .npc-line {
            font-size: 16px;
        }
    }
</style>
