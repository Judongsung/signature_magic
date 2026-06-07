<script lang="ts">
    import dialogueScriptsData from '../../../data/cyoaDialogueScripts.json';
    import {
        resolveCyoaRowVisibility,
        toggleCyoaChoiceSelection,
    } from '../../../systems/cyoa/cyoaActions';
    import { mapCyoaDialogueScripts } from '../../../systems/cyoa/cyoaDialogueScripts';
    import { resolveCyoaImagePath } from '../../../systems/cyoa/cyoaImageRegistry';
    import type {
        CyoaChoiceRowData,
        CyoaDialogueOptionData,
        CyoaDialogueScriptConfig,
    } from '../../../types/cyoa';
    import CyoaChoiceRow from '../choices/CyoaChoiceRow.svelte';

    type DialogueSelections = Record<string, string[]>;

    const DIALOGUE_SCRIPT = mapCyoaDialogueScripts(
        dialogueScriptsData as CyoaDialogueScriptConfig[],
        resolveCyoaImagePath
    )[0];

    let selectedChoiceIds = $state<DialogueSelections>({});

    function resolveSelectedDialogueOption(
        rows: CyoaChoiceRowData[],
        selectedIds: DialogueSelections,
        visibleRowIds: Record<string, boolean>
    ): CyoaDialogueOptionData | undefined {
        for (let rowIndex = rows.length - 1; rowIndex >= 0; rowIndex -= 1) {
            const row = rows[rowIndex];
            if (!visibleRowIds[row.id]) continue;

            const selectedId = selectedIds[row.id]?.[0];
            const selectedOption = DIALOGUE_SCRIPT.options.find(option => option.id === selectedId);
            if (selectedOption?.npcLine.trim()) return selectedOption;
        }

        return undefined;
    }

    function clearSelectionsAfterRow(
        selectedIds: DialogueSelections,
        row: CyoaChoiceRowData
    ): DialogueSelections {
        const rowIndex = DIALOGUE_SCRIPT.optionRows.findIndex(item => item.id === row.id);
        const laterRowIds = new Set(
            DIALOGUE_SCRIPT.optionRows.slice(rowIndex + 1).map(item => item.id)
        );

        return Object.fromEntries(
            Object.entries(selectedIds).filter(([rowId]) => !laterRowIds.has(rowId))
        );
    }

    const visibleRowIds = $derived(
        resolveCyoaRowVisibility(DIALOGUE_SCRIPT.optionRows, selectedChoiceIds)
    );
    const visibleOptionRows = $derived(
        DIALOGUE_SCRIPT.optionRows.filter(row => visibleRowIds[row.id])
    );
    const selectedDialogueOption = $derived(
        resolveSelectedDialogueOption(DIALOGUE_SCRIPT.optionRows, selectedChoiceIds, visibleRowIds)
    );
    const npcLine = $derived(
        selectedDialogueOption?.npcLine ?? DIALOGUE_SCRIPT.defaultNpcLine
    );
    const portraitImageSrc = $derived(
        selectedDialogueOption?.npcImageSrc ?? DIALOGUE_SCRIPT.imageSrc
    );
    const portraitImageAlt = $derived(
        selectedDialogueOption?.npcImageAlt ?? DIALOGUE_SCRIPT.imageAlt
    );

    function selectDialogueOption(row: CyoaChoiceRowData, choiceId: string) {
        const nextSelectedIds = toggleCyoaChoiceSelection(row, selectedChoiceIds, choiceId);
        selectedChoiceIds = clearSelectionsAfterRow(nextSelectedIds, row);
    }
</script>

<section class="dialogue-script" aria-labelledby="dialogue-script-title">
    <div class="script-panel">
        <figure class="portrait-frame">
            {#if portraitImageSrc}
                <img src={portraitImageSrc} alt={portraitImageAlt} />
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

    <div class="dialogue-choice-levels">
        {#each visibleOptionRows as row (row.id)}
            <CyoaChoiceRow
                choices={row.choices}
                layoutColumns={row.layoutColumns}
                selectedChoiceIds={selectedChoiceIds[row.id] ?? []}
                onSelect={(choiceId) => selectDialogueOption(row, choiceId)}
            />
        {/each}
    </div>
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

    .dialogue-choice-levels {
        display: flex;
        flex-direction: column;
        gap: 12px;
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
        white-space: pre-line;
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
