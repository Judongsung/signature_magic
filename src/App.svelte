<script lang="ts">
    import {
        APP_PHASE_SCREEN_KINDS,
        getAppPhaseConfig,
    } from './constants/appPhaseConfigs';
    import { appStore } from './stores/appStore.svelte';
    import { choiceStore } from './stores/choiceStore.svelte';
    import { graphStore } from './stores/graphStore.svelte';
    import {
        createNodeCompositionTransitionPlan,
        type DirectAppPhaseTransitionRequest,
        type NodeCompositionTransitionPlan,
    } from './systems/app/appPhaseTransition';
    import AppPhaseNavigationBar from './components/app/AppPhaseNavigationBar.svelte';
    import CyoaRegistrationScreen from './components/cyoa/CyoaRegistrationScreen.svelte';
    import CyoaDialogueScreen from './components/cyoa/dialogue/CyoaDialogueScreen.svelte';
    import NodeCompositionScreen from './components/node-editor/NodeCompositionScreen.svelte';
    import NodeCompositionSignatureDialog from './components/node-editor/transition/NodeCompositionSignatureDialog.svelte';
    import NodeCompositionTransitionOverlay from './components/node-editor/transition/NodeCompositionTransitionOverlay.svelte';
    import {
        type MagicSignatureMetadata,
    } from './types/magicSignature';

    let pendingNodeCompositionTransition = $state<NodeCompositionTransitionPlan | undefined>();
    let nodeCompositionTransition = $state<NodeCompositionTransitionPlan | undefined>();

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

    function handleDirectNextPhaseRequest(request: DirectAppPhaseTransitionRequest): boolean {
        if (pendingNodeCompositionTransition || nodeCompositionTransition) return true;

        const transitionPlan = createNodeCompositionTransitionPlan(request, graphStore.circles);
        if (!transitionPlan) return false;

        pendingNodeCompositionTransition = transitionPlan;
        return true;
    }

    function cancelNodeCompositionSignatureDialog() {
        pendingNodeCompositionTransition = undefined;
    }

    function submitNodeCompositionSignatureDialog(metadata: MagicSignatureMetadata) {
        if (!pendingNodeCompositionTransition) return;

        graphStore.setSignatureMetadata(metadata);
        nodeCompositionTransition = pendingNodeCompositionTransition;
        pendingNodeCompositionTransition = undefined;
    }

    function completeNodeCompositionTransition() {
        const nextPhase = nodeCompositionTransition?.targetPhase;

        nodeCompositionTransition = undefined;

        if (!nextPhase) return;

        appStore.setPhase(nextPhase);
    }
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

{#if pendingNodeCompositionTransition}
    <NodeCompositionSignatureDialog
        onSubmit={submitNodeCompositionSignatureDialog}
        onClose={cancelNodeCompositionSignatureDialog}
    />
{/if}

{#if nodeCompositionTransition}
    <NodeCompositionTransitionOverlay
        circles={nodeCompositionTransition.circles}
        onComplete={completeNodeCompositionTransition}
    />
{/if}

<AppPhaseNavigationBar
    canSubmitRegistration={choiceStore.canSubmitRegistration}
    canCompleteNodeComposition={graphStore.circles.length > 0}
    onDirectNextPhaseRequest={handleDirectNextPhaseRequest}
/>
