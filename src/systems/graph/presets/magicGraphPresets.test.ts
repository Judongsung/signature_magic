import { describe, expect, it } from 'vitest';
import type { Edge } from '@xyflow/svelte';
import { MAGIC_NODE_HANDLE_CONFIG, MAGIC_NODE_KINDS } from '../../../constants/graphConfigs';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import magicGraphPresetsData from '../../../data/magicGraphPresets.json';
import magicTypesData from '../../../data/magicTypes.json';
import type { MagicGraphPresetConfig, MagicNode, MagicTypeConfig } from '../../../types/magic';
import { calculateMagic } from '../calculation/magicCalculator';
import {
    collectMagicGraphPresetReferenceErrors,
    createMagicGraphFromPreset,
    createMagicGraphPresetSnapshot,
    createMagicGraphPresetOption,
    MAGIC_GRAPH_PRESET_SOURCES,
} from './magicGraphPresets';
import {
    deleteStoredMagicGraphPreset,
    loadStoredMagicGraphPresets,
    saveStoredMagicGraphPreset,
} from './magicGraphPresetStorage';

const preset = {
    id: 'test-preset',
    label: 'Test Preset',
    systemNodePositions: [
        { id: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id, position: { x: -120, y: -20 } },
        { id: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id, position: { x: 80, y: -360 } },
    ],
    nodes: [
        { id: 'test-ignition', magicType: 'ignition', position: { x: -40, y: -160 } },
    ],
    edges: [
        {
            id: 'test-source-ignition',
            source: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
            target: 'test-ignition',
            sourceHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
            targetHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID,
        },
        {
            id: 'test-ignition-output',
            source: 'test-ignition',
            target: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
            sourceHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
            targetHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID,
        },
    ],
} satisfies MagicGraphPresetConfig;

const magicTypes = [
    { type: 'ignition', label: 'Ignition', icon: '*', color: '#fff', category: 'basic', description: 'basic' },
] satisfies MagicTypeConfig[];

function userNode(id: string): MagicNode {
    return {
        id,
        type: 'magicNode',
        position: { x: 10, y: 20 },
        data: {
            magicType: 'ignition',
            nodeKind: MAGIC_NODE_KINDS.USER,
            isRoot: true,
            isLeaf: true,
            inputHandleCount: 1,
            outputHandleCount: 1,
        },
    };
}

function edge(id: string, source: string, target: string): Edge {
    return {
        id,
        source,
        target,
        sourceHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
        targetHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID,
    };
}

class MemoryStorage implements Storage {
    private items = new Map<string, string>();

    get length(): number {
        return this.items.size;
    }

    clear(): void {
        this.items.clear();
    }

    getItem(key: string): string | null {
        return this.items.get(key) ?? null;
    }

    key(index: number): string | null {
        return [...this.items.keys()][index] ?? null;
    }

    removeItem(key: string): void {
        this.items.delete(key);
    }

    setItem(key: string, value: string): void {
        this.items.set(key, value);
    }
}

describe('magicGraphPresets', () => {
    it('creates a graph snapshot with restored system nodes', () => {
        const graph = createMagicGraphFromPreset(preset);

        expect(graph.nodes.map(node => node.id)).toEqual([
            SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
            SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
            'test-ignition',
        ]);
        expect(graph.nodes[0].position).toEqual({ x: -120, y: -20 });
        expect(graph.nodes[1].position).toEqual({ x: 80, y: -360 });
        expect(graph.nodes[2].data).toMatchObject({
            magicType: 'ignition',
            nodeKind: MAGIC_NODE_KINDS.USER,
            inputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
            outputHandleCount: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_VISIBLE_COUNT,
        });
        expect(graph.edges).toHaveLength(2);
    });

    it('creates calculable multi-circle graphs from current built-in presets', () => {
        const builtInPresets = magicGraphPresetsData as MagicGraphPresetConfig[];
        expect(builtInPresets.length).toBeGreaterThan(0);

        const circleCounts = builtInPresets.map(builtInPreset => {
            const graph = createMagicGraphFromPreset(builtInPreset as MagicGraphPresetConfig);
            const result = calculateMagic(graph.nodes, graph.edges, magicTypesData as MagicTypeConfig[]);

            return result.circles.length;
        });

        expect(circleCounts.some(count => count > 1)).toBe(true);
    });

    it('creates a user preset snapshot without persisting system nodes', () => {
        const snapshot = {
            nodes: [
                ...createMagicGraphFromPreset(preset).nodes.slice(0, 2),
                userNode('saved-node'),
            ],
            edges: [
                edge('saved-source-node', SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id, 'saved-node'),
                edge('saved-node-output', 'saved-node', SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id),
            ],
        };

        const saved = createMagicGraphPresetSnapshot(' Saved preset ', snapshot, () => 'fixed-id');

        expect(saved).toEqual({
            id: 'user-preset-fixed-id',
            label: 'Saved preset',
            systemNodePositions: [
                { id: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id, position: { x: -120, y: -20 } },
                { id: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id, position: { x: 80, y: -360 } },
            ],
            nodes: [
                { id: 'saved-node', magicType: 'ignition', position: { x: 10, y: 20 } },
            ],
            edges: snapshot.edges.map(item => ({
                id: item.id,
                source: item.source,
                target: item.target,
                sourceHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_OUTPUT_ID,
                targetHandle: MAGIC_NODE_HANDLE_CONFIG.DEFAULT_INPUT_ID,
            })),
        });
    });

    it('does not create a user preset without a label or user node', () => {
        expect(createMagicGraphPresetSnapshot('', { nodes: [], edges: [] })).toBe(false);
        expect(createMagicGraphPresetSnapshot('Empty', {
            nodes: createMagicGraphFromPreset(preset).nodes.slice(0, 2),
            edges: [],
        })).toBe(false);
    });

    it('reports unknown magic types and broken edge endpoints', () => {
        const invalidPreset = {
            ...preset,
            nodes: [
                { id: 'bad-node', magicType: 'missing', position: { x: 0, y: 0 } },
            ],
            edges: [
                { id: 'bad-edge', source: 'missing-source', target: 'bad-node' },
                { id: 'bad-target', source: 'bad-node', target: 'missing-target' },
            ],
        } satisfies MagicGraphPresetConfig;

        expect(collectMagicGraphPresetReferenceErrors(invalidPreset, magicTypes)).toEqual([
            'Unknown magic graph preset node type: test-preset -> bad-node -> missing',
            'Unknown magic graph preset edge source: test-preset -> bad-edge -> missing-source',
            'Unknown magic graph preset edge target: test-preset -> bad-target -> missing-target',
        ]);
    });

    it('creates stable toolbar option values by source', () => {
        expect(createMagicGraphPresetOption(preset, MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN)).toMatchObject({
            value: 'builtIn:test-preset',
            label: 'Test Preset',
            source: MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN,
        });
    });

    it('saves, loads, and deletes user presets through storage', () => {
        const storage = new MemoryStorage();

        expect(loadStoredMagicGraphPresets(storage)).toEqual([]);
        expect(saveStoredMagicGraphPreset(preset, storage)).toEqual([preset]);
        expect(loadStoredMagicGraphPresets(storage)).toEqual([preset]);
        expect(deleteStoredMagicGraphPreset(preset.id, storage)).toEqual([]);
    });

    it('preserves instance settings through graph and storage round trips', () => {
        const configurablePreset: MagicGraphPresetConfig = {
            id: 'custom-settings-preset',
            label: 'Named custom node',
            nodes: [
                {
                    id: 'custom-node',
                    magicType: 'custom',
                    settings: { displayName: '별빛 핵' },
                    position: { x: 0, y: 0 },
                },
                {
                    id: 'detect-node',
                    magicType: 'detect',
                    settings: { caption: '대상이 움직일 때' },
                    position: { x: 40, y: 0 },
                },
                {
                    id: 'ignition-node',
                    magicType: 'ignition',
                    settings: { caption: '불꽃을 일으킨다' },
                    position: { x: 80, y: 0 },
                },
                {
                    id: 'repeat-node',
                    magicType: 'repeat',
                    settings: { repeatCount: '3', caption: '되풀이' },
                    position: { x: 120, y: 0 },
                },
            ],
            edges: [],
        };
        const graph = createMagicGraphFromPreset(
            configurablePreset,
            magicTypesData as MagicTypeConfig[]
        );
        const snapshot = createMagicGraphPresetSnapshot('Saved custom', graph, () => 'settings-id');
        const storage = new MemoryStorage();

        expect(graph.nodes.find(item => item.id === 'custom-node')?.data.settings).toEqual({
            displayName: '별빛 핵',
        });
        expect(graph.nodes.find(item => item.id === 'detect-node')?.data.settings).toEqual({
            caption: '대상이 움직일 때',
        });
        expect(graph.nodes.find(item => item.id === 'ignition-node')?.data.settings).toEqual({
            caption: '불꽃을 일으킨다',
        });
        expect(graph.nodes.find(item => item.id === 'repeat-node')?.data.settings).toEqual({
            repeatCount: '3',
            caption: '되풀이',
        });
        expect(snapshot && snapshot.nodes.map(node => node.settings)).toEqual([
            { displayName: '별빛 핵' },
            { caption: '대상이 움직일 때' },
            { caption: '불꽃을 일으킨다' },
            { repeatCount: '3', caption: '되풀이' },
        ]);
        expect(loadStoredMagicGraphPresets(storage)).toEqual([]);
        expect(saveStoredMagicGraphPreset(configurablePreset, storage)).toEqual([configurablePreset]);
        expect(loadStoredMagicGraphPresets(storage)).toEqual([configurablePreset]);
    });
});
