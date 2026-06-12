<script lang="ts">
    import {
        resolveCyoaRowVisibility,
        toggleCyoaChoiceSelection,
    } from '../../../systems/cyoa/cyoaActions';
    import {
        clearCyoaDialogueSelectionsAfterRow,
        resolveSelectedCyoaDialogueOption,
        type CyoaDialogueSelections,
    } from '../../../systems/cyoa/cyoaDialogueScripts';
    import {
        matchesCyoaDialogueResultCondition,
        resolveCyoaDialogueResultLine,
    } from '../../../systems/cyoa/cyoaDialogueResultConditions';
    import { normalizeCyoaDialogueLine } from '../../../systems/cyoa/cyoaDialogueText';
    import {
        CYOA_DIALOGUE_TEXT_VARIANTS,
        type CyoaDialogueTextVariant,
    } from '../../../constants/gameConfigs';
    import type {
        CyoaChoiceRowData,
        CyoaDialogueResultContext,
        CyoaDialogueScriptData,
        CyoaDialogueTextSegment,
    } from '../../../types/cyoa';
    import CyoaChoiceRow from '../choices/CyoaChoiceRow.svelte';

    const NPC_LINE_SEGMENT_CLASS = 'npc-line-segment';
    const NPC_LINE_SEGMENT_VARIANT_CLASSES = {
        [CYOA_DIALOGUE_TEXT_VARIANTS.MUMBLE]: 'npc-line-segment--mumble',
    } satisfies Partial<Record<CyoaDialogueTextVariant, string>>;

    let {
        script,
        resultContext,
    }: {
        script: CyoaDialogueScriptData;
        resultContext?: CyoaDialogueResultContext;
    } = $props();

    let selectedChoiceIds = $state<CyoaDialogueSelections>({});

    const visibleChoiceRowIds = $derived(
        resolveCyoaRowVisibility(script.optionRows, selectedChoiceIds)
    );
    const visibleRowIds = $derived(
        Object.fromEntries(
            script.optionRows.map(row => [
                row.id,
                visibleChoiceRowIds[row.id]
                && matchesCyoaDialogueResultCondition(row.resultWhen, resultContext),
            ])
        )
    );
    const visibleOptionRows = $derived(
        script.optionRows.filter(row => visibleRowIds[row.id])
    );
    const selectedDialogueOption = $derived(
        resolveSelectedCyoaDialogueOption(script, selectedChoiceIds, visibleRowIds)
    );
    const npcLine = $derived(
        selectedDialogueOption?.npcLine
        ?? resolveCyoaDialogueResultLine(script.resultLines, resultContext)?.npcLine
        ?? script.defaultNpcLine
    );
    const npcLineSegments = $derived(normalizeCyoaDialogueLine(npcLine));
    const portraitImageSrc = $derived(
        selectedDialogueOption?.npcImageSrc ?? script.imageSrc
    );
    const portraitImageAlt = $derived(
        selectedDialogueOption?.npcImageAlt ?? script.imageAlt
    );

    function selectDialogueOption(row: CyoaChoiceRowData, choiceId: string) {
        const nextSelectedIds = toggleCyoaChoiceSelection(row, selectedChoiceIds, choiceId);
        selectedChoiceIds = clearCyoaDialogueSelectionsAfterRow(
            script.optionRows,
            nextSelectedIds,
            row.id
        );
    }

    function getNpcLineSegmentClass(segment: CyoaDialogueTextSegment): string {
        const variantClass = segment.variant
            ? NPC_LINE_SEGMENT_VARIANT_CLASSES[segment.variant]
            : undefined;

        return [NPC_LINE_SEGMENT_CLASS, variantClass].filter(Boolean).join(' ');
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
                <p class="speaker-name">{script.npcName}</p>
                <p class="speaker-title">{script.npcTitle}</p>
            </div>
            <h2 id="dialogue-script-title">{script.title}</h2>
            <p class="npc-line">{#each npcLineSegments as segment}<span class={getNpcLineSegmentClass(segment)}>{segment.text}</span>{/each}</p>
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
        align-items: start;
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
        align-self: start;
        margin: 0;
        overflow: hidden;
        border: 1px solid rgba(103, 77, 48, 0.28);
        border-radius: 8px;
        background: rgba(230, 219, 198, 0.72);
        box-shadow: inset 0 0 18px rgba(93, 68, 38, 0.12);
    }

    .portrait-frame img {
        width: 100%;
        height: auto;
        display: block;
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

    .npc-line-segment--mumble {
        color: #756751;
        font-size: 0.78em;
        font-style: italic;
        font-weight: 560;
    }

    @media (max-width: 720px) {
        .script-panel {
            grid-template-columns: 1fr;
            gap: 18px;
            min-height: 0;
            padding: 16px;
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
