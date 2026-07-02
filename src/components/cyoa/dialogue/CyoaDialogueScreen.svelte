<script lang="ts">
    import dialogueScriptsData from '../../../data/cyoaDialogueScripts.json';
    import { CYOA_DIALOGUE_SCRIPT_IDS, type CyoaDialogueScriptId } from '../../../constants/cyoaConfigs';
    import { mapCyoaDialogueScripts } from '../../../systems/cyoa/cyoaDialogueScripts';
    import { resolveCyoaImagePath } from '../../../systems/cyoa/cyoaImageRegistry';
    import type { CyoaDialogueResultContext, CyoaDialogueScriptConfig } from '../../../types/cyoa';
    import DevPhaseNavigation from '../../dev/DevPhaseNavigation.svelte';
    import CyoaDialogueScript from './CyoaDialogueScript.svelte';

    let {
        scriptId = CYOA_DIALOGUE_SCRIPT_IDS.GUILD_RECEPTION,
        resultContext,
    }: {
        scriptId?: CyoaDialogueScriptId;
        resultContext?: CyoaDialogueResultContext;
    } = $props();

    const dialogueScripts = mapCyoaDialogueScripts(
        dialogueScriptsData as CyoaDialogueScriptConfig[],
        resolveCyoaImagePath
    );
    const dialogueScript = $derived(
        dialogueScripts.find(script => script.id === scriptId) ?? dialogueScripts[0]
    );

</script>

<main class="dialogue-screen">
    <DevPhaseNavigation />

    {#if dialogueScript}
        <CyoaDialogueScript script={dialogueScript} {resultContext} />
    {/if}

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
        padding: 48px 24px 112px;
        box-sizing: border-box;
        background: var(--guild-page-bg);
    }

    @media (max-width: 720px) {
        .dialogue-screen {
            padding: 16px 12px 96px;
            gap: 20px;
        }
    }
</style>
