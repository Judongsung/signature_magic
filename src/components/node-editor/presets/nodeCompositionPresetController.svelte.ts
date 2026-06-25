import {
    createMagicGraphPresetOptionValue,
    MAGIC_GRAPH_PRESET_SOURCES,
} from '../../../systems/graph/presets/magicGraphPresets';
import {
    createMagicGraphPresetOptions,
    resolveMagicGraphPresetSelection,
} from '../../../systems/graph/presets/magicGraphPresetOptions';
import {
    deleteStoredMagicGraphPreset,
    loadStoredMagicGraphPresets,
    saveStoredMagicGraphPreset,
} from '../../../systems/graph/presets/magicGraphPresetStorage';
import type { MagicGraphPresetConfig } from '../../../types/magic';

interface NodeCompositionPresetGraph {
    readonly hasUserContent: boolean;
    loadPreset(preset: MagicGraphPresetConfig): void;
    createPresetSnapshot(label: string): MagicGraphPresetConfig | false;
}

interface NodeCompositionPresetControllerOptions {
    builtInPresets: readonly MagicGraphPresetConfig[];
    graph: NodeCompositionPresetGraph;
    loadStoredPresets?: () => MagicGraphPresetConfig[];
    saveStoredPreset?: (preset: MagicGraphPresetConfig) => MagicGraphPresetConfig[];
    deleteStoredPreset?: (presetId: string) => MagicGraphPresetConfig[];
}

const EMPTY_NODE_COMPOSITION_PRESET_GRAPH: NodeCompositionPresetGraph = {
    hasUserContent: false,
    loadPreset: () => {},
    createPresetSnapshot: () => false,
};

export class NodeCompositionPresetController {
    private builtInPresets: readonly MagicGraphPresetConfig[] = [];
    private graph: NodeCompositionPresetGraph = EMPTY_NODE_COMPOSITION_PRESET_GRAPH;
    private readonly saveStoredPreset: (preset: MagicGraphPresetConfig) => MagicGraphPresetConfig[];
    private readonly deleteStoredPreset: (presetId: string) => MagicGraphPresetConfig[];

    readonly initialPresetValue: string;
    userPresets = $state<MagicGraphPresetConfig[]>([]);
    selectedPresetValue = $state('');

    readonly presetOptions = $derived(
        createMagicGraphPresetOptions(this.builtInPresets, this.userPresets)
    );
    readonly presetSelection = $derived(
        resolveMagicGraphPresetSelection(this.presetOptions, this.selectedPresetValue)
    );
    readonly selectedPresetOption = $derived(this.presetSelection.selectedPresetOption);
    readonly selectedPresetIsUser = $derived(this.presetSelection.selectedPresetIsUser);
    readonly canLoadPreset = $derived(Boolean(this.selectedPresetOption));
    readonly canSavePreset = $derived(this.graph.hasUserContent);
    readonly canDeletePreset = $derived(this.selectedPresetIsUser);

    constructor({
        builtInPresets,
        graph,
        loadStoredPresets = loadStoredMagicGraphPresets,
        saveStoredPreset = saveStoredMagicGraphPreset,
        deleteStoredPreset = deleteStoredMagicGraphPreset,
    }: NodeCompositionPresetControllerOptions) {
        this.builtInPresets = builtInPresets;
        this.graph = graph;
        this.saveStoredPreset = saveStoredPreset;
        this.deleteStoredPreset = deleteStoredPreset;
        this.initialPresetValue = builtInPresets[0]
            ? createMagicGraphPresetOptionValue(
                MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN,
                builtInPresets[0].id
            )
            : '';
        this.userPresets = loadStoredPresets();
        this.selectedPresetValue = this.initialPresetValue;
    }

    selectPreset(value: string): void {
        this.selectedPresetValue = value;
    }

    loadSelectedPreset(): boolean {
        if (!this.selectedPresetOption) return false;

        this.graph.loadPreset(this.selectedPresetOption.preset);
        return true;
    }

    saveCurrentPreset(label: string): void {
        if (!this.graph.hasUserContent) return;
        if (!label.trim()) return;

        const preset = this.graph.createPresetSnapshot(label);
        if (!preset) return;

        this.userPresets = this.saveStoredPreset(preset);
        this.selectedPresetValue = createMagicGraphPresetOptionValue(
            MAGIC_GRAPH_PRESET_SOURCES.USER,
            preset.id
        );
    }

    deleteSelectedPreset(): void {
        if (!this.selectedPresetOption || !this.selectedPresetIsUser) return;

        this.userPresets = this.deleteStoredPreset(this.selectedPresetOption.preset.id);
        this.selectedPresetValue = this.initialPresetValue;
    }
}

export function createNodeCompositionPresetController(
    options: NodeCompositionPresetControllerOptions
): NodeCompositionPresetController {
    return new NodeCompositionPresetController(options);
}
