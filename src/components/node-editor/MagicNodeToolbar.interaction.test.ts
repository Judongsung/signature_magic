// @vitest-environment happy-dom
import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { MagicNodeCategory } from '../../constants/gameConfigs';
import {
    MAGIC_NODE_CATEGORY_LABELS,
    NODE_EDITOR_TEXT,
} from '../../constants/uiText';
import type { MagicType, MagicTypeConfig } from '../../types/magic';
import MagicNodeToolbar from './MagicNodeToolbar.svelte';

const TEST_MAGIC_TYPE = {
    type: 'ignition',
    label: 'Ignition',
    icon: '*',
    color: '#e74c3c',
    category: 'basic',
    description: 'Starts a fire effect.',
} satisfies MagicTypeConfig;

type ToggleCategoryHandler = (categoryId: MagicNodeCategory) => void;
type AddNodeHandler = (magicType: MagicType) => void;
type DragStartHandler = (event: DragEvent, magicType: MagicType) => void;
type ClearHandler = () => void;

type ToolbarProps = {
    activeCategoryIds: MagicNodeCategory[];
    visibleMagicTypes: MagicTypeConfig[];
    onToggleCategory: Mock<ToggleCategoryHandler>;
    onAddNode: Mock<AddNodeHandler>;
    onDragStart: Mock<DragStartHandler>;
    onClear: Mock<ClearHandler>;
    onOpenPresetDialog: Mock<ClearHandler>;
};

let mountedToolbar: Record<string, unknown> | undefined;

function createToolbarProps(overrides: Partial<ToolbarProps> = {}): ToolbarProps {
    return {
        activeCategoryIds: ['basic'],
        visibleMagicTypes: [TEST_MAGIC_TYPE],
        onToggleCategory: vi.fn<ToggleCategoryHandler>(),
        onAddNode: vi.fn<AddNodeHandler>(),
        onDragStart: vi.fn<DragStartHandler>(),
        onClear: vi.fn<ClearHandler>(),
        onOpenPresetDialog: vi.fn<ClearHandler>(),
        ...overrides,
    };
}

function mountToolbar(props: ToolbarProps = createToolbarProps()) {
    const target = document.createElement('div');
    document.body.append(target);

    mountedToolbar = mount(MagicNodeToolbar, {
        target,
        props,
    });

    return { target, props };
}

async function unmountToolbar(): Promise<void> {
    if (!mountedToolbar) return;

    await unmount(mountedToolbar);
    mountedToolbar = undefined;
}

function getButtonByText(target: ParentNode, text: string): HTMLButtonElement {
    const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button'))
        .find(candidate => candidate.textContent?.trim().includes(text));
    expect(button).toBeDefined();

    return button as HTMLButtonElement;
}

afterEach(async () => {
    await unmountToolbar();
    document.body.replaceChildren();
});

describe('MagicNodeToolbar interaction', () => {
    it('calls onToggleCategory when a category tab is clicked', () => {
        const { target, props } = mountToolbar();

        getButtonByText(target, MAGIC_NODE_CATEGORY_LABELS.basic).click();

        expect(props.onToggleCategory).toHaveBeenCalledTimes(1);
        expect(props.onToggleCategory).toHaveBeenCalledWith('basic');
    });

    it('calls onAddNode when a magic type action is clicked', () => {
        const { target, props } = mountToolbar();

        getButtonByText(target, TEST_MAGIC_TYPE.label).click();

        expect(props.onAddNode).toHaveBeenCalledTimes(1);
        expect(props.onAddNode).toHaveBeenCalledWith(TEST_MAGIC_TYPE.type);
    });

    it('forwards dragstart with dataTransfer to the owner callback', () => {
        const { target, props } = mountToolbar();
        const dataTransfer = {
            effectAllowed: 'uninitialized',
            setData: vi.fn(),
        };
        const dragEvent = new Event('dragstart', {
            bubbles: true,
            cancelable: true,
        }) as DragEvent;
        Object.defineProperty(dragEvent, 'dataTransfer', {
            value: dataTransfer,
        });

        getButtonByText(target, TEST_MAGIC_TYPE.label).dispatchEvent(dragEvent);

        expect(props.onDragStart).toHaveBeenCalledTimes(1);
        expect(props.onDragStart).toHaveBeenCalledWith(dragEvent, TEST_MAGIC_TYPE.type);
        expect((props.onDragStart.mock.calls[0][0] as DragEvent).dataTransfer).toBe(dataTransfer);
    });

    it('calls onClear when the clear button is clicked', () => {
        const { target, props } = mountToolbar();

        getButtonByText(target, NODE_EDITOR_TEXT.CLEAR_ALL).click();

        expect(props.onClear).toHaveBeenCalledTimes(1);
    });

    it('opens the preset dialog from the preset button', () => {
        const { target, props } = mountToolbar();

        getButtonByText(target, NODE_EDITOR_TEXT.PRESET_OPEN).click();

        expect(props.onOpenPresetDialog).toHaveBeenCalledTimes(1);
    });
});
