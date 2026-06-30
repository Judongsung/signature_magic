import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { NODE_EDITOR_TEXT } from '../../../constants/uiText';
import {
    MAGIC_GRAPH_PRESET_SOURCES,
    type MagicGraphPresetOption,
} from '../../../systems/graph/presets/magicGraphPresets';
import MagicNodePresetDialog from './MagicNodePresetDialog.svelte';

const presetOptions: MagicGraphPresetOption[] = [
    {
        value: 'builtIn:fire-bolt',
        label: '화염 화살',
        source: MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN,
        preset: { id: 'fire-bolt', label: '화염 화살', circles: [], nodes: [], edges: [] },
    },
    {
        value: 'user:user-preset-1',
        label: '저장한 조합',
        source: MAGIC_GRAPH_PRESET_SOURCES.USER,
        preset: { id: 'user-preset-1', label: '저장한 조합', circles: [], nodes: [], edges: [] },
    },
];

const props = {
    presetOptions,
    selectedPresetValue: presetOptions[0].value,
    canLoadPreset: true,
    canSavePreset: true,
    canDeletePreset: false,
    onSelectPreset: () => {},
    onLoadPreset: () => true,
    onSavePreset: () => {},
    onDeletePreset: () => {},
    onClose: () => {},
};

describe('MagicNodePresetDialog', () => {
    it('renders preset lists and modal semantics', () => {
        const { html } = render(MagicNodePresetDialog, { props });

        expect(html).toContain('role="dialog"');
        expect(html).toContain('aria-modal="true"');
        expect(html).toContain(NODE_EDITOR_TEXT.PRESET_DIALOG_TITLE);
        expect(html).toContain(NODE_EDITOR_TEXT.PRESET_BUILT_IN_GROUP_LABEL);
        expect(html).toContain(NODE_EDITOR_TEXT.PRESET_USER_GROUP_LABEL);
        expect(html).toContain('화염 화살');
        expect(html).toContain('저장한 조합');
        expect(html).toContain('aria-pressed="true"');
        expect(html).toContain(NODE_EDITOR_TEXT.PRESET_LOAD_TOOLTIP);
        expect(html).toContain(NODE_EDITOR_TEXT.PRESET_DELETE_TOOLTIP);
    });

    it('renders empty and disabled states', () => {
        const { html } = render(MagicNodePresetDialog, {
            props: {
                ...props,
                presetOptions: [presetOptions[0]],
                canLoadPreset: false,
                canSavePreset: false,
                canDeletePreset: false,
            },
        });

        expect(html).toContain(NODE_EDITOR_TEXT.PRESET_USER_EMPTY);
        expect(html).toContain(`>${NODE_EDITOR_TEXT.PRESET_LOAD}</button>`);
        expect(html).toContain(`>${NODE_EDITOR_TEXT.PRESET_SAVE}</button>`);
        expect(html).toContain(`>${NODE_EDITOR_TEXT.PRESET_DELETE}</button>`);
        expect(html.match(/disabled/g)?.length).toBeGreaterThanOrEqual(3);
    });

    it('renders storage warnings and errors inside the dialog', () => {
        const warning = render(MagicNodePresetDialog, {
            props: {
                ...props,
                storageNotice: {
                    level: 'warning',
                    operation: 'load',
                },
            },
        });
        expect(warning.html).toContain('role="status"');
        expect(warning.html).toContain(
            NODE_EDITOR_TEXT.PRESET_STORAGE_WARNING
        );

        const error = render(MagicNodePresetDialog, {
            props: {
                ...props,
                storageNotice: {
                    level: 'error',
                    operation: 'save',
                },
            },
        });
        expect(error.html).toContain('role="alert"');
        expect(error.html).toContain(
            NODE_EDITOR_TEXT.PRESET_STORAGE_SAVE_ERROR
        );
    });
});
