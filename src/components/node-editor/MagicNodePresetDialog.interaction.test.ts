// @vitest-environment happy-dom
import { mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { NODE_EDITOR_TEXT } from '../../constants/uiText';
import {
    getButtonByText,
    getDialogElement,
} from '../../test-utils/componentQueries';
import {
    MAGIC_GRAPH_PRESET_SOURCES,
    type MagicGraphPresetOption,
} from '../../systems/graph/presets/magicGraphPresets';
import MagicNodePresetDialog from './MagicNodePresetDialog.svelte';

type VoidHandler = () => void;
type LoadHandler = () => boolean;
type SaveHandler = (label: string) => void;
type SelectHandler = (value: string) => void;

type DialogProps = {
    presetOptions: MagicGraphPresetOption[];
    selectedPresetValue: string;
    canLoadPreset: boolean;
    canSavePreset: boolean;
    canDeletePreset: boolean;
    onSelectPreset: Mock<SelectHandler>;
    onLoadPreset: Mock<LoadHandler>;
    onSavePreset: Mock<SaveHandler>;
    onDeletePreset: Mock<VoidHandler>;
    onClose: Mock<VoidHandler>;
};

const PRESET_OPTIONS: MagicGraphPresetOption[] = [
    {
        value: 'builtIn:fire-bolt',
        label: '화염 화살',
        source: MAGIC_GRAPH_PRESET_SOURCES.BUILT_IN,
        preset: { id: 'fire-bolt', label: '화염 화살', nodes: [], edges: [] },
    },
    {
        value: 'user:user-preset-1',
        label: '저장한 조합',
        source: MAGIC_GRAPH_PRESET_SOURCES.USER,
        preset: { id: 'user-preset-1', label: '저장한 조합', nodes: [], edges: [] },
    },
];

let mountedDialog: Record<string, unknown> | undefined;

function createDialogProps(overrides: Partial<DialogProps> = {}): DialogProps {
    return {
        presetOptions: PRESET_OPTIONS,
        selectedPresetValue: PRESET_OPTIONS[0].value,
        canLoadPreset: true,
        canSavePreset: true,
        canDeletePreset: true,
        onSelectPreset: vi.fn<SelectHandler>(),
        onLoadPreset: vi.fn<LoadHandler>(() => true),
        onSavePreset: vi.fn<SaveHandler>(),
        onDeletePreset: vi.fn<VoidHandler>(),
        onClose: vi.fn<VoidHandler>(),
        ...overrides,
    };
}

function mountDialog(props: DialogProps = createDialogProps()) {
    const target = document.createElement('div');
    document.body.append(target);

    mountedDialog = mount(MagicNodePresetDialog, {
        target,
        props,
    });

    return { target, props };
}

async function unmountDialog(): Promise<void> {
    if (!mountedDialog) return;

    await unmount(mountedDialog);
    mountedDialog = undefined;
}

function getPresetButton(target: ParentNode, label: string): HTMLButtonElement {
    const button = Array.from(target.querySelectorAll<HTMLButtonElement>('.preset-list-item'))
        .find(candidate => candidate.textContent?.trim() === label);
    expect(button).toBeDefined();

    return button as HTMLButtonElement;
}

afterEach(async () => {
    await unmountDialog();
    document.body.replaceChildren();
});

describe('MagicNodePresetDialog interaction', () => {
    it('moves focus to the dialog and restores the trigger focus after unmount', async () => {
        const triggerButton = document.createElement('button');
        document.body.append(triggerButton);
        triggerButton.focus();

        const { target } = mountDialog();
        await tick();

        expect(document.activeElement).toBe(getDialogElement(target));

        await unmountDialog();

        expect(document.activeElement).toBe(triggerButton);
    });

    it('selects presets from the list', () => {
        const { target, props } = mountDialog();

        getPresetButton(target, '저장한 조합').click();

        expect(props.onSelectPreset).toHaveBeenCalledTimes(1);
        expect(props.onSelectPreset).toHaveBeenCalledWith(PRESET_OPTIONS[1].value);
    });

    it('loads selected presets and closes only when loading succeeds', () => {
        const { target, props } = mountDialog();

        getButtonByText(target, NODE_EDITOR_TEXT.PRESET_LOAD).click();

        expect(props.onLoadPreset).toHaveBeenCalledTimes(1);
        expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('loads immediately without showing a replacement confirmation message', async () => {
        const { target, props } = mountDialog();

        getButtonByText(target, NODE_EDITOR_TEXT.PRESET_LOAD).click();
        await tick();

        expect(props.onLoadPreset).toHaveBeenCalledTimes(1);
        expect(props.onClose).toHaveBeenCalledTimes(1);
        expect(target.textContent).not.toContain('현재 조합을 프리셋으로 교체할까요?');
    });

    it('keeps the dialog open when loading is cancelled', () => {
        const { target, props } = mountDialog(createDialogProps({
            onLoadPreset: vi.fn<LoadHandler>(() => false),
        }));

        getButtonByText(target, NODE_EDITOR_TEXT.PRESET_LOAD).click();

        expect(props.onLoadPreset).toHaveBeenCalledTimes(1);
        expect(props.onClose).not.toHaveBeenCalled();
    });

    it('saves the current graph with the entered preset name', () => {
        const { target, props } = mountDialog();
        const input = target.querySelector<HTMLInputElement>('input');
        expect(input).toBeDefined();

        input!.value = '저장 테스트';
        input!.dispatchEvent(new Event('input', { bubbles: true }));
        target.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit', {
            bubbles: true,
            cancelable: true,
        }));

        expect(props.onSavePreset).toHaveBeenCalledTimes(1);
        expect(props.onSavePreset).toHaveBeenCalledWith('저장 테스트');
    });

    it('does not save when saving is unavailable', () => {
        const { target, props } = mountDialog(createDialogProps({ canSavePreset: false }));

        getButtonByText(target, NODE_EDITOR_TEXT.PRESET_SAVE).click();

        expect(props.onSavePreset).not.toHaveBeenCalled();
    });

    it('deletes user presets immediately without showing a confirmation message', async () => {
        const { target, props } = mountDialog();

        getButtonByText(target, NODE_EDITOR_TEXT.PRESET_DELETE).click();
        await tick();

        expect(props.onDeletePreset).toHaveBeenCalledTimes(1);
        expect(target.textContent).not.toContain('선택한 사용자 프리셋을 삭제할까요?');
    });

    it('renders hover tooltip copy for destructive preset actions', () => {
        const { target } = mountDialog();

        expect(target.textContent).toContain(NODE_EDITOR_TEXT.PRESET_LOAD_TOOLTIP);
        expect(target.textContent).toContain(NODE_EDITOR_TEXT.PRESET_DELETE_TOOLTIP);
    });

    it('closes from Escape, backdrop click, and the internal close action', async () => {
        const { target, props } = mountDialog();
        await tick();

        window.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape',
            cancelable: true,
        }));
        expect(props.onClose).toHaveBeenCalledTimes(1);

        target.querySelector<HTMLButtonElement>('.preset-dialog-backdrop')?.click();
        expect(props.onClose).toHaveBeenCalledTimes(2);

        getButtonByText(target, NODE_EDITOR_TEXT.PRESET_CLOSE).click();
        expect(props.onClose).toHaveBeenCalledTimes(3);
    });

    it('keeps Tab focus inside the dialog', async () => {
        const { target } = mountDialog();
        await tick();

        const dialog = getDialogElement(target);
        const firstFocusable = dialog.querySelector<HTMLButtonElement>('.icon-close-btn');
        const closeButton = getButtonByText(target, NODE_EDITOR_TEXT.PRESET_CLOSE);
        expect(firstFocusable).toBeDefined();

        closeButton.focus();
        const tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
        });
        closeButton.dispatchEvent(tabEvent);

        expect(tabEvent.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(firstFocusable);
    });
});
