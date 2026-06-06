<script lang="ts">
    import { APP_PHASES } from './constants/gameConfigs';
    import { appStore } from './stores/appStore.svelte';
    import { choiceStore } from './stores/choiceStore.svelte';
    import { graphStore } from './stores/graphStore.svelte';
    import CyoaRegistrationScreen from './components/cyoa/CyoaRegistrationScreen.svelte';
    import CyoaDialogueScreen from './components/cyoa/dialogue/CyoaDialogueScreen.svelte';
    import NodeCompositionScreen from './components/node-editor/NodeCompositionScreen.svelte';

    $effect(() => {
        graphStore.setExternalStatEffects(choiceStore.statEffects);
    });
</script>

{#if appStore.phase === APP_PHASES.INTRO_DIALOGUE}
    <CyoaDialogueScreen />
{:else if appStore.phase === APP_PHASES.CYOA}
    <CyoaRegistrationScreen />
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
