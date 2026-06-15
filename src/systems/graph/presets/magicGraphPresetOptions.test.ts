import { describe, expect, it } from 'vitest';
import type { MagicGraphPresetConfig } from '../../../types/magic';
import {
    MAGIC_GRAPH_PRESET_SOURCES,
    createMagicGraphPresetOptionValue,
} from './magicGraphPresets';
import {
    createMagicGraphPresetOptions,
    resolveMagicGraphPresetSelection,
} from './magicGraphPresetOptions';

const builtInPreset = {
    id: 'built-in',
    label: 'Built In',
    nodes: [],
    edges: [],
} satisfies MagicGraphPresetConfig;
const userPreset = {
    id: 'user-one',
    label: 'User One',
    nodes: [],
    edges: [],
} satisfies MagicGraphPresetConfig;

describe('magicGraphPresetOptions', () => {
    it('combines built-in and user presets with stable option values', () => {
        expect(createMagicGraphPresetOptions([builtInPreset], [userPreset])).toMatchObject([
            {
                value: createMagicGraphPresetOptionValue(MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN, builtInPreset.id),
                label: builtInPreset.label,
                source: MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN,
            },
            {
                value: createMagicGraphPresetOptionValue(MAGIC_GRAPH_PRESET_SOURCES.USER, userPreset.id),
                label: userPreset.label,
                source: MAGIC_GRAPH_PRESET_SOURCES.USER,
            },
        ]);
    });

    it('resolves selected preset metadata', () => {
        const options = createMagicGraphPresetOptions([builtInPreset], [userPreset]);

        expect(resolveMagicGraphPresetSelection(options, options[1].value)).toMatchObject({
            selectedPresetOption: options[1],
            selectedPresetIsUser: true,
        });
        expect(resolveMagicGraphPresetSelection(options, 'missing')).toEqual({
            selectedPresetOption: undefined,
            selectedPresetIsUser: false,
        });
    });
});
