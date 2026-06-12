<script lang="ts">
    import {
        APP_PHASE_SCREEN_KINDS,
        getAppPhaseConfig,
    } from './constants/appPhaseConfigs';
    import { appStore } from './stores/appStore.svelte';
    import { choiceStore } from './stores/choiceStore.svelte';
    import { graphStore } from './stores/graphStore.svelte';
    import AppPhaseNavigationTabs from './components/app/AppPhaseNavigationTabs.svelte';
    import CyoaRegistrationScreen from './components/cyoa/CyoaRegistrationScreen.svelte';
    import CyoaDialogueScreen from './components/cyoa/dialogue/CyoaDialogueScreen.svelte';
    import NodeCompositionScreen from './components/node-editor/NodeCompositionScreen.svelte';

    $effect(() => {
        graphStore.setExternalStatEffects(choiceStore.statEffects);
    });

    const activePhaseConfig = $derived(getAppPhaseConfig(appStore.phase));
    const dialogueResultContext = $derived(
        activePhaseConfig?.screen === APP_PHASE_SCREEN_KINDS.DIALOGUE
        && activePhaseConfig.usesGraphResultContext
            ? {
                circleCount: graphStore.circles.length,
                totalStats: graphStore.totalStats,
            }
            : undefined
    );
</script>

{#if activePhaseConfig?.screen === APP_PHASE_SCREEN_KINDS.DIALOGUE}
    <CyoaDialogueScreen
        scriptId={activePhaseConfig.dialogueScriptId}
        resultContext={dialogueResultContext}
    />
{:else if activePhaseConfig?.screen === APP_PHASE_SCREEN_KINDS.CYOA}
    <CyoaRegistrationScreen />
{:else if activePhaseConfig?.screen === APP_PHASE_SCREEN_KINDS.NODE_COMPOSITION}
    <NodeCompositionScreen />
{/if}

<AppPhaseNavigationTabs />

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
