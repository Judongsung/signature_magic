import { describe, expect, it, vi } from 'vitest';
import type { MagicGraphPresetConfig } from '../../../types/magic';
import type {
    MagicGraphPresetStorageResult,
} from '../../../systems/graph/presets/magicGraphPresetStorage';
import {
    createNodeCompositionPresetController,
} from './nodeCompositionPresetController.svelte';

const builtInPreset = {
    id: 'built-in-preset',
    label: 'Built In Preset',
    circles: [],
    nodes: [],
    edges: [],
} satisfies MagicGraphPresetConfig;

const userPreset = {
    id: 'user-preset',
    label: 'User Preset',
    circles: [],
    nodes: [],
    edges: [],
} satisfies MagicGraphPresetConfig;

function storageSuccess(
    presets: MagicGraphPresetConfig[] = []
): MagicGraphPresetStorageResult {
    return { status: 'success', presets, issues: [] };
}

function storageWarning(
    presets: MagicGraphPresetConfig[]
): MagicGraphPresetStorageResult {
    return {
        status: 'warning',
        presets,
        issues: [{ code: 'invalid-presets', invalidPresetCount: 1 }],
    };
}

function storageFailure(
    presets: MagicGraphPresetConfig[] = []
): MagicGraphPresetStorageResult {
    return {
        status: 'failure',
        presets,
        issues: [{ code: 'write-failed' }],
    };
}

function createGraph(hasUserContent = true) {
    return {
        hasUserContent,
        loadPreset: vi.fn<(preset: MagicGraphPresetConfig) => void>(),
        createPresetSnapshot: vi.fn<(label: string) => MagicGraphPresetConfig | false>(() => ({
            id: 'saved-preset',
            label: 'Saved Preset',
            circles: [],
            nodes: [],
            edges: [],
        })),
    };
}

describe('nodeCompositionPresetController', () => {
    it('creates built-in and user preset options in dialog order', () => {
        const controller = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph: createGraph(),
            loadStoredPresets: () => storageSuccess([userPreset]),
        });

        expect(controller.presetOptions.map(option => option.value)).toEqual([
            'builtIn:built-in-preset',
            'user:user-preset',
        ]);
        expect(controller.selectedPresetValue).toBe('builtIn:built-in-preset');
    });

    it('loads the selected preset through the graph adapter', () => {
        const graph = createGraph();
        const controller = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph,
            loadStoredPresets: () => storageSuccess([userPreset]),
        });

        controller.selectPreset('user:user-preset');

        expect(controller.loadSelectedPreset()).toBe(true);
        expect(graph.loadPreset).toHaveBeenCalledWith(userPreset);
    });

    it('saves current graph content and selects the saved user preset', () => {
        const savedPresets = [{
            id: 'saved-preset',
            label: 'Saved Preset',
            circles: [],
            nodes: [],
            edges: [],
        } satisfies MagicGraphPresetConfig];
        const saveStoredPreset = vi.fn(() =>
            storageSuccess(savedPresets)
        );
        const graph = createGraph();
        const controller = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph,
            loadStoredPresets: () => storageSuccess(),
            saveStoredPreset,
        });

        controller.saveCurrentPreset('Saved Preset');

        expect(graph.createPresetSnapshot).toHaveBeenCalledWith('Saved Preset');
        expect(saveStoredPreset).toHaveBeenCalledWith({
            id: 'saved-preset',
            label: 'Saved Preset',
            circles: [],
            nodes: [],
            edges: [],
        });
        expect(controller.userPresets).toEqual([{
            id: 'saved-preset',
            label: 'Saved Preset',
            circles: [],
            nodes: [],
            edges: [],
        }]);
        expect(controller.selectedPresetValue).toBe('user:saved-preset');
    });

    it('does not save without user content or label text', () => {
        const saveStoredPreset = vi.fn();
        const emptyGraph = createGraph(false);
        const controller = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph: emptyGraph,
            loadStoredPresets: () => storageSuccess(),
            saveStoredPreset,
        });

        controller.saveCurrentPreset('Saved Preset');

        expect(emptyGraph.createPresetSnapshot).not.toHaveBeenCalled();

        const graph = createGraph(true);
        const labelController = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph,
            loadStoredPresets: () => storageSuccess(),
            saveStoredPreset,
        });

        labelController.saveCurrentPreset('   ');

        expect(graph.createPresetSnapshot).not.toHaveBeenCalled();
        expect(saveStoredPreset).not.toHaveBeenCalled();
    });

    it('deletes selected user presets and returns to the initial built-in preset', () => {
        const deleteStoredPreset = vi.fn(() => storageSuccess());
        const controller = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph: createGraph(),
            loadStoredPresets: () => storageSuccess([userPreset]),
            deleteStoredPreset,
        });

        controller.selectPreset('user:user-preset');
        controller.deleteSelectedPreset();

        expect(deleteStoredPreset).toHaveBeenCalledWith('user-preset');
        expect(controller.userPresets).toEqual([]);
        expect(controller.selectedPresetValue).toBe('builtIn:built-in-preset');
    });

    it('does not delete built-in preset selections', () => {
        const deleteStoredPreset = vi.fn();
        const controller = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph: createGraph(),
            loadStoredPresets: () => storageSuccess([userPreset]),
            deleteStoredPreset,
        });

        controller.deleteSelectedPreset();

        expect(deleteStoredPreset).not.toHaveBeenCalled();
    });

    it('surfaces partial load warnings while keeping valid presets', () => {
        const controller = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph: createGraph(),
            loadStoredPresets: () => storageWarning([userPreset]),
        });

        expect(controller.userPresets).toEqual([userPreset]);
        expect(controller.storageNotice).toEqual({
            level: 'warning',
            operation: 'load',
        });

        controller.selectPreset('user:user-preset');
        expect(controller.storageNotice).toBeUndefined();
    });

    it('preserves preset state when storage mutations fail', () => {
        const saveStoredPreset = vi.fn(() =>
            storageFailure([userPreset])
        );
        const deleteStoredPreset = vi.fn(() =>
            storageFailure([userPreset])
        );
        const controller = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph: createGraph(),
            loadStoredPresets: () => storageSuccess([userPreset]),
            saveStoredPreset,
            deleteStoredPreset,
        });

        controller.saveCurrentPreset('Saved Preset');

        expect(controller.userPresets).toEqual([userPreset]);
        expect(controller.selectedPresetValue)
            .toBe('builtIn:built-in-preset');
        expect(controller.storageNotice).toEqual({
            level: 'error',
            operation: 'save',
        });

        controller.selectPreset('user:user-preset');
        controller.deleteSelectedPreset();

        expect(controller.userPresets).toEqual([userPreset]);
        expect(controller.selectedPresetValue).toBe('user:user-preset');
        expect(controller.storageNotice).toEqual({
            level: 'error',
            operation: 'delete',
        });
    });
});
