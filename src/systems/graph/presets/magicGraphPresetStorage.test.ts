import { describe, expect, it } from 'vitest';
import {
    type MagicGraphPresetConfig,
} from './magicGraphPresetTypes';
import {
    MAGIC_GRAPH_PRESET_STORAGE_CONFIG,
    MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES,
    deleteStoredMagicGraphPreset,
    loadStoredMagicGraphPresets,
    saveStoredMagicGraphPreset,
} from './magicGraphPresetStorage';

const PRESET = {
    id: 'stored-preset',
    label: 'Stored Preset',
    circles: [],
    nodes: [],
    edges: [],
} satisfies MagicGraphPresetConfig;

const FAN_OUT_PRESET = {
    id: 'fan-out-preset',
    label: 'Fan out',
    circles: ['source', 'left', 'right'].map((id, index) => ({
        id,
        position: { x: index * 520, y: 0 },
        width: 480,
        height: 400,
        systemNodeSlots: [{
            magicType: 'manifestation' as const,
            slotIndex: 0,
        }],
    })),
    nodes: [],
    edges: [
        {
            id: 'source-left',
            source: 'source',
            target: 'left',
            sourceHandle: 'circle-output',
            targetHandle: 'circle-input',
        },
        {
            id: 'source-right',
            source: 'source',
            target: 'right',
            sourceHandle: 'circle-output-1',
            targetHandle: 'circle-input',
        },
    ],
} satisfies MagicGraphPresetConfig;

class MemoryStorage implements Storage {
    private readonly values = new Map<string, string>();
    throwOnGet = false;
    throwOnSet = false;

    get length(): number {
        return this.values.size;
    }

    clear(): void {
        this.values.clear();
    }

    getItem(key: string): string | null {
        if (this.throwOnGet) throw new Error('read failed');
        return this.values.get(key) ?? null;
    }

    key(index: number): string | null {
        return [...this.values.keys()][index] ?? null;
    }

    removeItem(key: string): void {
        this.values.delete(key);
    }

    setItem(key: string, value: string): void {
        if (this.throwOnSet) throw new Error('write failed');
        this.values.set(key, value);
    }
}

function setCurrentEnvelope(
    storage: Storage,
    presets: unknown[],
    version: number = MAGIC_GRAPH_PRESET_STORAGE_CONFIG.ENVELOPE_VERSION
): void {
    storage.setItem(
        MAGIC_GRAPH_PRESET_STORAGE_CONFIG.CURRENT_KEY,
        JSON.stringify({ version, presets })
    );
}

describe('magicGraphPresetStorage', () => {
    it('strips an empty legacy system-node position field', () => {
        const storage = new MemoryStorage();
        setCurrentEnvelope(storage, [{
            ...PRESET,
            systemNodePositions: [],
        }]);

        expect(loadStoredMagicGraphPresets(storage)).toEqual({
            status: 'success',
            presets: [PRESET],
            issues: [],
        });
    });

    it('rejects legacy system-node positions containing entries', () => {
        const storage = new MemoryStorage();
        setCurrentEnvelope(storage, [{
            ...PRESET,
            systemNodePositions: [{
                id: 'legacy-system-node',
                position: { x: 0, y: 0 },
            }],
        }]);

        expect(loadStoredMagicGraphPresets(storage)).toMatchObject({
            status: 'failure',
            presets: [],
            issues: [{
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_PRESETS,
                invalidPresetCount: 1,
            }],
        });
    });

    it('rejects presets containing the removed invert unit magic', () => {
        const storage = new MemoryStorage();
        setCurrentEnvelope(storage, [{
            id: 'removed-invert-preset',
            label: 'Removed invert',
            circles: [{
                id: 'circle',
                position: { x: 0, y: 0 },
                width: 480,
                height: 400,
                systemNodeSlots: [{
                    magicType: 'manifestation',
                    slotIndex: 1,
                }],
            }],
            nodes: [{
                id: 'invert-node',
                magicType: 'invert',
                circleId: 'circle',
                sequenceIndex: 0,
            }],
            edges: [],
        }]);

        expect(loadStoredMagicGraphPresets(storage)).toMatchObject({
            status: 'failure',
            presets: [],
            issues: [{
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_PRESETS,
                invalidPresetCount: 1,
            }],
        });
    });

    it('migrates legacy v6 arrays into a versioned v7 envelope', () => {
        const storage = new MemoryStorage();
        const legacy = JSON.stringify([PRESET]);
        storage.setItem(
            MAGIC_GRAPH_PRESET_STORAGE_CONFIG.LEGACY_V6_KEY,
            legacy
        );

        expect(loadStoredMagicGraphPresets(storage)).toEqual({
            status: 'success',
            presets: [PRESET],
            issues: [],
        });
        expect(storage.getItem(
            MAGIC_GRAPH_PRESET_STORAGE_CONFIG.LEGACY_V6_KEY
        )).toBe(legacy);
        expect(JSON.parse(storage.getItem(
            MAGIC_GRAPH_PRESET_STORAGE_CONFIG.CURRENT_KEY
        )!)).toEqual({
            version: MAGIC_GRAPH_PRESET_STORAGE_CONFIG.ENVELOPE_VERSION,
            presets: [PRESET],
        });
    });

    it('keeps valid entries and reports partial corruption', () => {
        const storage = new MemoryStorage();
        setCurrentEnvelope(storage, [PRESET, { id: 'invalid' }]);

        expect(loadStoredMagicGraphPresets(storage)).toEqual({
            status: 'warning',
            presets: [PRESET],
            issues: [{
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_PRESETS,
                invalidPresetCount: 1,
            }],
        });
    });

    it('keeps valid entries and rejects stored circle fan-out', () => {
        const storage = new MemoryStorage();
        setCurrentEnvelope(storage, [PRESET, FAN_OUT_PRESET]);

        expect(loadStoredMagicGraphPresets(storage)).toEqual({
            status: 'warning',
            presets: [PRESET],
            issues: [{
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_PRESETS,
                invalidPresetCount: 1,
            }],
        });
    });

    it('blocks all-invalid and unsupported current envelopes', () => {
        const invalidStorage = new MemoryStorage();
        setCurrentEnvelope(invalidStorage, [{ id: 'invalid' }]);

        expect(loadStoredMagicGraphPresets(invalidStorage)).toMatchObject({
            status: 'failure',
            presets: [],
            issues: [{
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_PRESETS,
            }],
        });

        const futureStorage = new MemoryStorage();
        setCurrentEnvelope(futureStorage, [PRESET], 99);
        futureStorage.setItem(
            MAGIC_GRAPH_PRESET_STORAGE_CONFIG.LEGACY_V6_KEY,
            JSON.stringify([PRESET])
        );

        expect(loadStoredMagicGraphPresets(futureStorage)).toEqual({
            status: 'failure',
            presets: [],
            issues: [{
                code:
                    MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.UNSUPPORTED_VERSION,
                version: 99,
            }],
        });
    });

    it('treats malformed current data as authoritative failure', () => {
        const storage = new MemoryStorage();
        storage.setItem(
            MAGIC_GRAPH_PRESET_STORAGE_CONFIG.CURRENT_KEY,
            '{not-json'
        );
        storage.setItem(
            MAGIC_GRAPH_PRESET_STORAGE_CONFIG.LEGACY_V6_KEY,
            JSON.stringify([PRESET])
        );

        expect(loadStoredMagicGraphPresets(storage)).toEqual({
            status: 'failure',
            presets: [],
            issues: [{
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_JSON,
            }],
        });
    });

    it('reports read and migration write failures without hiding presets', () => {
        const readFailureStorage = new MemoryStorage();
        readFailureStorage.throwOnGet = true;
        expect(loadStoredMagicGraphPresets(readFailureStorage)).toEqual({
            status: 'failure',
            presets: [],
            issues: [{
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.READ_FAILED,
            }],
        });

        const migrationFailureStorage = new MemoryStorage();
        migrationFailureStorage.setItem(
            MAGIC_GRAPH_PRESET_STORAGE_CONFIG.LEGACY_V6_KEY,
            JSON.stringify([PRESET])
        );
        migrationFailureStorage.throwOnSet = true;

        expect(loadStoredMagicGraphPresets(migrationFailureStorage))
            .toEqual({
                status: 'warning',
                presets: [PRESET],
                issues: [{
                    code:
                        MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.MIGRATION_WRITE_FAILED,
                }],
            });
    });

    it('writes mutations as envelopes and preserves state on failure', () => {
        const storage = new MemoryStorage();

        expect(saveStoredMagicGraphPreset(PRESET, storage)).toEqual({
            status: 'success',
            presets: [PRESET],
            issues: [],
        });
        expect(deleteStoredMagicGraphPreset(PRESET.id, storage)).toEqual({
            status: 'success',
            presets: [],
            issues: [],
        });

        setCurrentEnvelope(storage, [PRESET]);
        storage.throwOnSet = true;
        expect(deleteStoredMagicGraphPreset(PRESET.id, storage)).toEqual({
            status: 'failure',
            presets: [PRESET],
            issues: [{
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.WRITE_FAILED,
            }],
        });
    });
});
