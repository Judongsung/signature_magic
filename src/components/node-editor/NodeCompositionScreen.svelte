<script lang="ts">
    import { SvelteFlowProvider } from '@xyflow/svelte';
    import magicGraphPresetsData from '../../data/magicGraphPresets.json';
    import { MAGIC_CIRCLE_ANIMATION_MODES } from '../../constants/magicCircleConfigs';
    import { graphStore } from '../../stores/graphStore.svelte';
    import { getMagicTypeConfig } from '../../systems/graph/registry/magicTypeRegistry';
    import type { MagicGraphPresetConfig, MagicNodeSettings } from '../../types/magic';
    import DevPhaseNavigation from '../dev/DevPhaseNavigation.svelte';
    import MagicCirclePanel from './magic-circle/MagicCirclePanel.svelte';
    import NodeCompositionPaneLayout from './NodeCompositionPaneLayout.svelte';
    import MagicNodeEditor from './editor/MagicNodeEditor.svelte';
    import MagicNodeDetailsDialog from './editor/MagicNodeDetailsDialog.svelte';
    import MagicNodePresetDialog from './presets/MagicNodePresetDialog.svelte';
    import {
        createNodeCompositionPresetController,
    } from './presets/nodeCompositionPresetController.svelte';

    const builtInPresets = magicGraphPresetsData as MagicGraphPresetConfig[];
    const presetController = createNodeCompositionPresetController({
        builtInPresets,
        graph: graphStore,
    });

    let isPresetDialogOpen = $state(false);
    let activeNodeId = $state<string | undefined>(undefined);

    const activeNode = $derived(graphStore.nodes.find(node => node.id === activeNodeId));
    const activeNodeConfig = $derived(activeNode ? getMagicTypeConfig(activeNode.data.magicType) : undefined);
    const isDialogOpen = $derived(isPresetDialogOpen || Boolean(activeNode));

    function openPresetDialog() {
        activeNodeId = undefined;
        isPresetDialogOpen = true;
    }

    function openNodeDetails(nodeId: string) {
        isPresetDialogOpen = false;
        activeNodeId = nodeId;
    }

    function closeNodeDetails() {
        activeNodeId = undefined;
    }

    function saveNodeSettings(settings: MagicNodeSettings | undefined) {
        if (!activeNode) return;

        graphStore.updateNodeSettings(activeNode.id, settings);
        closeNodeDetails();
    }
</script>

{#snippet editorPane()}
    <SvelteFlowProvider>
        <MagicNodeEditor
            onOpenPresetDialog={openPresetDialog}
            onOpenNodeDetails={openNodeDetails}
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
            onClose={closeNodeDetails}
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
