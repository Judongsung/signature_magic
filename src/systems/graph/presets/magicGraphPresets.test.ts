import { describe, expect, it } from 'vitest';
import {
    MAGIC_CIRCLE_HANDLE_IDS,
    MAGIC_CONTROL_PAIR_ROLES,
    MAGIC_NODE_KINDS,
} from '../../../constants/graphConfigs';
import { CIRCLE_SYSTEM_MAGIC_NODE_TYPES } from '../../../constants/circleSystemMagicNodeConfigs';
import magicGraphPresetsData from '../../../data/magicGraphPresets.json';
import magicTypesData from '../../../data/magicTypes.json';
import {
    type MagicGraphPresetConfig,
} from './magicGraphPresetTypes';
import {
    type MagicTypeConfig,
} from '../../../types/magicTypeConfig';
import { calculateMagic } from '../calculation/magicCalculator';
import {
    createMagicGraphFromPreset,
    createMagicGraphPresetOption,
    createMagicGraphPresetSnapshot,
    MAGIC_GRAPH_PRESET_SOURCES,
} from './magicGraphPresets';
import { isCircleSystemMagicNode } from '../model/circleSystemMagicNodes';
import {
    isMagicCircleConnectionJoinNode,
    resolveMagicCircleConnectionJoinSlotIndex,
} from '../model/magicCircleConnectionNodes';
import {
    MAGIC_GRAPH_PRESET_STORAGE_CONFIG,
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
        systemNodeSlots: [{
            magicType: CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
            slotIndex: 2,
        }],
        name: '공격 서클',
        caption: '첫 번째 단계',
    }],
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
    edges: [],
};

const pairedPreset: MagicGraphPresetConfig = {
    ...preset,
    id: 'paired-preset',
    nodes: [
        {
            id: 'repeat-start',
            magicType: 'repeat',
            settings: { repeatCount: '3', caption: '세 번' },
            circleId: 'test-circle',
            sequenceIndex: 0,
            controlPair: {
                id: 'repeat-pair',
                role: MAGIC_CONTROL_PAIR_ROLES.START,
            },
        },
        {
            id: 'repeat-content',
            magicType: 'ignition',
            circleId: 'test-circle',
            sequenceIndex: 1,
        },
        {
            id: 'repeat-end',
            magicType: 'repeat',
            circleId: 'test-circle',
            sequenceIndex: 2,
            controlPair: {
                id: 'repeat-pair',
                role: MAGIC_CONTROL_PAIR_ROLES.END,
            },
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

describe('magicGraphPresets', () => {
    it('restores sequence positions with one circle-owned manifestation', () => {
        const graph = createMagicGraphFromPreset(preset, magicTypes);
        const childNodes = graph.nodes.filter(node =>
            node.parentId === 'test-circle'
        );
        const editableNodes = childNodes.filter(node =>
            !isCircleSystemMagicNode(node)
        );

        expect(graph.nodes.map(node => node.id)).toEqual([
            'test-circle',
            'test-ignition',
            'test-stream',
            'test-circle-manifestation',
        ]);
        expect(childNodes.map(node => node.position)).toEqual([
            { x: 40, y: 80 },
            { x: 40, y: 120 },
            { x: 40, y: 160 },
        ]);
        expect(editableNodes[0].data).toMatchObject({
            magicType: 'ignition',
            nodeKind: MAGIC_NODE_KINDS.USER,
            sequenceIndex: 0,
        });
        expect(childNodes[2].data).toMatchObject({
            magicType: 'manifestation',
            nodeKind: MAGIC_NODE_KINDS.SYSTEM,
            excludeFromStatScaling: true,
        });
        expect(graph.nodes[0].data).toMatchObject({
            name: '공격 서클',
            caption: '첫 번째 단계',
        });
    });

    it('exposes built-in preset data as a list', () => {
        expect(Array.isArray(magicGraphPresetsData)).toBe(true);
        expect(magicGraphPresetsData.every(item =>
            typeof item.id === 'string' &&
            typeof item.label === 'string'
        )).toBe(true);
    });

    it('calculates an isolated serial circle without stored edges', () => {
        const graph = createMagicGraphFromPreset(preset, magicTypes);
        const result = calculateMagic(graph.nodes, graph.edges, magicTypes);

        expect(graph.edges).toEqual([]);
        expect(result.circles).toHaveLength(1);
        expect(result.circles[0].nodes.map(node => node.id)).toEqual([
            'test-ignition',
            'test-stream',
        ]);
    });

    it('round-trips control pair metadata and start-only settings', () => {
        const graph = createMagicGraphFromPreset(pairedPreset, magicTypes);
        const end = graph.nodes.find(node => node.id === 'repeat-end')!;
        const saved = createMagicGraphPresetSnapshot(
            ' Paired ',
            graph,
            () => 'fixed'
        );

        expect(end.data).toMatchObject({
            controlPair: {
                id: 'repeat-pair',
                role: MAGIC_CONTROL_PAIR_ROLES.END,
            },
            excludeFromStatScaling: true,
        });
        expect(saved && saved.nodes).toEqual(pairedPreset.nodes);
        expect(saved && saved.circles[0].systemNodeSlots)
            .toEqual(pairedPreset.circles[0].systemNodeSlots);
        expect(saved).not.toHaveProperty('systemNodePositions');
    });

    it('keeps valid weights and removes weights from extension presets', () => {
        const weightedPreset: MagicGraphPresetConfig = {
            ...preset,
            nodes: [
                {
                    ...preset.nodes[0],
                    settings: { weight: '3' },
                },
                {
                    ...preset.nodes[1],
                    magicType: 'detect',
                    settings: { weight: '7' },
                },
            ],
        };
        const graph = createMagicGraphFromPreset(weightedPreset, magicTypes);

        expect(graph.nodes.find(node => node.id === 'test-ignition')
            ?.data.settings).toEqual({ weight: '3' });
        expect(graph.nodes.find(node => node.id === 'test-stream')
            ?.data.settings).toBeUndefined();
    });

    it('round-trips manifestation captions through circle system slots', () => {
        const captionedPreset: MagicGraphPresetConfig = {
            ...preset,
            circles: [{
                ...preset.circles[0],
                systemNodeSlots: [{
                    ...preset.circles[0].systemNodeSlots[0],
                    settings: { caption: '최종 발현' },
                }],
            }],
        };
        const graph = createMagicGraphFromPreset(
            captionedPreset,
            magicTypes
        );
        const manifestation = graph.nodes.find(node =>
            isCircleSystemMagicNode(node)
        );
        const saved = createMagicGraphPresetSnapshot(
            'Captioned',
            graph,
            () => 'captioned'
        );

        expect(manifestation?.data.settings).toEqual({
            caption: '최종 발현',
        });
        expect(saved && saved.circles[0].systemNodeSlots[0].settings)
            .toEqual({ caption: '최종 발현' });
    });

    it('filters stale internal edges from snapshots', () => {
        const graph = createMagicGraphFromPreset(preset, magicTypes);
        graph.edges.push({
            id: 'stale-internal',
            source: 'test-ignition',
            target: 'test-stream',
            sourceHandle: 'output-0',
            targetHandle: 'input-0',
        });
        const saved = createMagicGraphPresetSnapshot(
            'Saved preset',
            graph,
            () => 'fixed'
        );

        expect(saved && saved.nodes.map(node => node.sequenceIndex))
            .toEqual([0, 1]);
        expect(saved && saved.edges).toEqual([]);
    });

    it('round-trips a connection join display slot through its edge', () => {
        const connectedPreset: MagicGraphPresetConfig = {
            ...preset,
            id: 'connected-preset',
            circles: [
                preset.circles[0],
                {
                    id: 'target-circle',
                    position: { x: 320, y: -320 },
                    width: 480,
                    height: 640,
                    systemNodeSlots: [{
                        magicType:
                            CIRCLE_SYSTEM_MAGIC_NODE_TYPES.MANIFESTATION,
                        slotIndex: 2,
                    }],
                },
            ],
            nodes: [
                ...preset.nodes,
                {
                    id: 'target-first',
                    magicType: 'cooling',
                    circleId: 'target-circle',
                    sequenceIndex: 0,
                },
                {
                    id: 'target-second',
                    magicType: 'stream',
                    circleId: 'target-circle',
                    sequenceIndex: 1,
                },
            ],
            edges: [{
                id: 'edge-connected',
                source: 'test-circle',
                target: 'target-circle',
                sourceHandle: MAGIC_CIRCLE_HANDLE_IDS.OUTPUT,
                targetHandle: MAGIC_CIRCLE_HANDLE_IDS.INPUT,
                joinSlotIndex: 1,
            }],
        };
        const graph = createMagicGraphFromPreset(
            connectedPreset,
            magicTypes
        );
        const join = graph.nodes.find(
            isMagicCircleConnectionJoinNode
        );
        const saved = createMagicGraphPresetSnapshot(
            'Connected',
            graph,
            () => 'connected'
        );

        expect(join).toBeDefined();
        expect(resolveMagicCircleConnectionJoinSlotIndex(
            graph.nodes,
            'edge-connected'
        )).toBe(1);
        expect(saved && saved.edges[0].joinSlotIndex).toBe(1);
        expect(saved && saved.nodes.some(node =>
            node.magicType ===
                CIRCLE_SYSTEM_MAGIC_NODE_TYPES.CONNECTION_JOIN
        )).toBe(false);
    });

    it('does not create a user preset without a label or user node', () => {
        expect(createMagicGraphPresetSnapshot(
            '',
            { nodes: [], edges: [] }
        )).toBe(false);
        expect(createMagicGraphPresetSnapshot('Empty', {
            nodes: createMagicGraphFromPreset(preset).nodes.slice(0, 1),
            edges: [],
        })).toBe(false);
    });

    it('saves, loads, and deletes versioned user presets', () => {
        const storage = new MemoryStorage();
        storage.setItem(
            'beautiful-galileo.magicGraphPresets.v5',
            JSON.stringify([preset])
        );

        expect(loadStoredMagicGraphPresets(storage)).toEqual({
            status: 'success',
            presets: [],
            issues: [],
        });
        expect(saveStoredMagicGraphPreset(pairedPreset, storage))
            .toEqual({
                status: 'success',
                presets: [pairedPreset],
                issues: [],
            });
        expect(storage.getItem(
            MAGIC_GRAPH_PRESET_STORAGE_CONFIG.CURRENT_KEY
        ))
            .not.toBeNull();
        expect(loadStoredMagicGraphPresets(storage)).toEqual({
            status: 'success',
            presets: [pairedPreset],
            issues: [],
        });
        expect(deleteStoredMagicGraphPreset(pairedPreset.id, storage))
            .toEqual({
                status: 'success',
                presets: [],
                issues: [],
            });
    });

    it('loads optional manifestation caption settings from v6 storage', () => {
        const storage = new MemoryStorage();
        const captionedPreset: MagicGraphPresetConfig = {
            ...preset,
            circles: [{
                ...preset.circles[0],
                systemNodeSlots: [{
                    ...preset.circles[0].systemNodeSlots[0],
                    settings: { caption: '저장된 발현' },
                }],
            }],
        };

        expect(saveStoredMagicGraphPreset(captionedPreset, storage))
            .toEqual({
                status: 'success',
                presets: [captionedPreset],
                issues: [],
            });
        expect(loadStoredMagicGraphPresets(storage))
            .toEqual({
                status: 'success',
                presets: [captionedPreset],
                issues: [],
            });
    });

    it('rejects malformed stored control pairs', () => {
        const storage = new MemoryStorage();
        storage.setItem(
            'beautiful-galileo.magicGraphPresets.v6',
            JSON.stringify([{
                ...pairedPreset,
                nodes: pairedPreset.nodes.slice(0, 2),
            }])
        );

        expect(loadStoredMagicGraphPresets(storage)).toMatchObject({
            status: 'failure',
            presets: [],
        });
    });

    it('creates source-qualified preset options', () => {
        const option = createMagicGraphPresetOption(
            {
                ...preset,
                systemNodePositions: [],
            } as unknown as MagicGraphPresetConfig,
            MAGIC_GRAPH_PRESET_SOURCES.USER
        );

        expect(option).toMatchObject({
            value: 'user:test-preset',
            label: 'Test Preset',
            source: MAGIC_GRAPH_PRESET_SOURCES.USER,
        });
        expect(option.preset).not.toHaveProperty('systemNodePositions');
    });
});
