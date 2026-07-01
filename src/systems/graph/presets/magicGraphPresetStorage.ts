import {
    type MagicGraphPresetConfig,
} from './magicGraphPresetTypes';
import { magicTypeMap } from '../registry/magicTypeRegistry';
import { decodeStoredMagicGraphPreset } from './magicGraphStoredPreset';

export const MAGIC_GRAPH_PRESET_STORAGE_CONFIG = {
    CURRENT_KEY: 'beautiful-galileo.magicGraphPresets.v7',
    LEGACY_V6_KEY: 'beautiful-galileo.magicGraphPresets.v6',
    ENVELOPE_VERSION: 1,
} as const;

export const MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES = {
    UNAVAILABLE: 'unavailable',
    READ_FAILED: 'read-failed',
    INVALID_JSON: 'invalid-json',
    INVALID_ENVELOPE: 'invalid-envelope',
    INVALID_LEGACY_DATA: 'invalid-legacy-data',
    UNSUPPORTED_VERSION: 'unsupported-version',
    INVALID_PRESETS: 'invalid-presets',
    WRITE_FAILED: 'write-failed',
    MIGRATION_WRITE_FAILED: 'migration-write-failed',
} as const;

export const MAGIC_GRAPH_PRESET_STORAGE_STATUSES = {
    SUCCESS: 'success',
    WARNING: 'warning',
    FAILURE: 'failure',
} as const;

export type MagicGraphPresetStorageIssueCode =
    (typeof MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES)[keyof typeof MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES];

export interface MagicGraphPresetStorageIssue {
    code: MagicGraphPresetStorageIssueCode;
    invalidPresetCount?: number;
    version?: number;
}

export type MagicGraphPresetStorageResult =
    | {
        status: typeof MAGIC_GRAPH_PRESET_STORAGE_STATUSES.SUCCESS;
        presets: MagicGraphPresetConfig[];
        issues: readonly [];
    }
    | {
        status: typeof MAGIC_GRAPH_PRESET_STORAGE_STATUSES.WARNING;
        presets: MagicGraphPresetConfig[];
        issues: readonly MagicGraphPresetStorageIssue[];
    }
    | {
        status: typeof MAGIC_GRAPH_PRESET_STORAGE_STATUSES.FAILURE;
        presets: MagicGraphPresetConfig[];
        issues: readonly MagicGraphPresetStorageIssue[];
    };

interface StoredMagicGraphPresetEnvelope {
    version: typeof MAGIC_GRAPH_PRESET_STORAGE_CONFIG.ENVELOPE_VERSION;
    presets: MagicGraphPresetConfig[];
}

export function loadStoredMagicGraphPresets(
    storage: Storage | undefined = getMagicGraphPresetStorage()
): MagicGraphPresetStorageResult {
    if (!storage) {
        return failure({
            code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.UNAVAILABLE,
        });
    }

    const currentRaw = readStorageValue(
        storage,
        MAGIC_GRAPH_PRESET_STORAGE_CONFIG.CURRENT_KEY
    );
    if (!currentRaw.ok) return failure(currentRaw.issue);
    if (currentRaw.value !== null) {
        return decodeCurrentEnvelope(currentRaw.value);
    }

    const legacyRaw = readStorageValue(
        storage,
        MAGIC_GRAPH_PRESET_STORAGE_CONFIG.LEGACY_V6_KEY
    );
    if (!legacyRaw.ok) return failure(legacyRaw.issue);
    if (legacyRaw.value === null) return success([]);

    const migrated = decodeLegacyPresetArray(legacyRaw.value);
    if (
        migrated.status === MAGIC_GRAPH_PRESET_STORAGE_STATUSES.FAILURE
    ) {
        return migrated;
    }

    const migrationIssue = writeCurrentEnvelope(storage, migrated.presets);
    if (!migrationIssue) return migrated;

    return warning(
        migrated.presets,
        ...migrated.issues,
        {
            code:
                MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.MIGRATION_WRITE_FAILED,
        }
    );
}

export function saveStoredMagicGraphPreset(
    preset: MagicGraphPresetConfig,
    storage: Storage | undefined = getMagicGraphPresetStorage()
): MagicGraphPresetStorageResult {
    const loaded = loadStoredMagicGraphPresets(storage);
    if (loaded.status === MAGIC_GRAPH_PRESET_STORAGE_STATUSES.FAILURE) {
        return loaded;
    }

    const decodedPreset = decodeStoredMagicGraphPreset(
        preset,
        magicTypeMap
    );
    if (!decodedPreset) {
        return failure(
            {
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_PRESETS,
                invalidPresetCount: 1,
            },
            loaded.presets
        );
    }

    const normalizedPreset = decodedPreset;
    const existingIndex = loaded.presets.findIndex(item =>
        item.id === normalizedPreset.id
    );
    const nextPresets = existingIndex >= 0
        ? loaded.presets.map(item =>
            item.id === normalizedPreset.id ? normalizedPreset : item
        )
        : [...loaded.presets, normalizedPreset];

    return persistMutation(storage, loaded.presets, nextPresets);
}

export function deleteStoredMagicGraphPreset(
    presetId: string,
    storage: Storage | undefined = getMagicGraphPresetStorage()
): MagicGraphPresetStorageResult {
    const loaded = loadStoredMagicGraphPresets(storage);
    if (loaded.status === MAGIC_GRAPH_PRESET_STORAGE_STATUSES.FAILURE) {
        return loaded;
    }

    const nextPresets = loaded.presets.filter(preset =>
        preset.id !== presetId
    );
    return persistMutation(storage, loaded.presets, nextPresets);
}

function decodeCurrentEnvelope(
    serialized: string
): MagicGraphPresetStorageResult {
    const parsed = parseJson(serialized);
    if (!parsed.ok) return failure(parsed.issue);
    if (!isRecord(parsed.value)) {
        return failure({
            code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_ENVELOPE,
        });
    }
    if (
        parsed.value.version !==
        MAGIC_GRAPH_PRESET_STORAGE_CONFIG.ENVELOPE_VERSION
    ) {
        return failure({
            code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.UNSUPPORTED_VERSION,
            ...(typeof parsed.value.version === 'number'
                ? { version: parsed.value.version }
                : {}),
        });
    }
    if (!Array.isArray(parsed.value.presets)) {
        return failure({
            code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_ENVELOPE,
        });
    }

    return decodePresetEntries(parsed.value.presets);
}

function decodeLegacyPresetArray(
    serialized: string
): MagicGraphPresetStorageResult {
    const parsed = parseJson(serialized);
    if (!parsed.ok) {
        return failure({
            code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_LEGACY_DATA,
        });
    }
    if (!Array.isArray(parsed.value)) {
        return failure({
            code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_LEGACY_DATA,
        });
    }

    return decodePresetEntries(parsed.value);
}

function decodePresetEntries(
    entries: readonly unknown[]
): MagicGraphPresetStorageResult {
    const presets: MagicGraphPresetConfig[] = [];
    let invalidPresetCount = 0;

    entries.forEach(entry => {
        const decoded = decodeStoredMagicGraphPreset(entry, magicTypeMap);
        if (decoded) {
            presets.push(decoded);
        } else {
            invalidPresetCount += 1;
        }
    });

    if (invalidPresetCount === 0) return success(presets);

    const issue = {
        code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_PRESETS,
        invalidPresetCount,
    } as const;
    return presets.length > 0
        ? warning(presets, issue)
        : failure(issue);
}

function persistMutation(
    storage: Storage | undefined,
    previousPresets: MagicGraphPresetConfig[],
    nextPresets: MagicGraphPresetConfig[]
): MagicGraphPresetStorageResult {
    if (!storage) {
        return failure(
            {
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.UNAVAILABLE,
            },
            previousPresets
        );
    }

    const issue = writeCurrentEnvelope(storage, nextPresets);
    return issue
        ? failure(issue, previousPresets)
        : success(nextPresets);
}

function writeCurrentEnvelope(
    storage: Storage,
    presets: MagicGraphPresetConfig[]
): MagicGraphPresetStorageIssue | undefined {
    const envelope: StoredMagicGraphPresetEnvelope = {
        version: MAGIC_GRAPH_PRESET_STORAGE_CONFIG.ENVELOPE_VERSION,
        presets,
    };

    try {
        storage.setItem(
            MAGIC_GRAPH_PRESET_STORAGE_CONFIG.CURRENT_KEY,
            JSON.stringify(envelope)
        );
        return undefined;
    } catch {
        return {
            code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.WRITE_FAILED,
        };
    }
}

function readStorageValue(
    storage: Storage,
    key: string
):
    | { ok: true; value: string | null }
    | { ok: false; issue: MagicGraphPresetStorageIssue } {
    try {
        return { ok: true, value: storage.getItem(key) };
    } catch {
        return {
            ok: false,
            issue: {
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.READ_FAILED,
            },
        };
    }
}

function parseJson(
    serialized: string
):
    | { ok: true; value: unknown }
    | { ok: false; issue: MagicGraphPresetStorageIssue } {
    try {
        return { ok: true, value: JSON.parse(serialized) };
    } catch {
        return {
            ok: false,
            issue: {
                code: MAGIC_GRAPH_PRESET_STORAGE_ISSUE_CODES.INVALID_JSON,
            },
        };
    }
}

function getMagicGraphPresetStorage(): Storage | undefined {
    if (typeof localStorage === 'undefined') return undefined;

    return localStorage;
}

function success(
    presets: MagicGraphPresetConfig[]
): MagicGraphPresetStorageResult {
    return {
        status: MAGIC_GRAPH_PRESET_STORAGE_STATUSES.SUCCESS,
        presets,
        issues: [],
    };
}

function warning(
    presets: MagicGraphPresetConfig[],
    ...issues: MagicGraphPresetStorageIssue[]
): MagicGraphPresetStorageResult {
    return {
        status: MAGIC_GRAPH_PRESET_STORAGE_STATUSES.WARNING,
        presets,
        issues,
    };
}

function failure(
    issue: MagicGraphPresetStorageIssue,
    presets: MagicGraphPresetConfig[] = []
): MagicGraphPresetStorageResult {
    return {
        status: MAGIC_GRAPH_PRESET_STORAGE_STATUSES.FAILURE,
        presets,
        issues: [issue],
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
