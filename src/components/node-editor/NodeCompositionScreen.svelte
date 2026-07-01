<script lang="ts">
    import { SvelteFlowProvider } from '@xyflow/svelte';
    import magicGraphPresetsData from '../../data/magicGraphPresets.json';
    import { MAGIC_CIRCLE_ANIMATION_MODES } from '../../constants/magicCircleConfigs';
    import { graphStore } from '../../stores/graphStore.svelte';
    import { getMagicTypeConfig } from '../../systems/graph/registry/magicTypeRegistry';
    import {
        type MagicCircleMetadata,
    } from '../../systems/graph/magicGraphTypes';
    import {
        type MagicGraphPresetConfig,
    } from '../../systems/graph/presets/magicGraphPresetTypes';
    import {
        type MagicNodeSettings,
    } from '../../types/magicTypeConfig';
    import DevPhaseNavigation from '../dev/DevPhaseNavigation.svelte';
    import MagicCirclePanel from './magic-circle/MagicCirclePanel.svelte';
    import NodeCompositionPaneLayout from './NodeCompositionPaneLayout.svelte';
    import MagicNodeEditor from './editor/MagicNodeEditor.svelte';
    import MagicNodeDetailsDialog from './editor/details/MagicNodeDetailsDialog.svelte';
    import MagicCircleDetailsDialog from './editor/details/MagicCircleDetailsDialog.svelte';
    import MagicCircleDeleteConfirmDialog from './editor/details/MagicCircleDeleteConfirmDialog.svelte';
    import MagicNodePresetDialog from './presets/MagicNodePresetDialog.svelte';
    import {
        createNodeCompositionPresetController,
    } from './presets/nodeCompositionPresetController.svelte';
    import { isMagicCircleNode } from '../../systems/graph/model/magicCircleGraph';

    const builtInPresets = magicGraphPresetsData as MagicGraphPresetConfig[];
    const presetController = createNodeCompositionPresetController({
        builtInPresets,
        graph: graphStore,
    });

    let isPresetDialogOpen = $state(false);
    let activeDetailsId = $state<string | undefined>(undefined);
    let circleDeleteConfirmation = $state.raw<{
        resolve: (confirmed: boolean) => void;
    } | undefined>(undefined);

    const activeDetailsCandidate = $derived(
        graphStore.nodes.find(node => node.id === activeDetailsId)
    );
    const activeNode = $derived(
        activeDetailsCandidate && !isMagicCircleNode(activeDetailsCandidate)
            ? activeDetailsCandidate
            : undefined
    );
    const activeCircle = $derived(
        activeDetailsCandidate && isMagicCircleNode(activeDetailsCandidate)
            ? activeDetailsCandidate
            : undefined
    );
    const activeNodeConfig = $derived(activeNode ? getMagicTypeConfig(activeNode.data.magicType) : undefined);
    const activeCirclePath = $derived(
        activeCircle
            ? graphStore.circles.find(circle => circle.id === activeCircle.id)
            : undefined
    );
    const activeCircleDisplayOrder = $derived(
        activeCircle
            ? graphStore.circleStates.find(state =>
                state.circleId === activeCircle.id
            )?.displayOrder
            : undefined
    );
    const isDialogOpen = $derived(
        isPresetDialogOpen ||
        Boolean(activeNode) ||
        Boolean(activeCircle) ||
        Boolean(circleDeleteConfirmation)
    );

    function openPresetDialog() {
        activeDetailsId = undefined;
        isPresetDialogOpen = true;
    }

    function openNodeDetails(nodeId: string) {
        isPresetDialogOpen = false;
        activeDetailsId = nodeId;
    }

    function closeNodeDetails() {
        activeDetailsId = undefined;
    }

    function saveNodeSettings(settings: MagicNodeSettings | undefined) {
        if (!activeNode) return;

        graphStore.updateNodeSettings(activeNode.id, settings);
        closeNodeDetails();
    }

    function saveCircleMetadata(metadata: MagicCircleMetadata) {
        if (!activeCircle) return;

        graphStore.updateCircleMetadata(activeCircle.id, metadata);
        closeNodeDetails();
    }

    function requestCircleDeleteConfirmation(): Promise<boolean> {
        if (circleDeleteConfirmation) return Promise.resolve(false);

        return new Promise(resolve => {
            circleDeleteConfirmation = { resolve };
        });
    }

    function settleCircleDeleteConfirmation(confirmed: boolean): void {
        const confirmation = circleDeleteConfirmation;
        if (!confirmation) return;

        circleDeleteConfirmation = undefined;
        confirmation.resolve(confirmed);
    }

    function deleteActiveNode(): void {
        if (!activeNode) return;
        if (graphStore.deleteEditorNodeById(activeNode.id)) {
            closeNodeDetails();
        }
    }

    async function deleteActiveCircle(): Promise<void> {
        if (!activeCircle) return;

        const circleId = activeCircle.id;
        activeDetailsId = undefined;
        const confirmed = await requestCircleDeleteConfirmation();
        if (confirmed) {
            graphStore.deleteEditorNodeById(circleId);
            return;
        }

        if (graphStore.nodes.some(node => node.id === circleId)) {
            activeDetailsId = circleId;
        }
    }
</script>

{#snippet editorPane()}
    <SvelteFlowProvider>
        <MagicNodeEditor
            onOpenPresetDialog={openPresetDialog}
            onOpenNodeDetails={openNodeDetails}
            onConfirmCircleDelete={requestCircleDeleteConfirmation}
            interactionBlocked={isDialogOpen}
        />
    </SvelteFlowProvider>
{/snippet}

{#snippet previewPane()}
    <MagicCirclePanel animationMode={MAGIC_CIRCLE_ANIMATION_MODES.STATIC} />
{/snippet}

<main class="node-composition-screen">
    <DevPhaseNavigation />

    <NodeCompositionPaneLayout
        interactionBlocked={isDialogOpen}
        editor={editorPane}
        preview={previewPane}
    />

    {#if isPresetDialogOpen}
        <MagicNodePresetDialog
            presetOptions={presetController.presetOptions}
            selectedPresetValue={presetController.selectedPresetValue}
            canLoadPreset={presetController.canLoadPreset}
            canSavePreset={presetController.canSavePreset}
            canDeletePreset={presetController.canDeletePreset}
            storageNotice={presetController.storageNotice}
            onSelectPreset={(value) => presetController.selectPreset(value)}
            onLoadPreset={() => presetController.loadSelectedPreset()}
            onSavePreset={(label) => presetController.saveCurrentPreset(label)}
            onDeletePreset={() => presetController.deleteSelectedPreset()}
            onClose={() => isPresetDialogOpen = false}
        />
    {/if}

    {#if activeNode && activeNodeConfig}
        <MagicNodeDetailsDialog
            node={activeNode}
            config={activeNodeConfig}
            nodeStatEffects={graphStore.externalStatEffects.nodeEffects}
            onSave={saveNodeSettings}
            onDelete={activeNode.deletable === false
                ? undefined
                : deleteActiveNode}
            onClose={closeNodeDetails}
        />
    {/if}

    {#if activeCircle}
        <MagicCircleDetailsDialog
            circle={activeCircle}
            circlePath={activeCirclePath}
            displayOrder={activeCircleDisplayOrder}
            onSave={saveCircleMetadata}
            onDelete={deleteActiveCircle}
            onClose={closeNodeDetails}
        />
    {/if}

    {#if circleDeleteConfirmation}
        <MagicCircleDeleteConfirmDialog
            onConfirm={() => settleCircleDeleteConfirmation(true)}
            onClose={() => settleCircleDeleteConfirmation(false)}
        />
    {/if}
</main>

<style>
    .node-composition-screen {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-bottom: 68px;
        overflow: hidden;
        background: var(--node-editor-screen-bg);
        box-sizing: border-box;
    }

    .node-composition-screen :global(.dev-phase-navigation) {
        width: 100%;
        max-width: none;
        padding: 8px 12px;
        background: var(--node-editor-panel-bg);
        border-bottom: 1px solid var(--node-editor-border);
        box-shadow: var(--node-editor-toolbar-shadow);
    }
</style>
