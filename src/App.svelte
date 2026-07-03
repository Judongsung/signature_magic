<script lang="ts">
    import {
        APP_PHASE_SCREEN_KINDS,
        getAppPhaseConfig,
    } from './constants/appPhaseConfigs';
    import {
        APP_MODES,
        getAppModeConfig,
        type AppMode,
    } from './constants/appModeConfigs';
    import {
        NODE_COMPOSITION_SIGNATURE_PRESENTATIONS,
    } from './constants/nodeEditorConfigs';
    import { appStore } from './stores/appStore.svelte';
    import { choiceStore } from './stores/choiceStore.svelte';
    import { graphStore } from './stores/graphStore.svelte';
    import {
        NODE_COMPOSITION_COMPLETION_PRESENTATIONS,
        createNodeCompositionCompletionPlan,
        type DirectAppPhaseTransitionRequest,
        type NodeCompositionCompletionPlan,
        type NodeCompositionTransitionPlan,
    } from './systems/app/appPhaseTransition';
    import AppPhaseNavigationBar from './components/app/AppPhaseNavigationBar.svelte';
    import AppTitleScreen from './components/app/AppTitleScreen.svelte';
    import CyoaRegistrationScreen from './components/cyoa/CyoaRegistrationScreen.svelte';
    import CyoaDialogueScreen from './components/cyoa/dialogue/CyoaDialogueScreen.svelte';
    import NodeCompositionScreen from './components/node-editor/NodeCompositionScreen.svelte';
    import NodeCompositionSignatureDialog from './components/node-editor/transition/NodeCompositionSignatureDialog.svelte';
    import NodeCompositionTransitionOverlay from './components/node-editor/transition/NodeCompositionTransitionOverlay.svelte';
    import MagicResultDialog from './components/registration/MagicResultDialog.svelte';
    import {
        type MagicSignatureMetadata,
    } from './types/magicSignature';
    import {
        isManaCostWithinMaximum,
    } from './systems/magic/magicMana';
    import {
        createEmptyMagicStatEffectBundle,
    } from './types/magicStatEffects';

    const EMPTY_META_STAT_EFFECTS = createEmptyMagicStatEffectBundle();

    let pendingNodeCompositionCompletion = $state<NodeCompositionCompletionPlan | undefined>();
    let nodeCompositionTransition = $state<NodeCompositionTransitionPlan | undefined>();
    let nodeCompositionSignatureDraft = $state.raw<MagicSignatureMetadata>({
        ...graphStore.signatureMetadata,
    });

    $effect(() => {
        if (!appStore.mode) return;

        const modeConfig = getAppModeConfig(appStore.mode);
        graphStore.setExternalStatEffects(
            modeConfig.usesCyoaStatEffects
                ? choiceStore.statEffects
                : EMPTY_META_STAT_EFFECTS
        );
    });

    $effect(() => {
        nodeCompositionSignatureDraft = {
            ...graphStore.signatureMetadata,
        };
    });

    const activePhaseConfig = $derived(
        appStore.phase ? getAppPhaseConfig(appStore.phase) : undefined
    );
    const activeModeConfig = $derived(
        appStore.mode ? getAppModeConfig(appStore.mode) : undefined
    );
    const isWithinMaximumMana = $derived(
        !activeModeConfig?.enforcesMaximumMana
        || isManaCostWithinMaximum(
            graphStore.totalStats.manaCost,
            choiceStore.maximumMana
        )
    );
    const signaturePresentation = $derived(
        appStore.mode === APP_MODES.META
            ? NODE_COMPOSITION_SIGNATURE_PRESENTATIONS.NEUTRAL
            : NODE_COMPOSITION_SIGNATURE_PRESENTATIONS.GUIDED
    );
    const dialogueResultContext = $derived(
        activePhaseConfig?.screen === APP_PHASE_SCREEN_KINDS.DIALOGUE
        && activePhaseConfig.usesGraphResultContext
            ? {
                circleCount: graphStore.circles.length,
                totalStats: graphStore.totalStats,
            }
            : undefined
    );

    function startAppMode(mode: AppMode): void {
        pendingNodeCompositionCompletion = undefined;
        nodeCompositionTransition = undefined;
        choiceStore.reset();
        graphStore.clear();
        appStore.startMode(mode);
    }

    function handleDirectNextPhaseRequest(request: DirectAppPhaseTransitionRequest): boolean {
        if (pendingNodeCompositionCompletion || nodeCompositionTransition) return true;

        const completionPlan = createNodeCompositionCompletionPlan(
            request,
            graphStore.circles,
            graphStore.terminalCircleId
        );
        if (!completionPlan) return false;

        pendingNodeCompositionCompletion = completionPlan;
        return true;
    }

    function cancelNodeCompositionSignatureDialog() {
        pendingNodeCompositionCompletion = undefined;
    }

    function updateNodeCompositionSignatureDraft(
        metadata: MagicSignatureMetadata
    ) {
        nodeCompositionSignatureDraft = {
            name: metadata.name,
            description: metadata.description,
        };
    }

    function submitNodeCompositionSignatureDialog(metadata: MagicSignatureMetadata) {
        if (!pendingNodeCompositionCompletion) return;

        updateNodeCompositionSignatureDraft(metadata);
        graphStore.setSignatureMetadata(metadata);
        const completionPlan = pendingNodeCompositionCompletion;
        pendingNodeCompositionCompletion = undefined;

        if (
            completionPlan.presentation ===
            NODE_COMPOSITION_COMPLETION_PRESENTATIONS.IMMEDIATE
        ) {
            appStore.setPhase(completionPlan.targetPhase);
            return;
        }

        nodeCompositionTransition = completionPlan;
    }

    function completeNodeCompositionTransition() {
        const nextPhase = nodeCompositionTransition?.targetPhase;

        nodeCompositionTransition = undefined;

        if (!nextPhase) return;

        appStore.setPhase(nextPhase);
    }

    function closeMagicResultDialog() {
        appStore.moveToPreviousPhase();
    }
</script>

{#if !appStore.mode || !activePhaseConfig}
    <AppTitleScreen onSelectMode={startAppMode} />
{:else if activePhaseConfig.screen === APP_PHASE_SCREEN_KINDS.DIALOGUE}
    <CyoaDialogueScreen
        scriptId={activePhaseConfig.dialogueScriptId}
        resultContext={dialogueResultContext}
    />
{:else if activePhaseConfig?.screen === APP_PHASE_SCREEN_KINDS.CYOA}
    <CyoaRegistrationScreen />
{:else if activePhaseConfig.screen === APP_PHASE_SCREEN_KINDS.NODE_COMPOSITION}
    <NodeCompositionScreen />
{:else if activePhaseConfig.screen === APP_PHASE_SCREEN_KINDS.MAGIC_RESULT}
    <NodeCompositionScreen />
{/if}

{#if pendingNodeCompositionCompletion}
    <NodeCompositionSignatureDialog
        initialMetadata={nodeCompositionSignatureDraft}
        presentation={signaturePresentation}
        onDraftChange={updateNodeCompositionSignatureDraft}
        onSubmit={submitNodeCompositionSignatureDialog}
        onClose={cancelNodeCompositionSignatureDialog}
    />
{/if}

{#if activePhaseConfig?.screen === APP_PHASE_SCREEN_KINDS.MAGIC_RESULT}
    <MagicResultDialog onClose={closeMagicResultDialog} />
{/if}

{#if nodeCompositionTransition}
    <NodeCompositionTransitionOverlay
        circles={nodeCompositionTransition.circles}
        terminalCircleId={nodeCompositionTransition.terminalCircleId}
        onComplete={completeNodeCompositionTransition}
    />
{/if}

{#if appStore.mode && activePhaseConfig}
    <AppPhaseNavigationBar
        canSubmitRegistration={choiceStore.canSubmitRegistration}
        canCompleteNodeComposition={graphStore.canCompleteNodeComposition}
        nodeCompositionCompletionIssue={graphStore.completionIssue}
        showMaximumMana={activeModeConfig?.enforcesMaximumMana
            && activePhaseConfig.showsMaximumMana}
        maximumMana={choiceStore.maximumMana}
        manaCost={graphStore.totalStats.manaCost}
        {isWithinMaximumMana}
        onDirectNextPhaseRequest={handleDirectNextPhaseRequest}
    />
{/if}
