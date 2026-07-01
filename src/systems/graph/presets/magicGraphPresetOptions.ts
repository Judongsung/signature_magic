import {
    createMagicGraphPresetOption,
    MAGIC_GRAPH_PRESET_SOURCES,
    type MagicGraphPresetOption,
} from './magicGraphPresets';
import {
    type MagicGraphPresetConfig,
} from './magicGraphPresetTypes';

export interface MagicGraphPresetSelection {
    selectedPresetOption?: MagicGraphPresetOption;
    selectedPresetIsUser: boolean;
}

export function createMagicGraphPresetOptions(
    builtInPresets: readonly MagicGraphPresetConfig[],
    userPresets: readonly MagicGraphPresetConfig[]
): MagicGraphPresetOption[] {
    return [
        ...builtInPresets.map(preset =>
            createMagicGraphPresetOption(preset, MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN)
        ),
        ...userPresets.map(preset =>
            createMagicGraphPresetOption(preset, MAGIC_GRAPH_PRESET_SOURCES.USER)
        ),
    ];
}

export function resolveMagicGraphPresetSelection(
    presetOptions: readonly MagicGraphPresetOption[],
    selectedPresetValue: string
): MagicGraphPresetSelection {
    const selectedPresetOption = presetOptions.find(option => option.value === selectedPresetValue);

    return {
        selectedPresetOption,
        selectedPresetIsUser: selectedPresetOption?.source === MAGIC_GRAPH_PRESET_SOURCES.USER,
    };
}
