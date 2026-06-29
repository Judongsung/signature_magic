import { describe, expect, it } from 'vitest';
import { MAGIC_NODE_KINDS } from '../../../constants/graphConfigs';
import { SYSTEM_MAGIC_NODE_CONFIGS } from '../../../constants/systemMagicNodeConfigs';
import magicGraphPresetsData from '../../../data/magicGraphPresets.json';
import magicTypesData from '../../../data/magicTypes.json';
import type {
    MagicGraphPresetConfig,
    MagicTypeConfig,
} from '../../../types/magic';
import { calculateMagic } from '../calculation/magicCalculator';
import {
    collectMagicGraphPresetReferenceErrors,
    createMagicGraphFromPreset,
    createMagicGraphPresetOption,
    createMagicGraphPresetSnapshot,
    MAGIC_GRAPH_PRESET_SOURCES,
} from './magicGraphPresets';
import {
    deleteStoredMagicGraphPreset,
    loadStoredMagicGraphPresets,
    saveStoredMagicGraphPreset,
} from './magicGraphPresetStorage';

const preset: MagicGraphPresetConfig = {
    id: 'test-preset',
    label: 'Test Preset',
    circles: [{
        id: 'test-circle',
        position: { x: -240, y: -320 },
        width: 480,
        height: 640,
        name: '공격 서클',
        caption: '첫 번째 단계',
    }],
    systemNodePositions: [
        {
            id: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
            position: { x: -120, y: -360 },
        },
        {
            id: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
            position: { x: 80, y: 420 },
        },
    ],
    nodes: [
        {
            id: 'test-ignition',
            magicType: 'ignition',
            circleId: 'test-circle',
            sequenceIndex: 0,
        },
        {
            id: 'test-stream',
            magicType: 'stream',
            circleId: 'test-circle',
            sequenceIndex: 1,
        },
    ],
    edges: [
        {
            id: 'test-source-circle',
            source: SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
            target: 'test-circle',
            sourceHandle: 'output-0',
            targetHandle: 'circle-input',
        },
        {
            id: 'test-circle-output',
            source: 'test-circle',
            target: SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
            sourceHandle: 'circle-output',
            targetHandle: 'input-0',
        },
    ],
};

const magicTypes = magicTypesData as MagicTypeConfig[];

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

describe('magicGraphPresets v3', () => {
    it('restores derived sequence positions and system nodes', () => {
        const graph = createMagicGraphFromPreset(preset, magicTypes);
        const userNodes = graph.nodes.filter(node => node.parentId === 'test-circle');

        expect(graph.nodes.slice(0, 4).map(node => node.id)).toEqual([
            SYSTEM_MAGIC_NODE_CONFIGS.MANA_SOURCE.id,
            SYSTEM_MAGIC_NODE_CONFIGS.FINAL_OUTPUT.id,
            'test-circle',
            'test-ignition',
        ]);
        expect(userNodes.map(node => node.position)).toEqual([
            { x: 32, y: 72 },
            { x: 32, y: 112 },
        ]);
        expect(userNodes[0].data).toMatchObject({
            magicType: 'ignition',
            nodeKind: MAGIC_NODE_KINDS.USER,
            sequenceIndex: 0,
        });
        expect(userNodes.every(node => node.connectable === false)).toBe(true);
        expect(graph.nodes.find(node => node.id === 'test-circle')?.data)
            .toMatchObject({
                name: '공격 서클',
                caption: '첫 번째 단계',
            });
    });

    it('keeps the built-in preset list empty', () => {
        expect(magicGraphPresetsData).toEqual([]);
    });

    it('creates a calculable serial circle using only external stored edges', () => {
        const graph = createMagicGraphFromPreset(preset, magicTypes);
        const result = calculateMagic(graph.nodes, graph.edges, magicTypes);

        expect(graph.edges).toHaveLength(2);
        expect(result.circles).toHaveLength(1);
        expect(result.circles[0].nodes.map(node => node.id)).toEqual([
            'test-ignition',
            'test-stream',
        ]);
    });

    it('snapshots sequence indexes and filters stale internal edges', () => {
        const graph = createMagicGraphFromPreset(preset, magicTypes);
        graph.edges.push({
            id: 'stale-internal',
            source: 'test-ignition',
            target: 'test-stream',
            sourceHandle: 'output-0',
            targetHandle: 'input-0',
        });
        const saved = createMagicGraphPresetSnapshot(
            ' Saved preset ',
            graph,
            () => 'fixed'
        );

        expect(saved && saved.nodes.map(node => node.sequenceIndex)).toEqual([0, 1]);
        expect(saved && saved.nodes.some(node => 'position' in node)).toBe(false);
        expect(saved && saved.circles[0]).toMatchObject({
            name: '공격 서클',
            caption: '첫 번째 단계',
        });
        expect(saved && saved.edges).toEqual(preset.edges);
    });

    it('does not create a user preset without a label or user node', () => {
        expect(createMagicGraphPresetSnapshot('', { nodes: [], edges: [] })).toBe(false);
        expect(createMagicGraphPresetSnapshot('Empty', {
            nodes: createMagicGraphFromPreset(preset).nodes.slice(0, 3),
            edges: [],
        })).toBe(false);
    });

    it('reports unknown, disabled, and broken references', () => {
        const invalidPreset: MagicGraphPresetConfig = {
            ...preset,
            nodes: [
                {
                    id: 'unknown',
                    magicType: 'missing',
                    circleId: 'test-circle',
                    sequenceIndex: 0,
                },
                {
                    id: 'repeat',
                    magicType: 'repeat',
                    circleId: 'test-circle',
                    sequenceIndex: 1,
                },
            ],
            edges: [
                {
                    id: 'bad-source',
                    source: 'missing-source',
                    target: 'test-circle',
                    sourceHandle: 'output-0',
                    targetHandle: 'circle-input',
                },
                {
                    id: 'bad-target',
                    source: 'test-circle',
                    target: 'missing-target',
                    sourceHandle: 'circle-output',
                    targetHandle: 'input-0',
                },
            ],
        };

        expect(collectMagicGraphPresetReferenceErrors(invalidPreset, magicTypes))
            .toContain('Disabled magic graph preset node type: test-preset -> repeat -> repeat');
        expect(collectMagicGraphPresetReferenceErrors(invalidPreset, magicTypes))
            .toContain('Unknown magic graph preset edge source: test-preset -> bad-source -> missing-source');
    });

    it('creates stable option values by preset source', () => {
        expect(createMagicGraphPresetOption(
            preset,
            MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN
        )).toMatchObject({
            value: 'builtIn:test-preset',
            label: 'Test Preset',
        });
    });

    it('saves, loads, and deletes v3 user presets', () => {
        const storage = new MemoryStorage();

        expect(saveStoredMagicGraphPreset(preset, storage)).toEqual([preset]);
        expect(loadStoredMagicGraphPresets(storage)).toEqual([preset]);
        expect(storage.getItem('beautiful-galileo.magicGraphPresets.v3'))
            .toBe(JSON.stringify([preset]));
        expect(deleteStoredMagicGraphPreset(preset.id, storage)).toEqual([]);
    });

    it('ignores v2 and unversioned storage without modifying them', () => {
        const storage = new MemoryStorage();
        storage.setItem(
            'beautiful-galileo.magicGraphPresets.v2',
            JSON.stringify([preset])
        );
        storage.setItem(
            'beautiful-galileo.magicGraphPresets',
            JSON.stringify([preset])
        );

        expect(loadStoredMagicGraphPresets(storage)).toEqual([]);
        expect(storage.getItem('beautiful-galileo.magicGraphPresets.v2'))
            .toBe(JSON.stringify([preset]));
    });

    it('rejects malformed v3 sequences and stored internal edges', () => {
        const storage = new MemoryStorage();
        storage.setItem(
            'beautiful-galileo.magicGraphPresets.v3',
            JSON.stringify([
                {
                    ...preset,
                    nodes: preset.nodes.map((node, index) => ({
                        ...node,
                        sequenceIndex: index + 1,
                    })),
                },
                {
                    ...preset,
                    id: 'internal-edge',
                    edges: [{
                        id: 'internal',
                        source: 'test-ignition',
                        target: 'test-stream',
                        sourceHandle: 'output-0',
                        targetHandle: 'input-0',
                    }],
                },
            ])
        );

        expect(loadStoredMagicGraphPresets(storage)).toEqual([]);
    });

    it('preserves numbered dynamic circle ports through a round trip', () => {
        const dynamic: MagicGraphPresetConfig = {
            ...preset,
            edges: [
                { ...preset.edges[0], targetHandle: 'circle-input-2' },
                { ...preset.edges[1], sourceHandle: 'circle-output-3' },
            ],
        };
        const graph = createMagicGraphFromPreset(dynamic, magicTypes);
        const snapshot = createMagicGraphPresetSnapshot(
            'Dynamic',
            graph,
            () => 'dynamic'
        );

        expect(snapshot && snapshot.edges).toEqual(dynamic.edges);
    });

    it('preserves configurable settings without repeat nodes', () => {
        const configurable: MagicGraphPresetConfig = {
            ...preset,
            nodes: [
                {
                    id: 'custom',
                    magicType: 'custom',
                    circleId: 'test-circle',
                    settings: { displayName: '별빛 핵' },
                    sequenceIndex: 0,
                },
                {
                    id: 'detect',
                    magicType: 'detect',
                    circleId: 'test-circle',
                    settings: { caption: '대상이 움직일 때' },
                    sequenceIndex: 1,
                },
            ],
        };
        const graph = createMagicGraphFromPreset(configurable, magicTypes);
        const snapshot = createMagicGraphPresetSnapshot(
            'Settings',
            graph,
            () => 'settings'
        );

        expect(snapshot && snapshot.nodes.map(node => node.settings)).toEqual([
            { displayName: '별빛 핵' },
            { caption: '대상이 움직일 때' },
        ]);
    });
});
