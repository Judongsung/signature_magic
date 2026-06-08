<script lang="ts">
    import { APP_PHASES, CYOA_DIALOGUE_SCRIPT_IDS } from './constants/gameConfigs';
    import { appStore } from './stores/appStore.svelte';
    import { choiceStore } from './stores/choiceStore.svelte';
    import { graphStore } from './stores/graphStore.svelte';
    import CyoaRegistrationScreen from './components/cyoa/CyoaRegistrationScreen.svelte';
    import CyoaDialogueScreen from './components/cyoa/dialogue/CyoaDialogueScreen.svelte';
    import NodeCompositionScreen from './components/node-editor/NodeCompositionScreen.svelte';
    import { NODE_INTRO_DIALOGUE_SCREEN_TEXT } from './constants/uiText';

    $effect(() => {
        graphStore.setExternalStatEffects(choiceStore.statEffects);
    });
</script>

{#if appStore.phase === APP_PHASES.INTRO_DIALOGUE}
    <CyoaDialogueScreen />
{:else if appStore.phase === APP_PHASES.CYOA}
    <CyoaRegistrationScreen />
{:else if appStore.phase === APP_PHASES.NODE_INTRO_DIALOGUE}
    <CyoaDialogueScreen
        scriptId={CYOA_DIALOGUE_SCRIPT_IDS.NODE_COMPOSITION_INTRO}
        continueLabel={NODE_INTRO_DIALOGUE_SCREEN_TEXT.CONTINUE_TO_NODE_COMPOSITION}
        nextPhase={APP_PHASES.NODE_COMPOSITION}
    />
{:else if appStore.phase === APP_PHASES.NODE_COMPOSITION}
    <NodeCompositionScreen />
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #000;
        color: #fff;
        overflow: auto;
    }
</style>
