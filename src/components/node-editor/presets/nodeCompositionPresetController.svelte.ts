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
    MAGIC_GRAPH_PRESET_STORAGE_STATUSES,
    saveStoredMagicGraphPreset,
    type MagicGraphPresetStorageResult,
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
    loadStoredPresets?: () => MagicGraphPresetStorageResult;
    saveStoredPreset?: (
        preset: MagicGraphPresetConfig
    ) => MagicGraphPresetStorageResult;
    deleteStoredPreset?: (
        presetId: string
    ) => MagicGraphPresetStorageResult;
}

export const NODE_COMPOSITION_PRESET_STORAGE_OPERATIONS = {
    LOAD: 'load',
    SAVE: 'save',
    DELETE: 'delete',
} as const;

export type NodeCompositionPresetStorageOperation =
    (typeof NODE_COMPOSITION_PRESET_STORAGE_OPERATIONS)[keyof typeof NODE_COMPOSITION_PRESET_STORAGE_OPERATIONS];

export interface NodeCompositionPresetStorageNotice {
    level: 'warning' | 'error';
    operation: NodeCompositionPresetStorageOperation;
}

const EMPTY_NODE_COMPOSITION_PRESET_GRAPH: NodeCompositionPresetGraph = {
    hasUserContent: false,
    loadPreset: () => {},
    createPresetSnapshot: () => false,
};

export class NodeCompositionPresetController {
    private builtInPresets: readonly MagicGraphPresetConfig[] = [];
    private graph: NodeCompositionPresetGraph = EMPTY_NODE_COMPOSITION_PRESET_GRAPH;
    private readonly saveStoredPreset: (
        preset: MagicGraphPresetConfig
    ) => MagicGraphPresetStorageResult;
    private readonly deleteStoredPreset: (
        presetId: string
    ) => MagicGraphPresetStorageResult;

    readonly initialPresetValue: string;
    userPresets = $state<MagicGraphPresetConfig[]>([]);
    selectedPresetValue = $state('');
    storageNotice = $state<NodeCompositionPresetStorageNotice | undefined>(
        undefined
    );

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
        const storedPresets = loadStoredPresets();
        this.userPresets = storedPresets.presets;
        this.storageNotice = createStorageNotice(
            storedPresets,
            NODE_COMPOSITION_PRESET_STORAGE_OPERATIONS.LOAD
        );
        this.selectedPresetValue = this.initialPresetValue;
    }

    selectPreset(value: string): void {
        this.selectedPresetValue = value;
        this.storageNotice = undefined;
    }

    loadSelectedPreset(): boolean {
        if (!this.selectedPresetOption) return false;

        this.graph.loadPreset(this.selectedPresetOption.preset);
        this.storageNotice = undefined;
        return true;
    }

    saveCurrentPreset(label: string): void {
        if (!this.graph.hasUserContent) return;
        if (!label.trim()) return;

        const preset = this.graph.createPresetSnapshot(label);
        if (!preset) return;

        const stored = this.saveStoredPreset(preset);
        this.storageNotice = createStorageNotice(
            stored,
            NODE_COMPOSITION_PRESET_STORAGE_OPERATIONS.SAVE
        );
        if (
            stored.status === MAGIC_GRAPH_PRESET_STORAGE_STATUSES.FAILURE
        ) {
            return;
        }

        this.userPresets = stored.presets;
        this.selectedPresetValue = createMagicGraphPresetOptionValue(
            MAGIC_GRAPH_PRESET_SOURCES.USER,
            preset.id
        );
    }

    deleteSelectedPreset(): void {
        if (!this.selectedPresetOption || !this.selectedPresetIsUser) return;

        const stored = this.deleteStoredPreset(
            this.selectedPresetOption.preset.id
        );
        this.storageNotice = createStorageNotice(
            stored,
            NODE_COMPOSITION_PRESET_STORAGE_OPERATIONS.DELETE
        );
        if (
            stored.status === MAGIC_GRAPH_PRESET_STORAGE_STATUSES.FAILURE
        ) {
            return;
        }

        this.userPresets = stored.presets;
        this.selectedPresetValue = this.initialPresetValue;
    }
}

export function createNodeCompositionPresetController(
    options: NodeCompositionPresetControllerOptions
): NodeCompositionPresetController {
    return new NodeCompositionPresetController(options);
}

function createStorageNotice(
    result: MagicGraphPresetStorageResult,
    operation: NodeCompositionPresetStorageNotice['operation']
): NodeCompositionPresetStorageNotice | undefined {
    if (result.status === MAGIC_GRAPH_PRESET_STORAGE_STATUSES.SUCCESS) {
        return undefined;
    }

    return {
        level: result.status === MAGIC_GRAPH_PRESET_STORAGE_STATUSES.WARNING
            ? 'warning'
            : 'error',
        operation,
    };
}
