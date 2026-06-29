import { describe, expect, it, vi } from 'vitest';
import type { MagicGraphPresetConfig } from '../../../types/magic';
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
            loadStoredPresets: () => [userPreset],
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
            loadStoredPresets: () => [userPreset],
        });

        controller.selectPreset('user:user-preset');

        expect(controller.loadSelectedPreset()).toBe(true);
        expect(graph.loadPreset).toHaveBeenCalledWith(userPreset);
    });

    it('saves current graph content and selects the saved user preset', () => {
        const saveStoredPreset = vi.fn(() => [{
            id: 'saved-preset',
            label: 'Saved Preset',
            circles: [],
            nodes: [],
            edges: [],
        } satisfies MagicGraphPresetConfig]);
        const graph = createGraph();
        const controller = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph,
            loadStoredPresets: () => [],
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
            loadStoredPresets: () => [],
            saveStoredPreset,
        });

        controller.saveCurrentPreset('Saved Preset');

        expect(emptyGraph.createPresetSnapshot).not.toHaveBeenCalled();

        const graph = createGraph(true);
        const labelController = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph,
            loadStoredPresets: () => [],
            saveStoredPreset,
        });

        labelController.saveCurrentPreset('   ');

        expect(graph.createPresetSnapshot).not.toHaveBeenCalled();
        expect(saveStoredPreset).not.toHaveBeenCalled();
    });

    it('deletes selected user presets and returns to the initial built-in preset', () => {
        const deleteStoredPreset = vi.fn(() => [] as MagicGraphPresetConfig[]);
        const controller = createNodeCompositionPresetController({
            builtInPresets: [builtInPreset],
            graph: createGraph(),
            loadStoredPresets: () => [userPreset],
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
            loadStoredPresets: () => [userPreset],
            deleteStoredPreset,
        });

        controller.deleteSelectedPreset();

        expect(deleteStoredPreset).not.toHaveBeenCalled();
    });
});
